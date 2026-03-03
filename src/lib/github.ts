const SETTINGS_KEY = "github-sync-settings";
const TOKEN_KEY = "github-sync-token";
export const GITHUB_SYNC_EVENT = "github-sync-updated";

export type GithubSettings = {
  owner: string;
  repo: string;
  branch: string;
  dataPath: string;
  staticDataPath: string;
  uploadsDir: string;
  blogDir: string;
  committerName: string;
  committerEmail: string;
};

const DEFAULT_SETTINGS: GithubSettings = {
  owner: "",
  repo: "",
  branch: "main",
  dataPath: "data.json",
  staticDataPath: "",
  uploadsDir: "uploads",
  blogDir: "blog",
  committerName: "Linkable CMS",
  committerEmail: "cms@linkable.local",
};

const API_BASE = "https://api.github.com";
const isBrowser = typeof window !== "undefined";

const getStorage = () => (isBrowser ? window.localStorage : undefined);

const normalizeSettings = (input?: Partial<GithubSettings>): GithubSettings => ({
  owner: input?.owner?.trim() ?? "",
  repo: input?.repo?.trim() ?? "",
  branch: input?.branch?.trim() || "main",
  dataPath: input?.dataPath?.trim() || "data.json",
  staticDataPath: input?.staticDataPath?.trim() ?? "",
  uploadsDir: input?.uploadsDir?.trim() || "uploads",
  blogDir: input?.blogDir?.trim() || "blog",
  committerName: input?.committerName?.trim() || "Linkable CMS",
  committerEmail: input?.committerEmail?.trim() || "cms@linkable.local",
});

const dispatchSyncEvent = () => {
  if (!isBrowser) return;
  window.dispatchEvent(new Event(GITHUB_SYNC_EVENT));
};

/** Build-time env vars injected by Vite's `define` config. */
const envDefaults = (): Partial<GithubSettings> => ({
  owner: import.meta.env.VITE_GITHUB_OWNER || "",
  repo: import.meta.env.VITE_GITHUB_REPO || "",
  branch: import.meta.env.VITE_GITHUB_BRANCH || "main",
});

/**
 * Stale defaults from earlier versions that may be frozen in localStorage.
 * When detected, replace them with current defaults so pushes target the
 * correct paths in the content repo.
 */
const STALE_PATH_DEFAULTS: Record<string, string> = {
  dataPath: "cms-data.json",
  staticDataPath: "public/data.json",
  uploadsDir: "public/uploads",
};

const migrateStalePathDefaults = (
  parsed: Partial<GithubSettings>,
): Partial<GithubSettings> => {
  const migrated = { ...parsed };
  if (migrated.dataPath === STALE_PATH_DEFAULTS.dataPath) {
    migrated.dataPath = DEFAULT_SETTINGS.dataPath;
  }
  if (migrated.staticDataPath === STALE_PATH_DEFAULTS.staticDataPath) {
    migrated.staticDataPath = DEFAULT_SETTINGS.staticDataPath;
  }
  if (migrated.uploadsDir === STALE_PATH_DEFAULTS.uploadsDir) {
    migrated.uploadsDir = DEFAULT_SETTINGS.uploadsDir;
  }
  return migrated;
};

export const loadGithubSettings = (): GithubSettings => {
  const storage = getStorage();
  const env = envDefaults();

  if (!storage) {
    return normalizeSettings(env);
  }

  const raw = storage.getItem(SETTINGS_KEY);
  if (!raw) {
    // No saved settings — use env vars as defaults
    return normalizeSettings(env);
  }

  try {
    const parsed = migrateStalePathDefaults(
      JSON.parse(raw) as Partial<GithubSettings>,
    );
    // Merge: saved settings take priority, env vars fill in blanks
    return normalizeSettings({
      ...env,
      ...parsed,
      owner: parsed.owner?.trim() || env.owner,
      repo: parsed.repo?.trim() || env.repo,
      branch: parsed.branch?.trim() || env.branch,
    });
  } catch {
    return normalizeSettings(env);
  }
};

export const saveGithubSettings = (settings: GithubSettings): void => {
  const storage = getStorage();
  if (!storage) return;

  const normalized = normalizeSettings(settings);
  storage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
  dispatchSyncEvent();
};

export const getGithubToken = (): string => {
  const storage = getStorage();
  if (!storage) return "";
  return storage.getItem(TOKEN_KEY) ?? "";
};

export const saveGithubToken = (token: string): void => {
  const storage = getStorage();
  if (!storage) return;

  storage.setItem(TOKEN_KEY, token.trim());
  dispatchSyncEvent();
};

export const clearGithubToken = (): void => {
  const storage = getStorage();
  if (!storage) return;

  storage.removeItem(TOKEN_KEY);
  dispatchSyncEvent();
};

export const hasGithubSettings = (): boolean => {
  const settings = loadGithubSettings();
  return !!settings.owner && !!settings.repo && !!settings.branch && !!settings.dataPath;
};

export const canUseGithubSync = (): boolean => {
  const token = getGithubToken().trim();
  return !!token && hasGithubSettings();
};

type GithubCredentials = {
  settings: GithubSettings;
  token: string;
};

const ensureGithubCredentials = (): GithubCredentials => {
  const token = getGithubToken().trim();
  const settings = loadGithubSettings();

  if (!token) {
    throw new Error("Add a GitHub personal access token in settings to enable sync.");
  }

  if (!settings.owner || !settings.repo) {
    throw new Error("Configure a GitHub owner and repository before syncing.");
  }

  return { settings, token };
};

const encodeRepoPath = (input: string): string => {
  const sanitized = input.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  if (!sanitized) return "";
  return sanitized
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  const encoder = (globalThis as typeof globalThis & { btoa?: (input: string) => string }).btoa;
  if (typeof encoder !== "function") {
    throw new Error("Base64 encoding is unavailable in this environment.");
  }

  return encoder(binary);
};

const textToBase64 = (text: string): string => arrayBufferToBase64(new TextEncoder().encode(text).buffer);

type GithubContentMeta = { sha: string };

const requestHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
});

const fetchContentMeta = async (
  settings: GithubSettings,
  token: string,
  repoPath: string,
): Promise<GithubContentMeta | undefined> => {
  const encodedPath = encodeRepoPath(repoPath);
  const branch = settings.branch || "main";
  const response = await fetch(
    `${API_BASE}/repos/${settings.owner}/${settings.repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`,
    { headers: requestHeaders(token) },
  );

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as { sha?: string };
  return typeof payload.sha === "string" ? { sha: payload.sha } : undefined;
};

const commitBase64Content = async (
  settings: GithubSettings,
  token: string,
  repoPath: string,
  base64Content: string,
  message: string,
): Promise<void> => {
  const encodedPath = encodeRepoPath(repoPath || settings.dataPath);
  if (!encodedPath) {
    throw new Error("A repository path is required for GitHub sync.");
  }

  const url = `${API_BASE}/repos/${settings.owner}/${settings.repo}/contents/${encodedPath}`;
  const existing = await fetchContentMeta(settings, token, repoPath);

  const body: Record<string, unknown> = {
    message,
    content: base64Content,
    branch: settings.branch || "main",
  };

  if (existing?.sha) {
    body.sha = existing.sha;
  }

  if (settings.committerName && settings.committerEmail) {
    body.committer = { name: settings.committerName, email: settings.committerEmail };
  }

  console.warn("[Linkable] PUT", url, { branch: body.branch, sha: existing?.sha ?? "(new file)" });

  const response = await fetch(url, {
    method: "PUT",
    headers: { ...requestHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  console.warn("[Linkable] response", response.status, response.statusText);

  if (!response.ok) {
    let reason = `${response.status} ${response.statusText}`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) {
        reason = payload.message;
      }
    } catch {
      // ignore JSON parsing errors
    }
    throw new Error(`GitHub commit failed: ${reason}`);
  }
};

// ---------------------------------------------------------------------------
// pending uploads stored in localStorage (production only)

export type PendingUpload = {
  repoPath: string;
  publicPath: string;
  base64Content: string;
  fileName: string;
};

const PENDING_UPLOADS_KEY = "pending-uploads";

const loadPendingUploads = (): PendingUpload[] => {
  try {
    const raw = getStorage()?.getItem(PENDING_UPLOADS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingUpload[];
  } catch {
    return [];
  }
};

const savePendingUploads = (uploads: PendingUpload[]) => {
  try {
    getStorage()?.setItem(PENDING_UPLOADS_KEY, JSON.stringify(uploads));
  } catch {
    /* ignore */
  }
};

export const addPendingUpload = async (file: File): Promise<string> => {
  const { settings } = ensureGithubCredentials();
  const uploadsDir = normalizeUploadsDir(settings.uploadsDir || DEFAULT_SETTINGS.uploadsDir);

  // If the file already has a deterministic name (e.g. "avatar.jpg",
  // "<uuid>.jpg") use it directly so re-uploads replace the previous file.
  const isDeterministic = /^[a-zA-Z0-9_-]+\.jpg$/i.test(file.name);
  const fileName = isDeterministic ? file.name : generateUploadFileName(file.name || "image.png");
  const repoPath = uploadsDir ? `${uploadsDir}/${fileName}` : fileName;
  const publicPath = toPublicPath(settings.uploadsDir || DEFAULT_SETTINGS.uploadsDir, fileName);

  const buffer = await file.arrayBuffer();
  const base64Content = arrayBufferToBase64(buffer);

  // Replace any existing pending upload with the same publicPath so we don't
  // accumulate stale entries for the same deterministic slot.
  const uploads = loadPendingUploads().filter((u) => u.publicPath !== publicPath);
  uploads.push({ repoPath, publicPath, base64Content, fileName: file.name });
  savePendingUploads(uploads);

  return publicPath;
};

export const clearPendingUploads = (): void => {
  try {
    getStorage()?.removeItem(PENDING_UPLOADS_KEY);
  } catch {
    /* ignore */
  }
};

/**
 * If the given URL matches a pending (uncommitted) upload, return a
 * data-URI so the image can be previewed before committing.
 * Otherwise returns the original URL unchanged.
 */
export const resolveUploadUrl = (url: string): string => {
  if (!url) return url;
  const pending = loadPendingUploads();
  const match = pending.find((u) => u.publicPath === url);
  if (!match) return url;

  // Infer MIME from file extension
  const ext = (match.fileName || "").split(".").pop()?.toLowerCase() || "png";
  const mimeMap: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    avif: "image/avif",
  };
  const mime = mimeMap[ext] || "image/png";
  return `data:${mime};base64,${match.base64Content}`;
};

export const commitPendingUploads = async (
  settings: GithubSettings,
  token: string,
  usedPublicPaths: string[],
  message?: string,
): Promise<void> => {
  const pending = loadPendingUploads();
  if (pending.length === 0) return;

  const toCommit = pending.filter((u) => usedPublicPaths.includes(u.publicPath));
  for (const u of toCommit) {
    const msg = message ? `${message} (image ${u.fileName})` : `Upload image ${u.fileName}`;
    await commitBase64Content(settings, token, u.repoPath, u.base64Content, msg);
  }

  clearPendingUploads();
};

const generateUploadFileName = (inputName: string): string => {
  const trimmed = (inputName || "").trim();
  const lastDot = trimmed.lastIndexOf(".");
  const baseRaw = lastDot >= 0 ? trimmed.slice(0, lastDot) : trimmed;
  const extensionRaw = lastDot >= 0 ? trimmed.slice(lastDot).toLowerCase() : "";
  const safeBase = baseRaw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "image";
  const extension = extensionRaw || ".png";
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 15);
  const token = Math.random().toString(16).slice(2, 8);
  return `${safeBase}-${timestamp}-${token}${extension}`;
};

const normalizeUploadsDir = (value: string): string =>
  value.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");

const toPublicPath = (uploadsDir: string, fileName: string): string => {
  const normalized = normalizeUploadsDir(uploadsDir);
  const trimmed = normalized.startsWith("public/") ? normalized.slice("public/".length) : normalized;
  const path = `${trimmed ? `/${trimmed}` : ""}/${fileName}`.replace(/\/+/g, "/");
  return path.startsWith("/") ? path : `/${path}`;
};

export const uploadImageToGithub = async (file: File): Promise<string> => {
  const { settings, token } = ensureGithubCredentials();

  const uploadsDir = normalizeUploadsDir(settings.uploadsDir || DEFAULT_SETTINGS.uploadsDir);
  const fileName = generateUploadFileName(file.name || "image.png");
  const repoPath = uploadsDir ? `${uploadsDir}/${fileName}` : fileName;

  const buffer = await file.arrayBuffer();
  const base64Content = arrayBufferToBase64(buffer);
  const message = file.name ? `Upload image ${file.name}` : "Upload image";

  await commitBase64Content(settings, token, repoPath, base64Content, message);
  return toPublicPath(settings.uploadsDir || DEFAULT_SETTINGS.uploadsDir, fileName);
};

export const pushCmsDataToGithub = async (json: string, commitMessage?: string): Promise<void> => {
  const { settings, token } = ensureGithubCredentials();
  const message = commitMessage?.trim() || "Update CMS data";
  const base64Content = textToBase64(json);

  await commitBase64Content(settings, token, settings.dataPath, base64Content, message);

  const staticPath = settings.staticDataPath;
  if (staticPath && staticPath !== settings.dataPath) {
    await commitBase64Content(settings, token, staticPath, base64Content, `${message} (static)`);
  }
};

// ---------------------------------------------------------------------------
// Blog post sync (production)

const deleteGithubContent = async (
  settings: GithubSettings,
  token: string,
  repoPath: string,
  message: string,
): Promise<void> => {
  const existing = await fetchContentMeta(settings, token, repoPath);
  if (!existing?.sha) return; // file doesn't exist — nothing to delete

  const encodedPath = encodeRepoPath(repoPath);
  const url = `${API_BASE}/repos/${settings.owner}/${settings.repo}/contents/${encodedPath}`;

  const body: Record<string, unknown> = {
    message,
    sha: existing.sha,
    branch: settings.branch || "main",
  };

  if (settings.committerName && settings.committerEmail) {
    body.committer = { name: settings.committerName, email: settings.committerEmail };
  }

  const response = await fetch(url, {
    method: "DELETE",
    headers: { ...requestHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let reason = `${response.status} ${response.statusText}`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) reason = payload.message;
    } catch { /* ignore */ }
    throw new Error(`GitHub delete failed: ${reason}`);
  }
};

export const pushBlogPostToGithub = async (
  slug: string,
  markdown: string,
  commitMessage?: string,
): Promise<void> => {
  const { settings, token } = ensureGithubCredentials();
  const blogDir = settings.blogDir || DEFAULT_SETTINGS.blogDir;
  const repoPath = `${blogDir}/${slug}.md`;
  const message = commitMessage?.trim() || `Update blog post: ${slug}`;
  const base64Content = textToBase64(markdown);
  await commitBase64Content(settings, token, repoPath, base64Content, message);
};

export const deleteBlogPostFromGithub = async (
  slug: string,
  commitMessage?: string,
): Promise<void> => {
  const { settings, token } = ensureGithubCredentials();
  const blogDir = settings.blogDir || DEFAULT_SETTINGS.blogDir;
  const repoPath = `${blogDir}/${slug}.md`;
  const message = commitMessage?.trim() || `Delete blog post: ${slug}`;
  await deleteGithubContent(settings, token, repoPath, message);
};

export const testGithubConnection = async (settings: GithubSettings, token: string): Promise<void> => {
  const normalized = normalizeSettings(settings);
  const authToken = token.trim();

  if (!authToken) {
    throw new Error("Add a personal access token to test the connection.");
  }

  if (!normalized.owner || !normalized.repo) {
    throw new Error("Owner and repository are required.");
  }

  const branch = normalized.branch || "main";
  const response = await fetch(
    `${API_BASE}/repos/${normalized.owner}/${normalized.repo}/branches/${encodeURIComponent(branch)}`,
    { headers: requestHeaders(authToken) },
  );

  if (response.status === 404) {
    throw new Error("Repository or branch not found.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error("Token is missing permissions for this repository.");
  }

  if (!response.ok) {
    throw new Error(`GitHub connection failed: ${response.status} ${response.statusText}`);
  }
};
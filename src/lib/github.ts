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
  committerName: string;
  committerEmail: string;
};

const DEFAULT_SETTINGS: GithubSettings = {
  owner: "",
  repo: "",
  branch: "main",
  dataPath: "cms-data.json",
  staticDataPath: "public/data.json",
  uploadsDir: "public/uploads",
  committerName: "Nova CMS",
  committerEmail: "cms@nova.local",
};

const API_BASE = "https://api.github.com";
const isBrowser = typeof window !== "undefined";

const getStorage = () => (isBrowser ? window.localStorage : undefined);

const normalizeSettings = (input?: Partial<GithubSettings>): GithubSettings => ({
  owner: input?.owner?.trim() ?? "",
  repo: input?.repo?.trim() ?? "",
  branch: input?.branch?.trim() || "main",
  dataPath: input?.dataPath?.trim() || "cms-data.json",
  staticDataPath: input?.staticDataPath?.trim() || "public/data.json",
  uploadsDir: input?.uploadsDir?.trim() || "public/uploads",
  committerName: input?.committerName?.trim() || "Nova CMS",
  committerEmail: input?.committerEmail?.trim() || "cms@nova.local",
});

const dispatchSyncEvent = () => {
  if (!isBrowser) return;
  window.dispatchEvent(new Event(GITHUB_SYNC_EVENT));
};

export const loadGithubSettings = (): GithubSettings => {
  const storage = getStorage();
  if (!storage) return { ...DEFAULT_SETTINGS };

  const raw = storage.getItem(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };

  try {
    const parsed = JSON.parse(raw) as Partial<GithubSettings>;
    return normalizeSettings(parsed);
  } catch {
    return { ...DEFAULT_SETTINGS };
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

  const response = await fetch(url, {
    method: "PUT",
    headers: { ...requestHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

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

  const uploadsDir = normalizeUploadsDir(settings.uploadsDir || "public/uploads");
  const fileName = generateUploadFileName(file.name || "image.png");
  const repoPath = uploadsDir ? `${uploadsDir}/${fileName}` : fileName;

  const buffer = await file.arrayBuffer();
  const base64Content = arrayBufferToBase64(buffer);
  const message = file.name ? `Upload image ${file.name}` : "Upload image";

  await commitBase64Content(settings, token, repoPath, base64Content, message);
  return toPublicPath(settings.uploadsDir || "public/uploads", fileName);
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
/**
 * Shared image upload helper used by ImageUploadField and the TipTap editor.
 *
 * - Dev mode: POSTs to the local Vite dev server at `/cms-upload`.
 * - Production: queues the file for the next GitHub commit via `addPendingUpload`.
 */
import {
  canUseGithubSync,
  addPendingUpload,
} from "./github";

const isDev = import.meta.env.DEV;

const uploadViaDevServer = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file, file.name);
  const response = await fetch("/cms-upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(reason || `Upload failed with ${response.status}`);
  }

  const payload = (await response.json()) as { url?: string };
  if (!payload.url) {
    throw new Error("Upload succeeded but no URL was returned.");
  }

  return payload.url;
};

/**
 * Upload a single image file using the appropriate strategy for the
 * current environment.  Returns the public URL/path of the uploaded file.
 */
export const uploadImage = async (file: File): Promise<string> => {
  if (isDev) {
    return uploadViaDevServer(file);
  }

  if (!canUseGithubSync()) {
    throw new Error("Configure GitHub sync to enable uploads.");
  }

  return addPendingUpload(file);
};

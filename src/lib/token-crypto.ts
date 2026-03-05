/**
 * Client-side AES-GCM decryption for the GitHub token, encrypted at
 * build time via PBKDF2 + AES-256-GCM (see vite.config.ts).
 *
 * Blob format (base64-encoded):
 *   salt ‖ iv ‖ ciphertext+tag
 *   • salt:       16 bytes – PBKDF2 salt
 *   • iv:         12 bytes – AES-GCM nonce
 *   • ciphertext: remainder – encrypted token + GCM tag (16 bytes)
 */

const ITERATIONS = 600_000;
const SALT_LEN = 16;
const IV_LEN = 12;

const deriveKey = async (
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
};

const fromBase64 = (b64: string): Uint8Array =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/**
 * Decrypt a base64 blob back to the plaintext token.
 * Throws if the password is wrong or the data is corrupt.
 */
export const decryptToken = async (
  blob: string,
  password: string,
): Promise<string> => {
  const data = fromBase64(blob);
  const salt = data.slice(0, SALT_LEN);
  const iv = data.slice(SALT_LEN, SALT_LEN + IV_LEN);
  const ciphertext = data.slice(SALT_LEN + IV_LEN);
  const key = await deriveKey(password, salt);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plaintext);
};

/** Quick check: does a stored blob look like an encrypted token? */
export const isEncryptedBlob = (value: string): boolean => {
  if (!value) return false;
  // Plaintext tokens start with ghp_, github_pat_, gho_, ghu_, ghs_, ghr_
  if (/^(ghp_|github_pat_|gho_|ghu_|ghs_|ghr_)/.test(value)) return false;
  // Must be base64-ish and long enough to hold salt+iv+ciphertext
  try {
    const decoded = fromBase64(value);
    return decoded.length > SALT_LEN + IV_LEN;
  } catch {
    return false;
  }
};

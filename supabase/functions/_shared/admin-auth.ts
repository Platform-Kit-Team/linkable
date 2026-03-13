/**
 * AES-256-GCM decrypt for admin auth tokens.
 *
 * Mirrors the client-side encryptPayload() from src/lib/admin-crypto.ts.
 * Uses Web Crypto API (available in Deno).
 *
 * Blob format (base64):  salt(16) ‖ iv(12) ‖ ciphertext+tag
 */

const ITERATIONS = 250_000;
const SALT_LEN = 16;
const IV_LEN = 12;
const MAX_AGE_SEC = 300; // 5 minutes

const enc = new TextEncoder();

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
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
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Decrypt a base64 blob and return the plaintext.
 * Throws if the passphrase is wrong or data is corrupt.
 */
export async function decryptPayload(
  blob: string,
  passphrase: string,
): Promise<string> {
  const data = fromBase64(blob);
  const salt = data.slice(0, SALT_LEN);
  const iv = data.slice(SALT_LEN, SALT_LEN + IV_LEN);
  const ciphertext = data.slice(SALT_LEN + IV_LEN);
  const key = await deriveKey(passphrase, salt);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plaintext);
}

/**
 * Verify an encrypted admin auth token.
 *
 * The token is an AES-GCM encrypted JSON string: { "password": "...", "ts": <unix_ms> }
 * encrypted with the Supabase anon key as the passphrase.
 *
 * Returns true if:
 *  - Decryption succeeds (correct anon key)
 *  - Password matches CMS_PASSWORD env var
 *  - Timestamp is within MAX_AGE_SEC
 */
export async function verifyAdminToken(encryptedToken: string): Promise<boolean> {
  const anonKey =
    Deno.env.get("VITE_SUPABASE_ANON_KEY") ||
    Deno.env.get("SUPABASE_ANON_KEY");
  const cmsPassword = Deno.env.get("CMS_PASSWORD");

  if (!anonKey || !cmsPassword) {
    console.error("Missing SUPABASE_ANON_KEY or CMS_PASSWORD env var");
    return false;
  }

  try {
    const json = await decryptPayload(encryptedToken, anonKey);
    const { password, ts } = JSON.parse(json);

    if (password !== cmsPassword) {
      console.error("[admin-auth] password mismatch");
      return false;
    }

    const age = Math.abs(Date.now() - ts);
    if (age > MAX_AGE_SEC * 1000) {
      console.error("[admin-auth] token expired, age:", age);
      return false;
    }

    return true;
  } catch (e) {
    console.error("[admin-auth] decrypt failed:", e);
    return false;
  }
}

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit authentication tag

function getActiveKeyVersion(): string {
  const v = (process.env.ENCRYPTION_KEY_VERSION || "v1").trim();
  if (!/^v\d+$/.test(v)) {
    throw new Error("ENCRYPTION_KEY_VERSION must follow format v1, v2, ...");
  }
  return v;
}

function getEncryptionKey(version: string): Buffer {
  const envVarName = version === "v1" ? "ENCRYPTION_MASTER_KEY" : `ENCRYPTION_MASTER_KEY_${version.toUpperCase()}`;
  const masterKey = process.env[envVarName] || (version === "v1" ? process.env.ENCRYPTION_MASTER_KEY_V1 : undefined);
  if (!masterKey || masterKey.length < 32) {
    throw new Error(`${envVarName} must be configured with at least 32 characters`);
  }
  // Derive a 32-byte key using SHA-256
  return crypto.createHash("sha256").update(masterKey).digest();
}

/**
 * Encrypts sensitive plain text (e.g. OAuth refresh tokens, IMAP passwords)
 * Output format: <version>:<base64(iv + authTag + cipherText)>
 */
export function encryptCredentials(plainText: string): string {
  const version = getActiveKeyVersion();
  const key = getEncryptionKey(version);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const combined = Buffer.concat([iv, tag, encrypted]);
  return `${version}:${combined.toString("base64")}`;
}

/**
 * Decrypts versioned (or legacy unversioned) encrypted credentials back into plain text
 */
export function decryptCredentials(payload: string): string {
  const colonIdx = payload.indexOf(":");
  let version = "v1";
  let encryptedBase64 = payload;

  if (colonIdx > 0 && /^v\d+$/.test(payload.slice(0, colonIdx))) {
    version = payload.slice(0, colonIdx);
    encryptedBase64 = payload.slice(colonIdx + 1);
  }

  const key = getEncryptionKey(version);
  const buffer = Buffer.from(encryptedBase64, "base64");

  if (buffer.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Invalid encrypted payload length");
  }

  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const cipherText = buffer.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
  return decrypted.toString("utf8");
}

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit authentication tag

function getEncryptionKey(): Buffer {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY;
  if (!masterKey || masterKey.length < 32) {
    throw new Error("ENCRYPTION_MASTER_KEY must be configured with at least 32 characters");
  }
  // Derive a 32-byte key using SHA-256
  return crypto.createHash("sha256").update(masterKey).digest();
}

/**
 * Encrypts sensitive plain text (e.g. OAuth refresh tokens, IMAP passwords)
 * Output format: base64(iv + authTag + cipherText)
 */
export function encryptCredentials(plainText: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const combined = Buffer.concat([iv, tag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypts encrypted credentials string back into plain text
 */
export function decryptCredentials(encryptedBase64: string): string {
  const key = getEncryptionKey();
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

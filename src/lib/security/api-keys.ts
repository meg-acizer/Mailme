import crypto from "crypto";

export type ApiKeyScope =
  | "mail:read"
  | "tasks:write"
  | "contacts:read"
  | "webhooks:trigger";

export const ALLOWED_API_KEY_SCOPES: ApiKeyScope[] = [
  "mail:read",
  "tasks:write",
  "contacts:read",
  "webhooks:trigger",
];

export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey, "utf8").digest("hex");
}

/**
 * Generates a new API key.
 * Returns `rawKey` ONCE to display to the user, plus `keyPrefix` and `keyHash` (SHA-256) for storage.
 */
export function generateTenantApiKey(): {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const randomHex = crypto.randomBytes(24).toString("hex");
  const rawKey = `wv_live_${randomHex}`;
  const keyPrefix = `${rawKey.slice(0, 14)}...${rawKey.slice(-4)}`;
  const keyHash = hashApiKey(rawKey);
  return { rawKey, keyPrefix, keyHash };
}

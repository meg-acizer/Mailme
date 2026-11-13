import crypto from "crypto";
import dns from "node:dns/promises";
import net from "node:net";

export type WebhookEventType =
  | "email.received"
  | "email.assigned"
  | "task.created"
  | "whatsapp.received";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
]);

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const norm = ip.toLowerCase().split("%")[0];
  if (norm === "::" || norm === "::1") return true;
  if (norm.startsWith("::ffff:")) {
    const v4 = norm.slice(7);
    if (net.isIPv4(v4)) return isPrivateIPv4(v4);
  }
  if (norm.startsWith("fc") || norm.startsWith("fd")) return true;
  if (norm.startsWith("fe8") || norm.startsWith("fe9") || norm.startsWith("fea") || norm.startsWith("feb")) {
    return true;
  }
  if (norm.startsWith("ff")) return true;
  return false;
}

function isBlockedIp(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) return isPrivateIPv4(ip);
  if (v === 6) return isPrivateIPv6(ip);
  return true;
}

/**
 * Validates that an outbound webhook URL is safe from SSRF:
 * - Only HTTPS (or HTTP in local development if explicitly needed, still blocking private IPs)
 * - Blocks localhost, internal domains, private IPv4/IPv6, and cloud metadata IPs
 * - Resolves DNS records before connecting
 */
export async function assertSafeWebhookUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("URL de webhook inválida.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Por seguridad, los webhooks salientes deben usar HTTPS (https://).");
  }

  if (parsed.username || parsed.password) {
    throw new Error("La URL del webhook no debe incluir credenciales embebidas.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("Host de webhook bloqueado por política anti-SSRF.");
  }

  if (net.isIP(hostname) !== 0) {
    if (isBlockedIp(hostname)) {
      throw new Error("Dirección IP privada o de metadata bloqueada por política anti-SSRF.");
    }
    return parsed;
  }

  const records = await dns.lookup(hostname, { all: true });
  if (!records || records.length === 0) {
    throw new Error(`No se pudo resolver el dominio del webhook: ${hostname}`);
  }
  for (const rec of records) {
    if (isBlockedIp(rec.address)) {
      throw new Error("El dominio del webhook resuelve a una IP privada o reservada (SSRF bloqueado).");
    }
  }

  return parsed;
}

/**
 * Signs an outbound webhook payload using HMAC-SHA256 over `<timestamp>.<rawBody>`
 */
export function signWebhookPayload(rawBody: string, secret: string, timestampSec?: number): {
  timestamp: string;
  signatureHeader: string;
} {
  const ts = String(timestampSec ?? Math.floor(Date.now() / 1000));
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(`${ts}.${rawBody}`, "utf8")
    .digest("hex");
  return {
    timestamp: ts,
    signatureHeader: `sha256=${hmac}`,
  };
}

/**
 * Exponential backoff schedule for failed webhook deliveries (in seconds)
 * Attempt 1 -> 30s, Attempt 2 -> 2m, Attempt 3 -> 10m, Attempt 4 -> 1h
 */
export function getNextRetryTimestamp(attemptCount: number): string | null {
  const delaysSec = [30, 120, 600, 3600];
  if (attemptCount > delaysSec.length) return null;
  const delayMs = delaysSec[attemptCount - 1] * 1000;
  return new Date(Date.now() + delayMs).toISOString();
}

/**
 * Dispatches a signed webhook without following HTTP redirects (`redirect: "error"`)
 */
export async function dispatchSignedWebhook(params: {
  targetUrl: string;
  signingSecret: string;
  event: WebhookEventType;
  payload: Record<string, unknown>;
}): Promise<{
  delivered: boolean;
  httpStatus?: number;
  errorMessage?: string;
  signatureHeader: string;
  timestamp: string;
}> {
  const safeUrl = await assertSafeWebhookUrl(params.targetUrl);
  const rawBody = JSON.stringify({
    event: params.event,
    deliveredAt: new Date().toISOString(),
    data: params.payload,
  });

  const { timestamp, signatureHeader } = signWebhookPayload(rawBody, params.signingSecret);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(safeUrl.toString(), {
      method: "POST",
      redirect: "error", // Never follow redirects (anti-SSRF bypass protection)
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Worvanta-Webhook/1.0",
        "X-Worvanta-Event": params.event,
        "X-Worvanta-Timestamp": timestamp,
        "X-Worvanta-Signature-256": signatureHeader,
      },
      body: rawBody,
    });

    return {
      delivered: response.ok,
      httpStatus: response.status,
      errorMessage: response.ok ? undefined : `HTTP ${response.status}`,
      signatureHeader,
      timestamp,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook delivery failed";
    return {
      delivered: false,
      errorMessage: msg,
      signatureHeader,
      timestamp,
    };
  } finally {
    clearTimeout(timeout);
  }
}

import dns from "node:dns/promises";
import net from "node:net";

const ALLOWED_IMAP_PORTS = new Set([143, 993]);
const ALLOWED_SMTP_PORTS = new Set([25, 465, 587, 2525]);

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
]);

function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8 ("this" network)
  if (a === 10) return true; // 10.0.0.0/8 RFC1918
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local & cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 RFC1918
  if (a === 192 && b === 0 && parts[2] === 0) return true; // 192.0.0.0/24
  if (a === 192 && b === 0 && parts[2] === 2) return true; // TEST-NET-1
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 RFC1918
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast & reserved
  return false;
}

function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().split("%")[0];
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("::ffff:")) {
    const v4 = normalized.slice(7);
    if (net.isIPv4(v4)) return isPrivateOrReservedIPv4(v4);
  }
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // fc00::/7 ULA
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true; // fe80::/10 link-local
  }
  if (normalized.startsWith("ff")) return true; // multicast
  return false;
}

function isBlockedIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateOrReservedIPv4(ip);
  if (version === 6) return isPrivateOrReservedIPv6(ip);
  return true;
}

/**
 * Validates that an IMAP or SMTP server host and port do not target
 * internal/private networks, loopback addresses, cloud metadata endpoints,
 * or non-standard ports (SSRF protection).
 */
export async function assertSafeMailServer(
  rawHost: string,
  port: number,
  kind: "imap" | "smtp"
): Promise<void> {
  const host = (rawHost || "").trim().toLowerCase();
  if (!host || host.length > 253 || /[\s/\\@]/.test(host)) {
    throw new Error(`Host ${kind.toUpperCase()} inválido.`);
  }

  const allowedPorts = kind === "imap" ? ALLOWED_IMAP_PORTS : ALLOWED_SMTP_PORTS;
  if (!Number.isInteger(port) || !allowedPorts.has(port)) {
    throw new Error(
      `Puerto ${kind.toUpperCase()} no permitido (${port}). Puertos válidos: ${Array.from(allowedPorts).join(", ")}.`
    );
  }

  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error(`Host ${kind.toUpperCase()} bloqueado por política de seguridad.`);
  }

  if (net.isIP(host) !== 0) {
    if (isBlockedIp(host)) {
      throw new Error(`Dirección IP ${kind.toUpperCase()} privada o reservada no permitida.`);
    }
    return;
  }

  // Resolve DNS to prevent DNS-rebinding / hostname pointing to internal IP
  const records = await dns.lookup(host, { all: true });
  if (!records || records.length === 0) {
    throw new Error(`No se pudo resolver el host ${kind.toUpperCase()}: ${host}`);
  }
  for (const record of records) {
    if (isBlockedIp(record.address)) {
      throw new Error(`El host ${kind.toUpperCase()} resuelve a una IP privada o reservada no permitida.`);
    }
  }
}

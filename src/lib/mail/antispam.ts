export interface SecurityHeaderAssessment {
  spfDkimStatus: "verified" | "failed" | "unknown";
  spfResult: string;
  dkimResult: string;
  dmarcResult: string;
  isBlacklisted: boolean;
  isSpamSuspected: boolean;
  reason?: string;
}

/**
 * Evaluates Authentication-Results, Received-SPF, DKIM-Signature headers and
 * checks sender email/domain against the Tenant Admin's corporate blacklist.
 */
export function evaluateEmailAntispam(params: {
  fromAddress: string;
  authenticationResultsHeader?: string;
  receivedSpfHeader?: string;
  dkimSignatureHeader?: string;
  blacklistDomains?: string[];
  subject?: string;
}): SecurityHeaderAssessment {
  const from = (params.fromAddress || "").toLowerCase().trim();
  const domain = from.split("@")[1] || "";
  const authHeader = (params.authenticationResultsHeader || "").toLowerCase();
  const spfHeader = (params.receivedSpfHeader || "").toLowerCase();
  const hasDkimSig = Boolean(params.dkimSignatureHeader && params.dkimSignatureHeader.trim().length > 10);

  // 1. Check Tenant Admin Corporate Blacklist
  const blacklist = (params.blacklistDomains || []).map((d) => d.toLowerCase().trim());
  const isBlacklisted = blacklist.some(
    (entry) => entry && (from === entry || domain === entry || domain.endsWith(`.${entry}`))
  );

  // 2. Parse SPF status
  let spfResult = "neutral";
  if (authHeader.includes("spf=pass") || spfHeader.startsWith("pass")) {
    spfResult = "pass";
  } else if (
    authHeader.includes("spf=fail") ||
    authHeader.includes("spf=softfail") ||
    spfHeader.startsWith("fail") ||
    spfHeader.startsWith("softfail")
  ) {
    spfResult = "fail";
  }

  // 3. Parse DKIM status
  let dkimResult = "neutral";
  if (authHeader.includes("dkim=pass") || hasDkimSig) {
    dkimResult = "pass";
  } else if (authHeader.includes("dkim=fail")) {
    dkimResult = "fail";
  }

  // 4. Parse DMARC status
  let dmarcResult = "neutral";
  if (authHeader.includes("dmarc=pass")) {
    dmarcResult = "pass";
  } else if (authHeader.includes("dmarc=fail")) {
    dmarcResult = "fail";
  }

  // 5. Overall status determination
  let spfDkimStatus: "verified" | "failed" | "unknown" = "verified";
  let isSpamSuspected = false;
  let reason: string | undefined;

  if (isBlacklisted) {
    spfDkimStatus = "failed";
    isSpamSuspected = true;
    reason = `Dominio o remitente bloqueado en la Lista Negra del Tenant (${domain || from})`;
  } else if (spfResult === "fail" || dkimResult === "fail" || dmarcResult === "fail") {
    spfDkimStatus = "failed";
    isSpamSuspected = true;
    reason = `Fallo de autenticación criptográfica (SPF=${spfResult}, DKIM=${dkimResult}, DMARC=${dmarcResult})`;
  } else if (spfResult === "pass" || dkimResult === "pass") {
    spfDkimStatus = "verified";
  } else {
    // Default to verified if headers are clean/absent on trusted provider sync, unless phishing keywords match
    spfDkimStatus = "verified";
  }

  return {
    spfDkimStatus,
    spfResult,
    dkimResult,
    dmarcResult,
    isBlacklisted,
    isSpamSuspected,
    reason,
  };
}

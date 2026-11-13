import crypto from "crypto";

export type OAuthTarget = "microsoft_mail_calendar" | "google_calendar";

export interface OAuthStatePayload {
  target: OAuthTarget;
  tenantId: string;
  userId: string;
  emailHint?: string;
  nonce: string;
  issuedAt: number;
}

const MICROSOFT_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "https://outlook.office.com/IMAP.AccessAsUser.All",
  "https://outlook.office.com/SMTP.Send",
  "Calendars.ReadWrite",
].join(" ");

// Sensitive scopes only (no Gmail Restricted scopes -> no CASA Tier 2 audit required)
const GOOGLE_CALENDAR_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

function getSigningSecret(): string {
  const secret = process.env.ENCRYPTION_MASTER_KEY;
  if (!secret || secret.length < 32) {
    throw new Error("ENCRYPTION_MASTER_KEY is required to sign OAuth state");
  }
  return secret;
}

export function createSignedOAuthState(payload: Omit<OAuthStatePayload, "nonce" | "issuedAt">): string {
  const fullPayload: OAuthStatePayload = {
    ...payload,
    nonce: crypto.randomBytes(12).toString("hex"),
    issuedAt: Date.now(),
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), "utf8").toString("base64url");
  const hmac = crypto.createHmac("sha256", getSigningSecret()).update(encoded).digest("base64url");
  return `${encoded}.${hmac}`;
}

export function verifySignedOAuthState(state: string): OAuthStatePayload {
  const parts = state.split(".");
  if (parts.length !== 2) {
    throw new Error("Invalid OAuth state format");
  }
  const [encoded, signature] = parts;
  const expected = crypto.createHmac("sha256", getSigningSecret()).update(encoded).digest("base64url");

  const bufSig = Buffer.from(signature);
  const bufExp = Buffer.from(expected);
  if (bufSig.length !== bufExp.length || !crypto.timingSafeEqual(bufSig, bufExp)) {
    throw new Error("Invalid OAuth state signature");
  }

  const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OAuthStatePayload;
  if (Date.now() - parsed.issuedAt > 15 * 60 * 1000) {
    throw new Error("OAuth state expired");
  }
  return parsed;
}

export function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function buildOAuthAuthorizationUrl(params: {
  target: OAuthTarget;
  state: string;
  emailHint?: string;
}): { url: string; configured: boolean; missingVar?: string } {
  const redirectUri = `${getAppBaseUrl()}/api/oauth/callback`;

  if (params.target === "microsoft_mail_calendar") {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const tenant = process.env.MICROSOFT_TENANT_ID || "common";
    if (!clientId) {
      return { url: "", configured: false, missingVar: "MICROSOFT_CLIENT_ID" };
    }
    const query = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      response_mode: "query",
      scope: MICROSOFT_SCOPES,
      state: params.state,
      prompt: "select_account",
    });
    if (params.emailHint) query.set("login_hint", params.emailHint);
    return {
      url: `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/authorize?${query.toString()}`,
      configured: true,
    };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return { url: "", configured: false, missingVar: "GOOGLE_CLIENT_ID" };
  }
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: params.state,
  });
  if (params.emailHint) query.set("login_hint", params.emailHint);
  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${query.toString()}`,
    configured: true,
  };
}

export async function exchangeOAuthCode(params: {
  target: OAuthTarget;
  code: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  email?: string;
}> {
  const redirectUri = `${getAppBaseUrl()}/api/oauth/callback`;

  if (params.target === "microsoft_mail_calendar") {
    const clientId = process.env.MICROSOFT_CLIENT_ID || "";
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || "";
    const tenant = process.env.MICROSOFT_TENANT_ID || "common";

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: params.code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      scope: MICROSOFT_SCOPES,
    });

    const res = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      }
    );

    if (!res.ok) {
      throw new Error(`Microsoft token exchange failed with status ${res.status}`);
    }
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || "",
      expiresIn: Number(data.expires_in || 3600),
    };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: params.code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Google Calendar token exchange failed with status ${res.status}`);
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || "",
    expiresIn: Number(data.expires_in || 3600),
  };
}

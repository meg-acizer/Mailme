import { NextResponse } from "next/server";
import { analyzeEmailWithAI } from "@/lib/ai/triage";
import { logAiAuditEvent } from "@/lib/audit/audit-logger";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`ai:triage:${ip}`, 40, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const body = await request.json();
    const { subject, from, text, tenantSlug, user } = body;

    if (!subject && !text) {
      return NextResponse.json({ error: "Faltan datos del correo para analizar" }, { status: 400 });
    }

    const triage = await analyzeEmailWithAI(
      {
        subject: subject || "",
        from: from || "",
        body: text || "",
      },
      tenantSlug || "acme-corp"
    );

    // Record privacy-safe audit event (no raw email content)
    await logAiAuditEvent({
      user: user || "meg-acizer",
      action: "Triage & Resumen Inteligente de correo",
      model: "gemini-1.5-flash",
      provider: "gemini",
      tokens: Math.round(((subject?.length || 0) + (text?.length || 0)) / 4 + 150),
      details: subject ? `Asunto: "${subject.slice(0, 40)}..."` : undefined,
    });

    return NextResponse.json({ success: true, triage });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error running triage";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

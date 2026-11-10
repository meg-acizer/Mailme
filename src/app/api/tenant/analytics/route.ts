import { NextResponse } from "next/server";
import { getAuditAnalytics, logAiAuditEvent } from "@/lib/audit/audit-logger";

export async function GET() {
  try {
    const data = getAuditAnalytics();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching analytics";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, action, model, provider, tokens, details } = body;

    if (!user || !action) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const entry = await logAiAuditEvent({
      user,
      action,
      model: model || "gemini-1.5-flash",
      provider: provider || "gemini",
      tokens: Number(tokens) || 500,
      details,
    });

    return NextResponse.json({ success: true, entry });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error recording audit log";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

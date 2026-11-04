import { NextResponse } from "next/server";
import { analyzeEmailWithAI } from "@/lib/ai/triage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subject, from, text, tenantSlug } = body;

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

    return NextResponse.json({ success: true, triage });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error running triage";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

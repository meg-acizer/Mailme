import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get("tenantSlug") || "acme-corp";

    const supabase = createAdminClient();
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("id, name, settings")
      .eq("slug", tenantSlug)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const settings = (tenant?.settings as Record<string, unknown>) || {};
    const security = (settings.security_policies as any) || {
      onlyCorporateAccounts: true,
      maxAttachmentSizeMb: 5,
      blacklistDomains: ["phishing-alert.com", "spam-marketing.net"],
    };
    const assets = (settings.corporate_assets as any) || {
      signatureTemplate: `--\n{nombre_completo} | {cargo}\nAcme Corp\nT: +54 11 4000-0000 | www.acme.com`,
      globalCalendarEvents: [
        { title: "All-Hands Q4 Review", time: "Viernes 17:00 hs" },
        { title: "Cierre Fiscal Anual", time: "31 de Diciembre" },
      ],
    };

    return NextResponse.json({
      success: true,
      security,
      assets,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantSlug = "acme-corp", security, assets } = body;

    const supabase = createAdminClient();
    const { data: tenant, error: fetchErr } = await supabase
      .from("tenants")
      .select("id, settings")
      .eq("slug", tenantSlug)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 400 });
    }

    const existingSettings = (tenant?.settings as Record<string, unknown>) || {};

    const newSettings = {
      ...existingSettings,
      security_policies: security || existingSettings.security_policies,
      corporate_assets: assets || existingSettings.corporate_assets,
      updated_at: new Date().toISOString(),
    };

    if (tenant) {
      const { error: updateErr } = await supabase
        .from("tenants")
        .update({ settings: newSettings, updated_at: new Date().toISOString() })
        .eq("id", tenant.id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Políticas de seguridad y activos corporativos actualizados en Supabase.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

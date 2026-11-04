import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptCredentials, decryptCredentials } from "@/lib/crypto";
import type { TenantLlmSettings, LlmSlotConfig } from "@/lib/ai/providers";

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return "••••••••";
  return key.slice(0, 3) + "••••••••" + key.slice(-4);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get("tenantSlug") || "acme-corp";

    const supabase = createAdminClient();
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("id, name, slug, settings")
      .eq("slug", tenantSlug)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const settings = (tenant?.settings as Record<string, unknown>) || {};
    const rawLlm = (settings.llm_config as TenantLlmSettings) || null;

    if (!rawLlm) {
      // Default initial config
      const defaultConfig: TenantLlmSettings = {
        primary: {
          provider: "gemini",
          apiKey: "",
          model: "gemini-1.5-flash",
        },
        fallback: {
          provider: "openai",
          apiKey: "",
          model: "gpt-4o-mini",
        },
        autoFallbackEnabled: true,
      };
      return NextResponse.json({ config: defaultConfig, isConfigured: false });
    }

    // Return masked keys for security
    const maskedConfig: TenantLlmSettings = {
      primary: {
        provider: rawLlm.primary.provider,
        model: rawLlm.primary.model,
        apiKey: rawLlm.primary.apiKey ? maskApiKey(decryptCredentials(rawLlm.primary.apiKey)) : "",
      },
      fallback: {
        provider: rawLlm.fallback.provider,
        model: rawLlm.fallback.model,
        apiKey: rawLlm.fallback.apiKey ? maskApiKey(decryptCredentials(rawLlm.fallback.apiKey)) : "",
      },
      autoFallbackEnabled: rawLlm.autoFallbackEnabled ?? true,
      updatedAt: rawLlm.updatedAt,
    };

    return NextResponse.json({ config: maskedConfig, isConfigured: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error reading LLM config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantSlug = "acme-corp", primary, fallback, autoFallbackEnabled } = body;

    if (!primary?.provider || !primary?.model) {
      return NextResponse.json(
        { error: "El modelo principal es obligatorio." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch existing tenant
    const { data: tenant, error: fetchErr } = await supabase
      .from("tenants")
      .select("id, slug, settings")
      .eq("slug", tenantSlug)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 400 });
    }

    const existingSettings = (tenant?.settings as Record<string, unknown>) || {};
    const existingLlm = (existingSettings.llm_config as TenantLlmSettings) || null;

    // Encrypt primary API key (or preserve existing if masked)
    let primaryEncryptedKey = "";
    if (primary.apiKey && !primary.apiKey.includes("••••")) {
      primaryEncryptedKey = encryptCredentials(primary.apiKey);
    } else if (existingLlm?.primary?.apiKey) {
      primaryEncryptedKey = existingLlm.primary.apiKey;
    }

    // Encrypt fallback API key (or preserve existing if masked)
    let fallbackEncryptedKey = "";
    if (fallback?.apiKey && !fallback.apiKey.includes("••••")) {
      fallbackEncryptedKey = encryptCredentials(fallback.apiKey);
    } else if (existingLlm?.fallback?.apiKey) {
      fallbackEncryptedKey = existingLlm.fallback.apiKey;
    }

    const secureLlmConfig: TenantLlmSettings = {
      primary: {
        provider: primary.provider,
        model: primary.model,
        apiKey: primaryEncryptedKey,
      },
      fallback: {
        provider: fallback?.provider || "openai",
        model: fallback?.model || "gpt-4o-mini",
        apiKey: fallbackEncryptedKey,
      },
      autoFallbackEnabled: autoFallbackEnabled ?? true,
      updatedAt: new Date().toISOString(),
    };

    const newSettings = {
      ...existingSettings,
      llm_config: secureLlmConfig,
    };

    if (tenant) {
      const { error: updateErr } = await supabase
        .from("tenants")
        .update({ settings: newSettings, updated_at: new Date().toISOString() })
        .eq("id", tenant.id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }
    } else {
      // Create initial tenant record if not present
      const { error: insertErr } = await supabase.from("tenants").insert({
        name: "Acme Corp",
        slug: tenantSlug,
        settings: newSettings,
      });

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Configuración de LLM cifrada y almacenada de forma segura en Supabase.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error saving LLM config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

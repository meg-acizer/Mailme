import { NextRequest, NextResponse } from "next/server";
import { ModelOption, PROVIDER_CATALOG, TenantLlmSettings } from "@/lib/ai/providers";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, tenantSlug = "acme-corp", slot = "primary" } = await req.json();

    if (!provider) {
      return NextResponse.json(
        { error: "Se requiere especificar el proveedor" },
        { status: 400 }
      );
    }

    let resolvedKey = (apiKey || "").trim();

    // If key is masked or empty, try retrieving and decrypting from Supabase
    if (!resolvedKey || resolvedKey.includes("••••")) {
      try {
        const supabase = createAdminClient();
        const { data: tenant } = await supabase
          .from("tenants")
          .select("settings")
          .eq("slug", tenantSlug)
          .maybeSingle();

        const settings = (tenant?.settings as Record<string, unknown>) || {};
        const llmConfig = settings.llm_config as TenantLlmSettings | undefined;

        if (llmConfig) {
          const targetSlot = slot === "fallback" ? llmConfig.fallback : llmConfig.primary;
          if (targetSlot?.apiKey) {
            resolvedKey = decryptCredentials(targetSlot.apiKey).trim();
          }
        }
      } catch (err) {
        console.warn("[llm-models] Could not retrieve stored key from Supabase:", err);
      }
    }

    if (!resolvedKey || resolvedKey.length < 8) {
      // If still no key, return default catalog models without failing
      const defaultModels =
        PROVIDER_CATALOG[provider as keyof typeof PROVIDER_CATALOG]?.models || [];
      return NextResponse.json({
        success: true,
        isDefault: true,
        provider,
        count: defaultModels.length,
        models: defaultModels,
        message: "Mostrando catálogo base. Ingrese una API Key para consultar modelos en vivo.",
      });
    }

    const fetchedModels: ModelOption[] = [];

    // 1. Google Gemini
    if (provider === "gemini") {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${resolvedKey}`,
          { method: "GET" }
        );

        if (!res.ok) {
          const errText = await res.text();
          return NextResponse.json(
            { error: `Gemini API rechazó la clave (${res.status}): ${errText.slice(0, 150)}` },
            { status: 400 }
          );
        }

        const data = await res.json();
        const modelsList = data.models || [];

        for (const m of modelsList) {
          const supportedMethods = m.supportedGenerationMethods || [];
          if (supportedMethods.includes("generateContent")) {
            const cleanId = m.name?.replace("models/", "") || m.name;
            const isFlash = cleanId.includes("flash");
            const isPro = cleanId.includes("pro");

            fetchedModels.push({
              id: cleanId,
              name: m.displayName ? `${m.displayName} (${cleanId})` : cleanId,
              provider: "gemini",
              contextWindow: m.inputTokenLimit
                ? `${Math.round(m.inputTokenLimit / 1000)}k tokens`
                : "1M tokens",
              recommendedFor: isFlash ? "triage" : isPro ? "reasoning" : "balanced",
            });
          }
        }
      } catch (err: any) {
        return NextResponse.json(
          { error: `Error de conexión con Google Gemini: ${err.message}` },
          { status: 502 }
        );
      }
    }

    // 2. OpenAI
    else if (provider === "openai") {
      try {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${resolvedKey}`,
          },
        });

        if (!res.ok) {
          const errText = await res.text();
          return NextResponse.json(
            { error: `OpenAI rechazó la clave (${res.status}): ${errText.slice(0, 150)}` },
            { status: 400 }
          );
        }

        const data = await res.json();
        const modelsList = data.data || [];

        const chatModels = modelsList.filter(
          (m: any) =>
            m.id.startsWith("gpt-") ||
            m.id.startsWith("o1") ||
            m.id.startsWith("o3") ||
            m.id.startsWith("chatgpt-")
        );

        chatModels.sort((a: any, b: any) => b.id.localeCompare(a.id));

        for (const m of chatModels) {
          const isMini = m.id.includes("mini") || m.id.includes("nano");
          const isReasoning = m.id.startsWith("o1") || m.id.startsWith("o3");

          fetchedModels.push({
            id: m.id,
            name: `${m.id} ${isReasoning ? "(Razonamiento)" : isMini ? "(Económico / Rápido)" : ""}`.trim(),
            provider: "openai",
            contextWindow: isReasoning ? "200k tokens" : "128k tokens",
            recommendedFor: isMini ? "triage" : isReasoning ? "reasoning" : "balanced",
          });
        }
      } catch (err: any) {
        return NextResponse.json(
          { error: `Error de conexión con OpenAI: ${err.message}` },
          { status: 502 }
        );
      }
    }

    // 3. OpenRouter
    else if (provider === "openrouter") {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/models", {
          headers: {
            Authorization: `Bearer ${resolvedKey}`,
          },
        });

        if (!res.ok) {
          const errText = await res.text();
          return NextResponse.json(
            { error: `OpenRouter rechazó la clave (${res.status}): ${errText.slice(0, 150)}` },
            { status: 400 }
          );
        }

        const data = await res.json();
        const modelsList = data.data || [];

        for (const m of modelsList) {
          const isTriage = m.id.includes("flash") || m.id.includes("mini") || m.id.includes("8b");
          const isReasoning = m.id.includes("r1") || m.id.includes("reasoning") || m.id.includes("70b");

          fetchedModels.push({
            id: m.id,
            name: m.name ? `${m.name} (${m.id})` : m.id,
            provider: "openrouter",
            contextWindow: m.context_length
              ? `${Math.round(m.context_length / 1000)}k tokens`
              : "128k tokens",
            recommendedFor: isTriage ? "triage" : isReasoning ? "reasoning" : "balanced",
          });
        }
      } catch (err: any) {
        return NextResponse.json(
          { error: `Error de conexión con OpenRouter: ${err.message}` },
          { status: 502 }
        );
      }
    }

    // 4. Anthropic Claude
    else if (provider === "claude") {
      try {
        const res = await fetch("https://api.anthropic.com/v1/models", {
          headers: {
            "x-api-key": resolvedKey,
            "anthropic-version": "2023-06-01",
          },
        });

        if (res.ok) {
          const data = await res.json();
          const modelsList = data.data || [];
          for (const m of modelsList) {
            const isHaiku = m.id.includes("haiku");
            const isOpus = m.id.includes("opus");
            fetchedModels.push({
              id: m.id,
              name: m.display_name ? `${m.display_name} (${m.id})` : m.id,
              provider: "claude",
              contextWindow: "200k tokens",
              recommendedFor: isHaiku ? "triage" : isOpus ? "reasoning" : "balanced",
            });
          }
        } else {
          // If the endpoint is restricted or on a different API tier, verify with full Claude catalog
          const fallbackCatalog = PROVIDER_CATALOG.claude.models;
          fetchedModels.push(
            ...fallbackCatalog,
            {
              id: "claude-3-5-sonnet-latest",
              name: "Claude 3.5 Sonnet (Latest)",
              provider: "claude",
              contextWindow: "200k tokens",
              recommendedFor: "balanced",
            },
            {
              id: "claude-3-5-haiku-latest",
              name: "Claude 3.5 Haiku (Latest)",
              provider: "claude",
              contextWindow: "200k tokens",
              recommendedFor: "triage",
            }
          );
        }
      } catch (err: any) {
        return NextResponse.json(
          { error: `Error de conexión con Anthropic: ${err.message}` },
          { status: 502 }
        );
      }
    }

    const finalModels =
      fetchedModels.length > 0
        ? fetchedModels
        : PROVIDER_CATALOG[provider as keyof typeof PROVIDER_CATALOG]?.models || [];

    return NextResponse.json({
      success: true,
      provider,
      count: finalModels.length,
      models: finalModels,
      message: `✓ ${finalModels.length} modelos detectados para tu cuenta`,
    });
  } catch (error: any) {
    console.error("[llm-models] Error fetching models:", error);
    return NextResponse.json(
      { error: error.message || "Error procesando solicitud" },
      { status: 500 }
    );
  }
}

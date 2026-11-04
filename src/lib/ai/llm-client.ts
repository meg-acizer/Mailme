import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/crypto";
import type { TenantLlmSettings, LlmSlotConfig } from "./providers";

export interface GenerateTextOptions {
  tenantSlug?: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateTextResult {
  text: string;
  modelUsed: string;
  providerUsed: string;
  isFallback: boolean;
  tokensEstimate: number;
}

/**
 * Executes a completion call against a specific LLM provider slot
 */
async function callProviderSlot(
  slot: LlmSlotConfig,
  decryptedApiKey: string,
  options: GenerateTextOptions
): Promise<string> {
  const { prompt, systemPrompt } = options;

  if (slot.provider === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${slot.model}:generateContent?key=${decryptedApiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          ...(systemPrompt ? [{ role: "user", parts: [{ text: `[System instruction]: ${systemPrompt}` }] }] : []),
          { role: "user", parts: [{ text: prompt }] },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  if (slot.provider === "openai" || slot.provider === "openrouter") {
    const endpoint =
      slot.provider === "openrouter"
        ? "https://openrouter.ai/api/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${decryptedApiKey}`,
      },
      body: JSON.stringify({
        model: slot.model,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`${slot.provider} API Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  if (slot.provider === "claude") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": decryptedApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: slot.model,
        system: systemPrompt,
        max_tokens: options.maxTokens || 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic Claude Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || "";
  }

  throw new Error(`Proveedor no soportado: ${slot.provider}`);
}

/**
 * Main AI Engine function with Automatic Primary -> Fallback orchestration
 */
export async function executeAiCompletion(
  options: GenerateTextOptions
): Promise<GenerateTextResult> {
  const tenantSlug = options.tenantSlug || "acme-corp";
  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, settings")
    .eq("slug", tenantSlug)
    .maybeSingle();

  const settings = (tenant?.settings as Record<string, unknown>) || {};
  const llmConfig = settings.llm_config as TenantLlmSettings | undefined;

  if (!llmConfig || !llmConfig.primary) {
    throw new Error("El tenant no tiene configurado ningún modelo de IA.");
  }

  const primarySlot = llmConfig.primary;
  const fallbackSlot = llmConfig.fallback;

  // 1. Try Primary Model
  try {
    const primaryKey = primarySlot.apiKey ? decryptCredentials(primarySlot.apiKey) : "";
    if (!primaryKey) {
      throw new Error("API Key del modelo principal no configurada.");
    }

    const output = await callProviderSlot(primarySlot, primaryKey, options);
    return {
      text: output,
      modelUsed: primarySlot.model,
      providerUsed: primarySlot.provider,
      isFallback: false,
      tokensEstimate: Math.round(options.prompt.length / 4 + output.length / 4),
    };
  } catch (primaryError) {
    console.warn("Fallo en modelo principal, evaluando fallback...", primaryError);

    if (!llmConfig.autoFallbackEnabled || !fallbackSlot?.apiKey) {
      throw primaryError;
    }

    // 2. Try Fallback Model
    try {
      const fallbackKey = decryptCredentials(fallbackSlot.apiKey);
      const fallbackOutput = await callProviderSlot(fallbackSlot, fallbackKey, options);

      return {
        text: fallbackOutput,
        modelUsed: fallbackSlot.model,
        providerUsed: fallbackSlot.provider,
        isFallback: true,
        tokensEstimate: Math.round(options.prompt.length / 4 + fallbackOutput.length / 4),
      };
    } catch (fallbackError) {
      throw new Error(
        `Fallaron tanto el modelo principal (${primaryError instanceof Error ? primaryError.message : "Error"}) como el de fallback (${fallbackError instanceof Error ? fallbackError.message : "Error"})`
      );
    }
  }
}

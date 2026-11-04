export interface ModelOption {
  id: string;
  name: string;
  provider: "gemini" | "openai" | "claude" | "openrouter";
  contextWindow: string;
  recommendedFor: "triage" | "reasoning" | "balanced";
}

export const PROVIDER_CATALOG: Record<
  "gemini" | "openai" | "claude" | "openrouter",
  {
    displayName: string;
    description: string;
    models: ModelOption[];
  }
> = {
  gemini: {
    displayName: "Google Gemini",
    description: "Excelente relación velocidad/costo, ideal para triage y RAG",
    models: [
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Ultrarrápido y económico)", provider: "gemini", contextWindow: "1M tokens", recommendedFor: "triage" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Razonamiento profundo)", provider: "gemini", contextWindow: "2M tokens", recommendedFor: "reasoning" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Nueva generación multimodal)", provider: "gemini", contextWindow: "1M tokens", recommendedFor: "balanced" },
    ],
  },
  openai: {
    displayName: "OpenAI",
    description: "Modelos estándar de la industria (GPT-4o)",
    models: [
      { id: "gpt-4o-mini", name: "GPT-4o Mini (Rápido y económico)", provider: "openai", contextWindow: "128k tokens", recommendedFor: "triage" },
      { id: "gpt-4o", name: "GPT-4o (Alta capacidad multimodal)", provider: "openai", contextWindow: "128k tokens", recommendedFor: "reasoning" },
      { id: "o3-mini", name: "o3-mini (Razonamiento lógico avanzado)", provider: "openai", contextWindow: "200k tokens", recommendedFor: "reasoning" },
    ],
  },
  claude: {
    displayName: "Anthropic Claude",
    description: "Precisión líder en redacción natural y código",
    models: [
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku (Rápido y conciso)", provider: "claude", contextWindow: "200k tokens", recommendedFor: "triage" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet (Estándar de calidad en redacción)", provider: "claude", contextWindow: "200k tokens", recommendedFor: "balanced" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus (Máxima profundidad analítica)", provider: "claude", contextWindow: "200k tokens", recommendedFor: "reasoning" },
    ],
  },
  openrouter: {
    displayName: "OpenRouter",
    description: "Acceso unificado a DeepSeek, Llama 3.3, Mistral y más",
    models: [
      { id: "deepseek/deepseek-chat", name: "DeepSeek V3 (Excelente costo/calidad)", provider: "openrouter", contextWindow: "64k tokens", recommendedFor: "balanced" },
      { id: "deepseek/deepseek-r1", name: "DeepSeek R1 (Razonamiento paso a paso)", provider: "openrouter", contextWindow: "64k tokens", recommendedFor: "reasoning" },
      { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B (Open-source de primer nivel)", provider: "openrouter", contextWindow: "128k tokens", recommendedFor: "balanced" },
      { id: "mistralai/mistral-large-2411", name: "Mistral Large (Precisión europea)", provider: "openrouter", contextWindow: "128k tokens", recommendedFor: "reasoning" },
    ],
  },
};

export interface LlmSlotConfig {
  provider: "gemini" | "openai" | "claude" | "openrouter";
  apiKey: string;
  model: string;
}

export interface TenantLlmSettings {
  primary: LlmSlotConfig;
  fallback: LlmSlotConfig;
  autoFallbackEnabled: boolean;
  updatedAt?: string;
}

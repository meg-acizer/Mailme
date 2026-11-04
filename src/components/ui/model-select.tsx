"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { PROVIDER_CATALOG, type ModelOption } from "@/lib/ai/providers";

interface ModelSelectProps {
  provider: "gemini" | "openai" | "claude" | "openrouter";
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  label?: string;
  customModels?: ModelOption[];
  isLoading?: boolean;
  onRefresh?: () => void;
  statusMessage?: string | null;
}

export function ModelSelect({
  provider,
  selectedModel,
  onSelectModel,
  label = "Modelo",
  customModels,
  isLoading = false,
  onRefresh,
  statusMessage,
}: ModelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use dynamically fetched models if available, otherwise default catalog
  const availableModels =
    customModels && customModels.length > 0
      ? customModels
      : PROVIDER_CATALOG[provider]?.models || [];

  const filteredModels = availableModels.filter(
    (m) =>
      m.id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      m.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const currentModelObj = availableModels.find((m) => m.id === selectedModel);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1">
        {label && <label className="block text-xs font-semibold text-muted-foreground">{label}</label>}
        {statusMessage && (
          <span className="text-[10px] text-primary/80 font-medium">{statusMessage}</span>
        )}
      </div>

      {/* Trigger Button */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="w-full flex items-center justify-between bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs font-mono text-left focus:outline-none focus:ring-1 focus:ring-primary hover:bg-muted/80 transition-colors cursor-pointer disabled:opacity-60"
        >
          <div className="flex items-center gap-2 truncate">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
            <span className="truncate font-semibold text-foreground">
              {isLoading
                ? "Cargando modelos desde API..."
                : currentModelObj
                ? currentModelObj.name
                : selectedModel || "Seleccionar modelo..."}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
        </button>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Recargar lista de modelos de esta API Key"
            className="p-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {/* Searchable Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-card border border-border rounded-xl shadow-2xl p-2 space-y-2 backdrop-blur-md">
          {/* Header with stats */}
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-muted-foreground">
            <span>{availableModels.length} modelos detectados</span>
            <span className="text-[10px] font-mono uppercase bg-muted px-1.5 py-0.2 rounded">
              {provider}
            </span>
          </div>

          {/* Typing Search Filter */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Escribe para filtrar (ej. 'flash', 'gpt-4o', 'deepseek')..."
              className="w-full bg-muted/60 pl-8 pr-3 py-1.5 rounded-lg border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Models List */}
          <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-border/20">
            {filteredModels.length === 0 ? (
              <div className="p-3 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  No se encontraron modelos con &quot;{filterQuery}&quot;
                </p>
                {filterQuery.trim().length > 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectModel(filterQuery.trim());
                      setIsOpen(false);
                      setFilterQuery("");
                    }}
                    className="text-xs text-primary font-medium hover:underline inline-block"
                  >
                    Usar &quot;{filterQuery.trim()}&quot; como ID personalizado →
                  </button>
                )}
              </div>
            ) : (
              filteredModels.map((model) => (
                <div
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                    setFilterQuery("");
                  }}
                  className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors text-xs ${
                    selectedModel === model.id
                      ? "bg-primary/15 text-primary font-semibold"
                      : "hover:bg-muted/60 text-foreground"
                  }`}
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">{model.name}</span>
                      {model.recommendedFor === "triage" && (
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-500 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                          Rápido / Triage
                        </span>
                      )}
                      {model.recommendedFor === "reasoning" && (
                        <span className="text-[9px] bg-purple-500/15 text-purple-500 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                          Razonamiento
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate">
                      ID: {model.id} • Contexto: {model.contextWindow}
                    </div>
                  </div>
                  {selectedModel === model.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

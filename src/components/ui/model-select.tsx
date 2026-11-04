"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, Sparkles } from "lucide-react";
import { PROVIDER_CATALOG, type ModelOption } from "@/lib/ai/providers";

interface ModelSelectProps {
  provider: "gemini" | "openai" | "claude" | "openrouter";
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  label?: string;
}

export function ModelSelect({
  provider,
  selectedModel,
  onSelectModel,
  label = "Modelo",
}: ModelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableModels = PROVIDER_CATALOG[provider]?.models || [];

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
      {label && <label className="block text-xs font-semibold mb-1 text-muted-foreground">{label}</label>}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs font-mono text-left focus:outline-none focus:ring-1 focus:ring-primary hover:bg-muted/80 transition-colors cursor-pointer"
      >
        <span className="truncate font-semibold text-foreground">
          {currentModelObj ? currentModelObj.name : selectedModel || "Seleccionar modelo..."}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
      </button>

      {/* Searchable Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-card border border-border rounded-xl shadow-2xl p-2 space-y-2 backdrop-blur-md">
          {/* Typing Search Filter */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Escribe para filtrar modelos..."
              className="w-full bg-muted/60 pl-8 pr-3 py-1.5 rounded-lg border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Models List */}
          <div className="max-h-56 overflow-y-auto space-y-1">
            {filteredModels.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No se encontraron modelos con &quot;{filterQuery}&quot;
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
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span>{model.name}</span>
                      {model.recommendedFor === "triage" && (
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-500 px-1.5 py-0.2 rounded font-bold uppercase">
                          Rápido / Triage
                        </span>
                      )}
                      {model.recommendedFor === "reasoning" && (
                        <span className="text-[9px] bg-purple-500/15 text-purple-500 px-1.5 py-0.2 rounded font-bold uppercase">
                          Razonamiento
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
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

"use client";

import React, { useEffect } from "react";
import { Command } from "cmdk";
import {
  Inbox,
  Calendar,
  CheckSquare,
  Users,
  FolderOpen,
  MessageSquare,
  Sparkles,
  PenSquare,
  RefreshCw,
  Sun,
  Moon,
  Laptop,
  ShieldAlert,
  Globe,
  Search,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { Locale } from "@/lib/i18n/dictionaries";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
  onOpenComposer: () => void;
  onOpenAdmin: () => void;
  onSetLocale: (locale: Locale) => void;
  onTriggerAiQuery: (query: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onOpenComposer,
  onOpenAdmin,
  onSetLocale,
  onTriggerAiQuery,
}: CommandPaletteProps) {
  const { setTheme } = useTheme();

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open palette
        }
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <Command
          label="Paleta de Comandos de Worvanta"
          className="w-full bg-transparent flex flex-col"
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-border/80 gap-3">
            <Search className="h-4 w-4 text-primary shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Escribe un comando o hazle una pregunta a la IA..."
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60 text-foreground"
            />
            <span className="text-[10px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded">
              ESC
            </span>
          </div>

          {/* Results List */}
          <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs">
            <Command.Empty className="py-6 text-center text-xs text-muted-foreground">
              No se encontraron comandos coincidentes.
            </Command.Empty>

            {/* Quick Actions Group */}
            <Command.Group heading="Acciones Principales" className="text-[11px] font-semibold text-muted-foreground px-2 py-1.5">
              <Command.Item
                onSelect={() => {
                  onOpenComposer();
                  onClose();
                }}
                className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <PenSquare className="h-4 w-4 text-primary" />
                  <span>Redactar nuevo correo</span>
                </div>
                <span className="text-[10px] font-mono border border-border px-1.5 py-0.5 rounded text-muted-foreground">
                  C
                </span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onTriggerAiQuery("Resumir mis pendientes y correos importantes de hoy");
                  onClose();
                }}
                className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Preguntar a la IA: Resumen de pendientes</span>
                </div>
                <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-semibold">
                  IA
                </span>
              </Command.Item>
            </Command.Group>

            {/* Navigation Group */}
            <Command.Group heading="Navegación de Módulos" className="text-[11px] font-semibold text-muted-foreground px-2 py-1.5 pt-2">
              <Command.Item
                onSelect={() => {
                  onNavigate("today");
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Vista &quot;Hoy&quot; (Dashboard matutino)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onNavigate("mail");
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
              >
                <Inbox className="h-4 w-4 text-blue-500" />
                <span>Bandeja Unificada de Correos</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onNavigate("calendar");
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
              >
                <Calendar className="h-4 w-4 text-emerald-500" />
                <span>Multi-Calendario y Disponibilidad</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onNavigate("tasks");
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
              >
                <CheckSquare className="h-4 w-4 text-purple-500" />
                <span>Gestor de Tareas y Time-Blocking</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onNavigate("chat");
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
              >
                <MessageSquare className="h-4 w-4 text-pink-500" />
                <span>Chat de Equipo en Tiempo Real</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onOpenAdmin();
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
              >
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <span>Consola de Administración del Tenant</span>
              </Command.Item>
            </Command.Group>

            {/* Appearance & Themes Group */}
            <Command.Group heading="Apariencia & Idioma" className="text-[11px] font-semibold text-muted-foreground px-2 py-1.5 pt-2">
              <Command.Item
                onSelect={() => {
                  setTheme("light");
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
              >
                <Sun className="h-4 w-4 text-amber-500" />
                <span>Cambiar a Modo Claro</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setTheme("dark");
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
              >
                <Moon className="h-4 w-4 text-blue-400" />
                <span>Cambiar a Modo Oscuro</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setTheme("system");
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
              >
                <Laptop className="h-4 w-4 text-purple-400" />
                <span>Modo Automático del Sistema</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onSetLocale("es");
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
              >
                <Globe className="h-4 w-4 text-emerald-500" />
                <span>Idioma: Español (ES)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onSetLocale("en");
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
              >
                <Globe className="h-4 w-4 text-emerald-500" />
                <span>Language: English (EN)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onSetLocale("pt");
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
              >
                <Globe className="h-4 w-4 text-emerald-500" />
                <span>Idioma: Português (PT)</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer info */}
          <div className="p-2 border-t border-border/60 bg-muted/20 px-4 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Navega con flechas ↑ ↓ y Enter para ejecutar</span>
            <span className="font-mono">Worvanta Omnibox</span>
          </div>
        </Command>
      </div>
    </div>
  );
}

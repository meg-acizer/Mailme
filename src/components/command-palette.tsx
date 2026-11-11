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
  Sun,
  Moon,
  Laptop,
  ShieldAlert,
  Globe,
  Search,
  Mail,
  FileText,
  User,
  DoorOpen,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { Locale } from "@/lib/i18n/dictionaries";

interface SearchableEmail {
  id: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  aiSummary?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
  onOpenComposer: (to?: string, subject?: string) => void;
  onOpenAdmin: () => void;
  onSetLocale: (locale: Locale) => void;
  onTriggerAiQuery: (query: string) => void;
  emails?: SearchableEmail[];
  onSelectEmail?: (emailId: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onOpenComposer,
  onOpenAdmin,
  onSetLocale,
  onTriggerAiQuery,
  emails = [],
  onSelectEmail,
}: CommandPaletteProps) {
  const { setTheme } = useTheme();

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <Command
          label="Buscador Global y Paleta de Comandos de Worvanta"
          className="w-full bg-transparent flex flex-col"
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-border/80 gap-3">
            <Search className="h-4 w-4 text-primary shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Busca correos, archivos, contactos, salas, tareas o ejecuta un comando..."
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60 text-foreground"
            />
            <span className="text-[10px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded">
              ESC
            </span>
          </div>

          {/* Results List */}
          <Command.List className="max-h-96 overflow-y-auto p-2 space-y-1 text-xs">
            <Command.Empty className="py-8 text-center text-xs text-muted-foreground">
              No se encontraron resultados en Correos, Archivos, Contactos ni Comandos.
            </Command.Empty>

            {/* Quick Actions Group */}
            <Command.Group heading="Acciones Rápidas e IA" className="text-[11px] font-semibold text-muted-foreground px-2 py-1.5">
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

            {/* Live Emails Search Group */}
            {emails.length > 0 && (
              <Command.Group heading="Correos Electrónicos" className="text-[11px] font-semibold text-muted-foreground px-2 py-1.5 pt-2">
                {emails.map((email) => (
                  <Command.Item
                    key={email.id}
                    value={`${email.subject} ${email.senderName} ${email.senderEmail} ${email.aiSummary || ""}`}
                    onSelect={() => {
                      onNavigate("mail");
                      if (onSelectEmail) onSelectEmail(email.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground gap-2"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold block truncate">{email.subject}</span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          De: {email.senderName} ({email.senderEmail})
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">Abrir</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Files & Document Library Search */}
            <Command.Group heading="Archivos & Documentos" className="text-[11px] font-semibold text-muted-foreground px-2 py-1.5 pt-2">
              {[
                { name: "Presupuesto_Q4_v2.pdf", folder: "Presupuestos & Finanzas", scope: "Empresa" },
                { name: "Especificacion_Endpoints_v1.docx", folder: "Especificaciones Técnicas", scope: "Empresa" },
                { name: "Reporte_Financiero_Octubre_2026.xlsx", folder: "Presupuestos & Finanzas", scope: "Empresa" },
                { name: "Worvanta_Brand_Guidelines_v3.pdf", folder: "Identidad & Marca", scope: "Empresa" },
                { name: "Borrador_Contrato_Confidencial.docx", folder: "Mis Borradores Privados", scope: "Personal" },
              ].map((doc, idx) => (
                <Command.Item
                  key={idx}
                  value={`archivo documento ${doc.name} ${doc.folder} ${doc.scope}`}
                  onSelect={() => {
                    onNavigate("files");
                    onClose();
                  }}
                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="h-4 w-4 text-red-500 shrink-0" />
                    <div className="truncate">
                      <span className="font-medium">{doc.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">📁 {doc.folder}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {doc.scope}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Contacts Directory Search */}
            <Command.Group heading="Directorio de Contactos" className="text-[11px] font-semibold text-muted-foreground px-2 py-1.5 pt-2">
              {[
                { name: "Carlos Mendoza", email: "cmendoza@techcorp.io", role: "Director de Finanzas • TechCorp" },
                { name: "Laura Benítez", email: "lbenitez@innovasoft.com", role: "Líder de Integraciones • InnovaSoft" },
                { name: "Roberto Silva", email: "rsilva@alpha-investments.com", role: "Managing Director • Inversiones Alpha" },
                { name: "Laura Gómez", email: "laura@empresa.com", role: "Lead Developer • Equipo Interno" },
                { name: "Sofía Valenzuela", email: "sofia@worvanta.io", role: "Legal & Compliance • Equipo Interno" },
              ].map((cnt, idx) => (
                <Command.Item
                  key={idx}
                  value={`contacto ${cnt.name} ${cnt.email} ${cnt.role}`}
                  onSelect={() => {
                    onOpenComposer(cnt.email, "");
                    onClose();
                  }}
                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <User className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold">{cnt.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">&lt;{cnt.email}&gt; • {cnt.role}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-primary font-semibold shrink-0">Escribir correo</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Meeting Rooms & Resources */}
            <Command.Group heading="Salas de Reuniones Corporativas" className="text-[11px] font-semibold text-muted-foreground px-2 py-1.5 pt-2">
              {[
                { name: "Sala de Conferencias A", info: "Capacidad 12p • Zoom Rooms & Pantalla 4K" },
                { name: "Sala de Conferencias B", info: "Capacidad 8p • Cámara 360°" },
                { name: "Sala VIP de Directorio", info: "Capacidad 16p • Acústica Premium" },
                { name: "Cabina 1 (Insonorizada)", info: "Capacidad 2p • Llamadas 1-a-1" },
              ].map((room, idx) => (
                <Command.Item
                  key={idx}
                  value={`sala reserva calendario ${room.name} ${room.info}`}
                  onSelect={() => {
                    onNavigate("calendar");
                    onClose();
                  }}
                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
                >
                  <div className="flex items-center gap-2.5">
                    <DoorOpen className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>{room.name}</span>
                    <span className="text-[10px] text-muted-foreground">({room.info})</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Ver ocupación</span>
                </Command.Item>
              ))}
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
                <span>Multi-Calendario y Reserva de Salas</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onNavigate("tasks");
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
              >
                <CheckSquare className="h-4 w-4 text-purple-500" />
                <span>Gestor de Tareas y Compromisos</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onNavigate("files");
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
              >
                <FolderOpen className="h-4 w-4 text-amber-500" />
                <span>Archivos & Biblioteca de Adjuntos</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onNavigate("contacts");
                  onClose();
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
              >
                <Users className="h-4 w-4 text-blue-500" />
                <span>Directorio de Contactos</span>
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

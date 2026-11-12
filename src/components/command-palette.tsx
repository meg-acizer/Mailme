"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Phone,
  Building2,
  Clock,
  MapPin,
  ArrowRight,
  Bot,
  Send,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { Locale } from "@/lib/i18n/dictionaries";

export interface SearchableEmail {
  id: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  aiSummary?: string;
  time?: string;
  folder?: string;
}

interface SmartContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
}

interface SmartMeeting {
  id: string;
  title: string;
  time: string;
  location: string;
  attendees: string[];
  contactNames: string[];
  companyNames: string[];
}

interface SmartTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "high" | "normal" | "low";
  status: string;
  relatedContact: string;
  relatedCompany: string;
  linkedEmailId?: string;
}

const SMART_CONTACTS: SmartContact[] = [
  {
    id: "cnt-1",
    name: "Carlos Mendoza",
    email: "cmendoza@techcorp.io",
    phone: "+54 11 5555-0101",
    company: "TechCorp Global",
    role: "Director de Finanzas",
  },
  {
    id: "cnt-2",
    name: "Laura Benítez",
    email: "lbenitez@innovasoft.com",
    phone: "+54 11 5555-0102",
    company: "InnovaSoft Enterprise",
    role: "Líder de Integraciones",
  },
  {
    id: "cnt-3",
    name: "Roberto Silva",
    email: "rsilva@alpha-investments.com",
    phone: "+1 415 555-0199",
    company: "Inversiones Alpha",
    role: "Managing Director",
  },
  {
    id: "cnt-4",
    name: "Elena Rostova",
    email: "elena@delta-corp.io",
    phone: "+44 20 7946 0990",
    company: "Delta Tech International",
    role: "Head of Procurement",
  },
  {
    id: "cnt-5",
    name: "Laura Gómez",
    email: "laura@empresa.com",
    phone: "+54 11 5555-0155",
    company: "Acme Corp / Equipo Interno",
    role: "Lead Developer",
  },
  {
    id: "cnt-6",
    name: "Sofía Valenzuela",
    email: "sofia@worvanta.io",
    phone: "+54 11 5555-0160",
    company: "Worvanta / Equipo Interno",
    role: "Legal & Compliance",
  },
];

const SMART_MEETINGS: SmartMeeting[] = [
  {
    id: "evt-1",
    title: "Sincronización Semanal de Producto",
    time: "Hoy 09:30 - 10:30 hs",
    location: "Google Meet",
    attendees: ["cmendoza@techcorp.io", "laura@empresa.com"],
    contactNames: ["Carlos Mendoza", "Laura Gómez"],
    companyNames: ["TechCorp", "Acme Corp"],
  },
  {
    id: "evt-2",
    title: "Revisión de Presupuesto Q4 con Dirección (Carlos Mendoza)",
    time: "Hoy 14:00 - 15:00 hs",
    location: "Sala de Conferencias B",
    attendees: ["cmendoza@techcorp.io", "direccion@empresa.com"],
    contactNames: ["Carlos Mendoza"],
    companyNames: ["TechCorp Global"],
  },
  {
    id: "evt-3",
    title: "Validación Técnica de Endpoints Multi-Calendario (Laura Benítez)",
    time: "Mañana 11:00 - 11:45 hs",
    location: "Microsoft Teams / Sala A",
    attendees: ["lbenitez@innovasoft.com"],
    contactNames: ["Laura Benítez"],
    companyNames: ["InnovaSoft Enterprise"],
  },
  {
    id: "evt-4",
    title: "Reunión de Inversión y Alianzas 2027 (Roberto Silva)",
    time: "Hoy 16:00 - 17:30 hs",
    location: "Sala VIP de Directorio",
    attendees: ["rsilva@alpha-investments.com", "direccion@empresa.com"],
    contactNames: ["Roberto Silva"],
    companyNames: ["Inversiones Alpha"],
  },
];

const SMART_TASKS: SmartTask[] = [
  {
    id: "tsk-1",
    title: "Revisar y validar presupuesto Q4 v2",
    description: "Revisar el desglose de infraestructura acordado con Carlos Mendoza antes de la reunión del jueves.",
    dueDate: "Jueves 15:00",
    priority: "high",
    status: "En curso",
    relatedContact: "Carlos Mendoza",
    relatedCompany: "TechCorp Global",
    linkedEmailId: "1",
  },
  {
    id: "tsk-2",
    title: "Validar endpoints de integración de calendario",
    description: "Responder a Laura Benítez confirmando las pruebas sobre los endpoints del calendario multi-cuenta.",
    dueDate: "Viernes 18:00",
    priority: "normal",
    status: "Pendiente",
    relatedContact: "Laura Benítez",
    relatedCompany: "InnovaSoft Enterprise",
    linkedEmailId: "2",
  },
  {
    id: "tsk-3",
    title: "Actualizar configuración de políticas de seguridad en Tenant Admin",
    description: "Verificar tamaño máximo de adjuntos con Sofía Valenzuela (Compliance).",
    dueDate: "Lunes próximo",
    priority: "high",
    status: "Pendiente",
    relatedContact: "Sofía Valenzuela",
    relatedCompany: "Worvanta",
  },
  {
    id: "tsk-4",
    title: "Enviar dossier financiero auditado a Inversiones Alpha",
    description: "Compartir proyecciones Q4 con Roberto Silva previo al comité.",
    dueDate: "Mañana 16:00",
    priority: "high",
    status: "Pendiente",
    relatedContact: "Roberto Silva",
    relatedCompany: "Inversiones Alpha",
  },
];

// Normalize accents and lowercase for robust Spanish natural language matching
function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
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
  const [query, setQuery] = useState("");
  const [lastContextContact, setLastContextContact] = useState<SmartContact | null>(SMART_CONTACTS[0]);

  // Reset or keep input when opening
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

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

  // Natural Language Intent Analyzer
  const nlResponse = useMemo(() => {
    const q = normalizeText(query);
    if (q.length < 3) return null;

    // Detect if a specific contact or company is mentioned in the query
    const matchedContacts = SMART_CONTACTS.filter((c) => {
      const nameNorm = normalizeText(c.name);
      const compNorm = normalizeText(c.company);
      const emailNorm = normalizeText(c.email);
      const firstName = nameNorm.split(" ")[0];
      const lastName = nameNorm.split(" ")[1] || "";
      const compFirst = compNorm.split(" ")[0];

      return (
        q.includes(nameNorm) ||
        (firstName.length >= 3 && q.includes(firstName)) ||
        (lastName.length >= 4 && q.includes(lastName)) ||
        (compFirst.length >= 4 && q.includes(compFirst)) ||
        q.includes(emailNorm)
      );
    });

    // Contextual pronoun resolution ("ese contacto", "esa persona", "el mismo", "esa empresa")
    const usesContextualReference =
      q.includes("ese contacto") ||
      q.includes("esa persona") ||
      q.includes("ese cliente") ||
      q.includes("esa empresa") ||
      q.includes("con el") ||
      q.includes("con ella");

    const targetContact =
      matchedContacts[0] || (usesContextualReference ? lastContextContact : null);

    // Intent flags
    const asksEmails =
      q.includes("correo") ||
      q.includes("mail") ||
      q.includes("mensaje") ||
      q.includes("bandeja") ||
      q.includes("ultimos") ||
      q.includes("recientes");

    const asksContact =
      q.includes("contacto") ||
      q.includes("quien es") ||
      q.includes("empresa") ||
      q.includes("telefono") ||
      q.includes("datos de") ||
      q.includes("correo de") ||
      q.includes("mail de");

    const asksMeetings =
      q.includes("reunion") ||
      q.includes("agenda") ||
      q.includes("calendario") ||
      q.includes("evento") ||
      q.includes("cita") ||
      q.includes("llamada") ||
      q.includes("jueves") ||
      q.includes("hoy");

    const asksTasks =
      q.includes("tarea") ||
      q.includes("pendiente") ||
      q.includes("compromiso") ||
      q.includes("hacer") ||
      q.includes("asignad");

    // Extract requested number (e.g. "ultimos 5 correos", "3 correos")
    const numMatch = q.match(/\b(\d+)\b/);
    const requestedLimit = numMatch ? Math.min(Math.max(parseInt(numMatch[1], 10), 1), 15) : 5;

    // 1. Intent: Meetings & Tasks for a specific contact or general
    if (asksMeetings || asksTasks) {
      const filteredMeetings = targetContact
        ? SMART_MEETINGS.filter(
            (m) =>
              m.contactNames.some((n) => normalizeText(n) === normalizeText(targetContact.name)) ||
              m.attendees.includes(targetContact.email)
          )
        : SMART_MEETINGS;

      const filteredTasks = targetContact
        ? SMART_TASKS.filter(
            (t) =>
              normalizeText(t.relatedContact) === normalizeText(targetContact.name) ||
              normalizeText(t.relatedCompany).includes(normalizeText(targetContact.company.split(" ")[0]))
          )
        : SMART_TASKS;

      const showBoth = (asksMeetings && asksTasks) || Boolean(targetContact);

      return {
        type: "meetings_and_tasks" as const,
        targetContact,
        meetings: asksMeetings || showBoth ? filteredMeetings : [],
        tasks: asksTasks || showBoth ? filteredTasks : [],
        summary: targetContact
          ? `Encontré ${filteredMeetings.length} reunión(es) y ${filteredTasks.length} tarea(s) vinculadas a ${targetContact.name} (${targetContact.company}).`
          : `Aquí tienes tus próximas reuniones (${filteredMeetings.length}) y tareas pendientes (${filteredTasks.length}).`,
      };
    }

    // 2. Intent: Contact lookup by company or name ("decime el contacto de la empresa TechCorp", "quien es el contacto de InnovaSoft")
    if (asksContact || matchedContacts.length > 0) {
      const results = matchedContacts.length > 0 ? matchedContacts : SMART_CONTACTS;
      const primary = results[0];

      // Also fetch their meetings & tasks so the user gets a 360 answer immediately
      const contactMeetings = primary
        ? SMART_MEETINGS.filter((m) =>
            m.contactNames.some((n) => normalizeText(n) === normalizeText(primary.name))
          )
        : [];
      const contactTasks = primary
        ? SMART_TASKS.filter(
            (t) => normalizeText(t.relatedContact) === normalizeText(primary.name)
          )
        : [];

      return {
        type: "contact_lookup" as const,
        contacts: results,
        primaryContact: primary,
        contactMeetings,
        contactTasks,
        summary:
          matchedContacts.length > 0
            ? `El contacto de ${primary.company} es ${primary.name} (${primary.role}). Correo: ${primary.email} • Tel: ${primary.phone}.`
            : `Mostrando los contactos del directorio corporativo (${results.length}).`,
      };
    }

    // 3. Intent: Last N emails ("traeme los ultimos 5 correos", "ultimos correos de carlos")
    if (asksEmails) {
      let pool = emails.filter((e) => !e.folder || e.folder === "inbox" || e.folder === "sent");
      if (targetContact) {
        pool = pool.filter(
          (e) =>
            normalizeText(e.senderName).includes(normalizeText(targetContact.name)) ||
            normalizeText(e.senderEmail).includes(normalizeText(targetContact.email))
        );
      }
      const sliced = pool.slice(0, requestedLimit);

      return {
        type: "emails_lookup" as const,
        emails: sliced,
        requestedLimit,
        targetContact,
        summary: targetContact
          ? `Mostrando los últimos ${sliced.length} correo(s) de ${targetContact.name}:`
          : `Aquí tienes los últimos ${sliced.length} correos recibidos/enviados en tu bandeja:`,
      };
    }

    return null;
  }, [query, emails, lastContextContact]);

  // Update conversational memory when a contact is matched
  useEffect(() => {
    if (nlResponse?.type === "contact_lookup" && nlResponse.primaryContact) {
      setLastContextContact(nlResponse.primaryContact);
    } else if (nlResponse?.targetContact) {
      setLastContextContact(nlResponse.targetContact);
    }
  }, [nlResponse]);

  if (!isOpen) return null;

  const suggestedPrompts = [
    "Traeme los últimos 5 correos",
    "Decime el contacto de la empresa TechCorp",
    "Decime el contacto de la empresa InnovaSoft",
    "¿Qué reuniones o tareas tengo con ese contacto?",
    "¿Qué tareas pendientes tengo para esta semana?",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-14 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <Command
          label="Buscador Inteligente en Lenguaje Natural de Worvanta"
          shouldFilter={false}
          className="w-full bg-transparent flex flex-col flex-1 min-h-0"
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-border/80 gap-3 bg-muted/20">
            <div className="p-1.5 rounded-lg bg-primary/15 text-primary shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Escribe en lenguaje natural: 'traeme los últimos 5 correos', 'contacto de TechCorp', 'reuniones con ese contacto'..."
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60 text-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-muted cursor-pointer shrink-0"
              >
                Limpiar
              </button>
            )}
            <span className="text-[10px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded shrink-0">
              ESC
            </span>
          </div>

          {/* Suggested Natural Language Chips */}
          <div className="px-4 py-2 border-b border-border/60 bg-muted/10 flex items-center gap-1.5 overflow-x-auto shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 mr-1">
              Ejemplos IA:
            </span>
            {suggestedPrompts.map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuery(promptText)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-primary/25 bg-primary/5 hover:bg-primary/15 text-primary font-medium transition-colors whitespace-nowrap cursor-pointer shrink-0"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Results List */}
          <Command.List className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {/* 1. NATURAL LANGUAGE AI ANSWER PANEL */}
            {nlResponse && (
              <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-3 animate-in fade-in">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-primary text-primary-foreground shrink-0 mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-primary uppercase tracking-wider">
                          Respuesta Inteligente en Lenguaje Natural
                        </span>
                        {lastContextContact && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-muted text-muted-foreground">
                            Contexto activo: {lastContextContact.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground font-medium mt-1 leading-relaxed">
                        {nlResponse.summary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Case A: Last N Emails Result */}
                {nlResponse.type === "emails_lookup" && (
                  <div className="space-y-1.5 pt-1">
                    {nlResponse.emails.map((email, idx) => (
                      <div
                        key={email.id}
                        onClick={() => {
                          onNavigate("mail");
                          if (onSelectEmail) onSelectEmail(email.id);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-card border border-border hover:border-primary/50 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-2xs"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="h-5 w-5 rounded-full bg-primary/15 text-primary font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-foreground truncate">
                              {email.subject}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              De: <strong className="text-foreground">{email.senderName}</strong> &lt;{email.senderEmail}&gt;
                            </div>
                            {email.aiSummary && (
                              <div className="text-[10px] text-primary mt-0.5 truncate">
                                ✨ {email.aiSummary}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[10px] font-mono text-muted-foreground">{email.time}</span>
                          <span className="text-[10px] font-semibold text-primary flex items-center gap-0.5 mt-1">
                            Abrir <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Case B: Contact Lookup Result (+ Quick Follow-ups) */}
                {nlResponse.type === "contact_lookup" && (
                  <div className="space-y-2.5 pt-1">
                    {nlResponse.contacts.map((cnt) => (
                      <div
                        key={cnt.id}
                        className="p-3.5 rounded-xl bg-card border border-border space-y-2.5 shadow-2xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-xs flex items-center justify-center shrink-0">
                              {cnt.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-foreground flex items-center gap-2">
                                <span>{cnt.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                  {cnt.company}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground">{cnt.role}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onOpenComposer(cnt.email, `Contacto Worvanta - ${cnt.company}`);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="h-3 w-3" />
                              <span>Enviar Correo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setLastContextContact(cnt);
                                setQuery(`¿Qué reuniones y tareas tengo con ${cnt.name}?`);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-semibold cursor-pointer"
                            >
                              Ver reuniones y tareas
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border/60 text-[11px]">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-mono text-foreground truncate">{cnt.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span className="font-mono text-foreground">{cnt.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span className="text-foreground truncate">{cnt.company}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Case C: Meetings & Tasks for Contact or General */}
                {nlResponse.type === "meetings_and_tasks" && (
                  <div className="space-y-3 pt-1">
                    {/* Meetings Subsection */}
                    {nlResponse.meetings.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Reuniones Agendadas ({nlResponse.meetings.length})</span>
                        </div>
                        {nlResponse.meetings.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              onNavigate("calendar");
                              onClose();
                            }}
                            className="p-2.5 rounded-xl bg-card border border-border hover:border-primary/50 flex items-center justify-between gap-3 cursor-pointer transition-all"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-xs text-foreground">{m.title}</div>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  <Clock className="h-3 w-3" /> {m.time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-primary" /> {m.location}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-primary shrink-0">
                              Ir al Calendario →
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tasks Subsection */}
                    {nlResponse.tasks.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <CheckSquare className="h-3.5 w-3.5 text-purple-500" />
                          <span>Tareas y Compromisos ({nlResponse.tasks.length})</span>
                        </div>
                        {nlResponse.tasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => {
                              onNavigate("tasks");
                              onClose();
                            }}
                            className="p-2.5 rounded-xl bg-card border border-border hover:border-primary/50 flex items-center justify-between gap-3 cursor-pointer transition-all"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-foreground">{t.title}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 font-semibold">
                                  Vence: {t.dueDate}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground">{t.description}</p>
                            </div>
                            <span className="text-[10px] font-semibold text-primary shrink-0">
                              Ver Tarea →
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. STANDARD KEYWORD FILTERED RESULTS */}
            {(() => {
              const q = normalizeText(query);
              const matchedEmails = q
                ? emails.filter(
                    (e) =>
                      normalizeText(e.subject).includes(q) ||
                      normalizeText(e.senderName).includes(q) ||
                      normalizeText(e.senderEmail).includes(q) ||
                      normalizeText(e.aiSummary || "").includes(q)
                  )
                : emails.slice(0, 4);

              const matchedContacts = q
                ? SMART_CONTACTS.filter(
                    (c) =>
                      normalizeText(c.name).includes(q) ||
                      normalizeText(c.company).includes(q) ||
                      normalizeText(c.email).includes(q) ||
                      normalizeText(c.role).includes(q)
                  )
                : SMART_CONTACTS.slice(0, 4);

              return (
                <>
                  {/* Quick Actions Group */}
                  {!q && (
                    <Command.Group
                      heading="Acciones Rápidas e IA"
                      className="text-[11px] font-semibold text-muted-foreground px-2 py-1"
                    >
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
                          <span>Preguntar a la IA: Resumen ejecutivo del día</span>
                        </div>
                        <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-semibold">
                          IA
                        </span>
                      </Command.Item>
                    </Command.Group>
                  )}

                  {/* Live Emails Search Group */}
                  {matchedEmails.length > 0 && (
                    <Command.Group
                      heading="Correos Electrónicos"
                      className="text-[11px] font-semibold text-muted-foreground px-2 py-1"
                    >
                      {matchedEmails.map((email) => (
                        <Command.Item
                          key={email.id}
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

                  {/* Contacts Directory Search */}
                  {matchedContacts.length > 0 && (
                    <Command.Group
                      heading="Directorio de Contactos & Empresas"
                      className="text-[11px] font-semibold text-muted-foreground px-2 py-1"
                    >
                      {matchedContacts.map((cnt) => (
                        <Command.Item
                          key={cnt.id}
                          onSelect={() => {
                            setLastContextContact(cnt);
                            setQuery(`¿Qué reuniones y tareas tengo con ${cnt.name}?`);
                          }}
                          className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted text-foreground"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <User className="h-4 w-4 text-emerald-500 shrink-0" />
                            <div className="truncate">
                              <span className="font-semibold">{cnt.name}</span>
                              <span className="text-[10px] text-muted-foreground ml-2">
                                {cnt.company} • {cnt.role} (&lt;{cnt.email}&gt;)
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-primary font-semibold shrink-0">
                            Ver 360° (Reuniones/Tareas)
                          </span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}

                  {/* Navigation Group when query is empty */}
                  {!q && (
                    <Command.Group
                      heading="Navegación de Módulos"
                      className="text-[11px] font-semibold text-muted-foreground px-2 py-1"
                    >
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
                    </Command.Group>
                  )}
                </>
              );
            })()}
          </Command.List>

          {/* Footer info */}
          <div className="p-2.5 border-t border-border/60 bg-muted/20 px-4 flex items-center justify-between text-[11px] text-muted-foreground shrink-0">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Soporta consultas en lenguaje natural y contexto conversacional</span>
            </span>
            <span className="font-mono">Worvanta Smart Omnibox</span>
          </div>
        </Command>
      </div>
    </div>
  );
}

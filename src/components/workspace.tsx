"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { dictionaries, type Locale } from "@/lib/i18n/dictionaries";
import { MailComposer, type AttachedFile } from "./mail-composer";
import { CommandPalette } from "./command-palette";
import { TodayView } from "./views/today-view";
import { CalendarView } from "./views/calendar-view";
import { TeamChatView } from "./views/team-chat-view";
import { ContactsView } from "./views/contacts-view";
import { AccountManagerModal, type ConnectedAccount } from "./account-manager-modal";
import {
  Inbox,
  Calendar,
  CheckSquare,
  Users,
  FolderOpen,
  Sparkles,
  Search,
  ShieldCheck,
  Building2,
  Sun,
  Moon,
  Laptop,
  MessageSquare,
  Paperclip,
  Clock,
  Send,
  MoreVertical,
  Reply,
  ReplyAll,
  Forward,
  Printer,
  Mail,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileText,
  CalendarPlus,
  PenSquare,
  LogOut,
  ShieldAlert,
  RefreshCw,
  Tag,
  UserPlus,
  File,
  Download,
  Plus,
  ChevronDown,
  Settings2,
} from "lucide-react";

interface EmailItem {
  id: string;
  senderName: string;
  senderEmail: string;
  account: { name: string; color: string };
  subject: string;
  preview: string;
  aiSummary: string;
  time: string;
  isUnread: boolean;
  triage: "important" | "pending" | "other";
  priority?: "high" | "normal" | "low";
  tags?: string[];
  to?: string[];
  cc?: string[];
  attachments?: Array<{ name: string; size: string; type: string }>;
  extractedData?: {
    meeting?: string;
    invoice?: string;
  };
}

const mockEmails: EmailItem[] = [
  {
    id: "1",
    senderName: "Carlos Mendoza",
    senderEmail: "cmendoza@techcorp.io",
    account: { name: "Google Workspace", color: "#3b82f6" },
    subject: "Propuesta comercial Q4 y coordinación de reunión técnica",
    preview: "Hola, te adjunto la última versión del presupuesto con los cambios solicitados...",
    aiSummary: "Envía cotización revisada para Q4 y solicita coordinar reunión de 45m este jueves.",
    time: "10:42 AM",
    isUnread: true,
    triage: "important",
    priority: "high",
    tags: ["#Finanzas", "#Propuesta-Q4", "#VIP"],
    to: ["equipo@empresa.com", "direccion@empresa.com"],
    cc: ["carlos@techcorp.io"],
    attachments: [
      { name: "Presupuesto_Q4_v2.pdf", size: "1.4 MB", type: "application/pdf" },
    ],
    extractedData: {
      meeting: "Jueves 15:00 hs (Libre en tus agendas)",
      invoice: "Presupuesto_Q4_v2.pdf ($14,500)",
    },
  },
  {
    id: "2",
    senderName: "Laura Benítez",
    senderEmail: "lbenitez@innovasoft.com",
    account: { name: "Microsoft 365", color: "#f97316" },
    subject: "Re: Estado del proyecto de integración MailMe",
    preview: "Excelente avance. ¿Pudieron revisar los endpoints del calendario?",
    aiSummary: "Consulta sobre validación de endpoints del calendario multi-cuenta.",
    time: "09:15 AM",
    isUnread: false,
    triage: "important",
    priority: "normal",
    tags: ["#Proyecto-MailMe", "#Sprint-1"],
    to: ["equipo@empresa.com"],
    attachments: [
      { name: "Especificacion_Endpoints_v1.docx", size: "480 KB", type: "application/docx" },
    ],
  },
  {
    id: "3",
    senderName: "GitHub Notifications",
    senderEmail: "notifications@github.com",
    account: { name: "IMAP Servidor", color: "#10b981" },
    subject: "[meg-acizer/Mailme] New pull request: Multi-tenant RLS schema",
    preview: "meg-acizer opened a new pull request #1...",
    aiSummary: "Nuevo PR abierto para revisión con la migración inicial de base de datos.",
    time: "Ayer",
    isUnread: false,
    triage: "pending",
    priority: "low",
    tags: ["#DevOps", "#GitHub"],
    to: ["desarrollo@empresa.com"],
  },
];

export interface WorkspaceUser {
  id: string;
  email: string;
  name: string;
  tenantName: string;
}

interface WorkspaceProps {
  user?: WorkspaceUser;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
}

export function Workspace({ user, onLogout, onOpenAdmin }: WorkspaceProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [locale, setLocale] = useState<Locale>("es");
  const [activeModule, setActiveModule] = useState<string>("mail");
  const [emailsList, setEmailsList] = useState<EmailItem[]>(mockEmails);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem>(mockEmails[0]);
  const [triageFilter, setTriageFilter] = useState<"important" | "pending" | "other">("important");
  const [aiPrompt, setAiPrompt] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTriaging, setIsTriaging] = useState(false);

  // Composer Modal State
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerData, setComposerData] = useState<{
    to: string;
    cc?: string;
    subject: string;
    body: string;
    attachments?: AttachedFile[];
  }>({ to: "", cc: "", subject: "", body: "", attachments: [] });

  // Dropdown menu state for email actions (Responder a todos, Reenviar, etc.)
  const [emailActionsMenuOpen, setEmailActionsMenuOpen] = useState(false);

  // User Multiple Accounts State
  const [accountsList, setAccountsList] = useState<ConnectedAccount[]>([
    { id: "1", provider: "microsoft", email: "lbenitez@innovasoft.com", displayName: "Microsoft 365 (Trabajo)", color: "#f97316", isDefault: true },
    { id: "2", provider: "google", email: "cmendoza@techcorp.io", displayName: "Google Workspace (Personal)", color: "#3b82f6" },
    { id: "3", provider: "imap_smtp", email: "soporte@miempresa.com", displayName: "IMAP Servidor (Clientes)", color: "#10b981" },
  ]);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string | null>(null);
  const [contactSavedNotice, setContactSavedNotice] = useState<string | null>(null);

  const t = dictionaries[locale];

  const filteredEmails = emailsList.filter((email) => {
    const matchesTriage = email.triage === triageFilter;
    const matchesAccount = !selectedAccountFilter || email.account.name.toLowerCase().includes(selectedAccountFilter.toLowerCase());
    return matchesTriage && matchesAccount;
  });

  const handleUpdatePriority = (emailId: string, priority: "high" | "normal" | "low") => {
    setEmailsList((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, priority } : e))
    );
    if (selectedEmail.id === emailId) {
      setSelectedEmail((prev) => ({ ...prev, priority }));
    }
    setActionNotice(`Prioridad marcada como: ${priority === "high" ? "Alta / Importante" : priority === "low" ? "Baja / No urgente" : "Normal"}`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleAddTagPrompt = (emailId: string) => {
    const newTag = prompt("Ingresa el nombre de la etiqueta (ej: #Finanzas, #Urgente):", "#");
    if (!newTag || newTag.trim() === "#") return;
    const tagFormatted = newTag.startsWith("#") ? newTag.trim() : `#${newTag.trim()}`;

    setEmailsList((prev) =>
      prev.map((e) => {
        if (e.id === emailId) {
          const currentTags = e.tags || [];
          return currentTags.includes(tagFormatted) ? e : { ...e, tags: [...currentTags, tagFormatted] };
        }
        return e;
      })
    );
    if (selectedEmail.id === emailId) {
      const currentTags = selectedEmail.tags || [];
      if (!currentTags.includes(tagFormatted)) {
        setSelectedEmail((prev) => ({ ...prev, tags: [...currentTags, tagFormatted] }));
      }
    }
  };

  const handleSaveContact = (email: string, name?: string) => {
    setContactSavedNotice(`✓ Contacto "${name || email}" guardado en la Libreta Corporativa.`);
    setTimeout(() => setContactSavedNotice(null), 3500);
  };

  const handleRunAiTriage = async (targetEmail: EmailItem) => {
    setIsTriaging(true);
    setActionNotice("Analizando correo con el motor de IA...");
    try {
      const res = await fetch("/api/ai/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: targetEmail.subject,
          from: targetEmail.senderEmail,
          text: targetEmail.preview,
          tenantSlug: "acme-corp",
        }),
      });

      const data = await res.json();
      if (data.triage) {
        const updated: EmailItem = {
          ...targetEmail,
          aiSummary: data.triage.oneLineSummary || targetEmail.aiSummary,
          extractedData: {
            meeting: data.triage.extractedData?.meeting || targetEmail.extractedData?.meeting,
            invoice: data.triage.extractedData?.invoiceOrAmount || targetEmail.extractedData?.invoice,
          },
        };

        setSelectedEmail(updated);
        setEmailsList((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        setActionNotice("Triage IA completado con éxito");
      }
    } catch (err) {
      console.error("Error running AI triage", err);
      setActionNotice("No se pudo conectar con el LLM, usando resumen de respaldo");
    } finally {
      setIsTriaging(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Set mounted on client to prevent theme hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut listener ('c' for compose, 'Cmd+K' for command palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (
        e.key.toLowerCase() === "c" &&
        !composerOpen &&
        !isCommandPaletteOpen &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setComposerData({ to: "", subject: "", body: "" });
        setComposerOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [composerOpen, isCommandPaletteOpen]);

  const handleOpenComposer = (
    to = "",
    subject = "",
    body = "",
    cc = "",
    attachments: AttachedFile[] = []
  ) => {
    setComposerData({ to, subject, body, cc, attachments });
    setComposerOpen(true);
  };

  const handleReplyAll = (email: EmailItem) => {
    const otherRecipients = (email.to || []).filter((addr) => addr !== email.senderEmail);
    const toRecipients = [email.senderEmail, ...otherRecipients].filter(Boolean);
    const toStr = Array.from(new Set(toRecipients)).join(", ");
    const ccStr = (email.cc || []).join(", ");
    const subStr = email.subject.toLowerCase().startsWith("re:") ? email.subject : `Re: ${email.subject}`;

    const bodyQuote = `\n\n-------------------------\nEl ${email.time}, ${email.senderName} <${email.senderEmail}> escribió:\n> Estimado equipo,\n> Adjunto los detalles acordados para la etapa de cierre de año. En el archivo se detalla el desglose por rubro y los plazos de entrega estimados para cada entregable.\n> ¿Tendrán disponibilidad el jueves a las 15:00 hs para revisar estos puntos en una llamada de 45 minutos?\n\n`;

    handleOpenComposer(toStr, subStr, bodyQuote, ccStr);
    setEmailActionsMenuOpen(false);
  };

  const handleForward = (email: EmailItem) => {
    const subStr = email.subject.toLowerCase().startsWith("fwd:") || email.subject.toLowerCase().startsWith("rv:")
      ? email.subject
      : `Rv: ${email.subject}`;

    const bodyQuote = `\n\n---------- Mensaje reenviado ----------\nDe: ${email.senderName} <${email.senderEmail}>\nFecha: ${email.time}\nAsunto: ${email.subject}\nPara: ${(email.to || []).join(", ")}${email.cc && email.cc.length > 0 ? `\nCC: ${email.cc.join(", ")}` : ""}\n\nEstimado equipo,\n\nAdjunto los detalles acordados para la etapa de cierre de año. En el archivo se detalla el desglose por rubro y los plazos de entrega estimados para cada entregable.\n\n¿Tendrán disponibilidad el jueves a las 15:00 hs para revisar estos puntos en una llamada de 45 minutos?\n\nSaludos cordiales,\n${email.senderName}\n`;

    const forwardAttachments: AttachedFile[] = [
      { name: "Presupuesto_Q4_v2.pdf", size: "1.4 MB", type: "application/pdf" }
    ];

    handleOpenComposer("", subStr, bodyQuote, "", forwardAttachments);
    setEmailActionsMenuOpen(false);
  };

  const handleQuickAction = (actionText: string) => {
    if (actionText === "Confirmar reunión jueves 15:00") {
      handleOpenComposer(
        selectedEmail.senderEmail,
        `Re: ${selectedEmail.subject}`,
        `Hola ${selectedEmail.senderName},\n\nPerfecto, me queda excelente el jueves a las 15:00 hs. Ya reservo el espacio en mi agenda.\n\nSaludos cordiales.`
      );
    } else if (actionText === "Solicitar desglose adicional") {
      handleOpenComposer(
        selectedEmail.senderEmail,
        `Re: ${selectedEmail.subject}`,
        `Hola ${selectedEmail.senderName},\n\nGracias por la propuesta. ¿Podrías enviarme un desglose más detallado del ítem de infraestructura?\n\nQuedo atento.`
      );
    } else if (actionText === "Proponer viernes 11:00") {
      handleOpenComposer(
        selectedEmail.senderEmail,
        `Re: ${selectedEmail.subject}`,
        `Hola ${selectedEmail.senderName},\n\nEl jueves tengo la tarde ocupada con compromisos previos. ¿Te parece si coordinamos para el viernes a las 11:00 hs?\n\nSaludos cordiales.`
      );
    } else {
      setActionNotice(`Acción IA: "${actionText}" procesada`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground text-sm select-none">
      {/* 1. LEFT NAVIGATION SIDEBAR */}
      <aside className="w-64 border-r border-border flex flex-col justify-between bg-card/60 backdrop-blur-md">
        <div>
          {/* Tenant / Company Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-base">
                M
              </div>
              <div>
                <h1 className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">
                  Tenant
                </h1>
                <p className="font-medium text-sm flex items-center gap-1.5 truncate">
                  <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{user?.tenantName || "Acme Corp"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Compose Button */}
          <div className="p-3 pb-1">
            <button
              onClick={() => handleOpenComposer()}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
            >
              <PenSquare className="h-4 w-4" />
              <span>Redactar</span>
              <span className="text-[10px] opacity-80 border border-primary-foreground/30 px-1.5 py-0.2 rounded font-mono">
                C
              </span>
            </button>
          </div>

          {/* Core Modules Navigation */}
          <nav className="p-2 space-y-1">
            <button
              onClick={() => setActiveModule("today")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                activeModule === "today"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>{t.common.today}</span>
            </button>

            <button
              onClick={() => setActiveModule("mail")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium transition-colors ${
                activeModule === "mail"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Inbox className="h-4 w-4" />
                <span>{t.common.mail}</span>
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-foreground font-semibold">
                3
              </span>
            </button>

            <button
              onClick={() => setActiveModule("calendar")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                activeModule === "calendar"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>{t.common.calendar}</span>
            </button>

            <button
              onClick={() => setActiveModule("tasks")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                activeModule === "tasks"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              <span>{t.common.tasks}</span>
            </button>

            <button
              onClick={() => setActiveModule("contacts")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                activeModule === "contacts"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>{t.common.contacts}</span>
            </button>

            <button
              onClick={() => setActiveModule("files")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                activeModule === "files"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              <span>{t.common.files}</span>
            </button>

            <button
              onClick={() => setActiveModule("chat")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium transition-colors ${
                activeModule === "chat"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4" />
                <span>{t.common.chat}</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          </nav>

          {/* Connected Accounts Section */}
          <div className="px-4 pt-5 pb-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t.common.allAccounts}
              </h2>
              <button
                type="button"
                onClick={() => setIsAccountsModalOpen(true)}
                className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Configurar y Agregar Cuentas"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <div
                onClick={() => setSelectedAccountFilter(null)}
                className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
                  selectedAccountFilter === null
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <span>Bandeja Unificada</span>
                <span className="text-[10px] font-mono text-muted-foreground">({emailsList.length})</span>
              </div>

              {accountsList.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccountFilter(acc.displayName)}
                  className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
                    selectedAccountFilter === acc.displayName
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-1">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: acc.color }}
                    />
                    <span className="truncate">{acc.displayName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preferences & Settings Footer (i18n & Themes) */}
        <div className="p-3 border-t border-border space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-md text-xs">
              {(["es", "en", "pt"] as Locale[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLocale(lang)}
                  className={`px-2 py-1 rounded uppercase font-semibold text-[10px] ${
                    locale === lang
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Theme Switcher */}
            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-md text-xs">
              <button
                onClick={() => setTheme("light")}
                title={t.theme.light}
                className={`p-1 rounded ${
                  mounted && theme === "light"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                title={t.theme.dark}
                className={`p-1 rounded ${
                  mounted && theme === "dark"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTheme("system")}
                title={t.theme.system}
                className={`p-1 rounded ${
                  mounted && theme === "system"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Top Command Palette & Search Bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/40 backdrop-blur">
          <div className="flex items-center gap-3 w-96">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="relative w-full flex items-center justify-between bg-muted/60 pl-9 pr-3 py-1.5 rounded-lg border border-border/80 text-xs text-muted-foreground hover:bg-muted cursor-pointer transition-colors"
            >
              <Search className="h-4 w-4 absolute left-3 top-2 text-muted-foreground" />
              <span className="truncate">{t.common.searchPlaceholder}</span>
              <span className="text-[10px] font-mono border border-border px-1.5 py-0.5 rounded bg-card text-foreground shrink-0 ml-2">
                ⌘K
              </span>
            </button>
          </div>

          {actionNotice && (
            <div className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full animate-fade-in flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {actionNotice}
            </div>
          )}

          <div className="flex items-center gap-2.5">
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 text-xs bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer"
                title="Consola de Administración del Tenant"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Admin del Tenant</span>
              </button>
            )}

            <span className="text-xs text-muted-foreground font-mono">
              user: <strong className="text-foreground">{user?.name || user?.email || "meg-acizer"}</strong>
            </span>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-muted transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Salir</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area: Today Dashboard View, Calendar, Team Chat, Contacts, or 3-Column Unified Inbox */}
        {activeModule === "today" ? (
          <TodayView
            userName={user?.name || "meg-acizer"}
            onNavigateToMail={() => setActiveModule("mail")}
            onNavigateToCalendar={() => setActiveModule("calendar")}
            onOpenComposer={(to, sub) => handleOpenComposer(to, sub)}
          />
        ) : activeModule === "calendar" ? (
          <CalendarView />
        ) : activeModule === "chat" ? (
          <TeamChatView />
        ) : activeModule === "contacts" ? (
          <ContactsView />
        ) : (
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Column A: Unified Inbox List */}
            <section className="w-80 border-r border-border flex flex-col bg-card/20">
            {/* Triage Chips */}
            <div className="p-3 border-b border-border flex gap-1.5">
              <button
                onClick={() => setTriageFilter("important")}
                className={`flex-1 py-1 px-2 rounded-md text-xs font-medium text-center transition-all ${
                  triageFilter === "important"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                {t.triage.important}
              </button>
              <button
                onClick={() => setTriageFilter("pending")}
                className={`flex-1 py-1 px-2 rounded-md text-xs font-medium text-center transition-all ${
                  triageFilter === "pending"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                {t.triage.pending}
              </button>
              <button
                onClick={() => setTriageFilter("other")}
                className={`flex-1 py-1 px-2 rounded-md text-xs font-medium text-center transition-all ${
                  triageFilter === "other"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                {t.triage.all}
              </button>
            </div>

            {/* Email List Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    selectedEmail.id === email.id
                      ? "bg-accent/40 border-l-2 border-primary"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: email.account.color }}
                      />
                      <span className="truncate">{email.senderName}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">{email.time}</span>
                  </div>
                  <h3 className="font-medium text-xs truncate mb-1 text-foreground">
                    {email.subject}
                  </h3>
                  <div className="mt-1.5 bg-primary/10 border border-primary/20 rounded p-1.5 flex items-start gap-1.5 text-[11px] text-primary leading-tight">
                    <Sparkles className="h-3 w-3 shrink-0 mt-0.5" />
                    <span>{email.aiSummary}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Column B: Email Reading Pane - Hoja de Papel estilo Outlook */}
          <section className="flex-1 flex flex-col min-w-0 bg-muted/40 overflow-y-auto p-4 md:p-6">
            {contactSavedNotice && (
              <div className="max-w-4xl mx-auto w-full mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 font-medium flex items-center justify-between">
                <span>{contactSavedNotice}</span>
                <button onClick={() => setContactSavedNotice(null)} className="text-muted-foreground hover:text-foreground">×</button>
              </div>
            )}

            {selectedEmail ? (
              <div className="w-full max-w-4xl mx-auto bg-card text-foreground border border-border shadow-xl rounded-2xl overflow-hidden flex flex-col">
                {/* 1. Encabezado Delgado de Estado, Prioridad e IA (Slim Header) */}
                <div className="px-6 py-2.5 bg-muted/30 border-b border-border/60 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Selector de Prioridad (Estilo Outlook) */}
                    <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-lg border border-border shadow-sm">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">Prioridad:</span>
                      <select
                        value={selectedEmail.priority || "normal"}
                        onChange={(e) => handleUpdatePriority(selectedEmail.id, e.target.value as any)}
                        className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
                      >
                        <option value="high">🔴 Alta / Importante</option>
                        <option value="normal">⚪ Normal</option>
                        <option value="low">🟢 Baja / No urgente</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-emerald-500/20">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>SPF/DKIM Verificado</span>
                    </div>
                  </div>

                  {/* Resumen IA Compacto en una Sola Línea */}
                  <div className="flex items-center gap-2 truncate justify-end">
                    <div className="flex items-center gap-1.5 text-primary text-[11px] truncate">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                      <span className="font-bold shrink-0">IA:</span>
                      <span className="text-muted-foreground truncate">{selectedEmail.aiSummary}</span>
                    </div>
                    <button
                      onClick={() => handleRunAiTriage(selectedEmail)}
                      disabled={isTriaging}
                      className="text-[11px] font-semibold text-primary hover:underline shrink-0"
                    >
                      {isTriaging ? "..." : "Re-analizar"}
                    </button>
                  </div>
                </div>

                {/* 2. Cabecera del Documento: Asunto, De, Para, CC, Etiquetas */}
                <div className="px-8 pt-6 pb-4 border-b border-border/60 space-y-3.5 bg-card">
                  {/* Asunto y Barra de Acciones */}
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="text-xl font-bold text-foreground tracking-tight leading-snug">
                      {selectedEmail.subject}
                    </h1>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setActiveModule("chat")}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        title="Discutir este correo internamente con el equipo"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                        <span className="hidden sm:inline">Discutir en Chat</span>
                      </button>
                      <button
                        onClick={() => handleOpenComposer(
                          selectedEmail.senderEmail,
                          `Re: ${selectedEmail.subject}`,
                          `\n\n-------------------------\nEl ${selectedEmail.time}, ${selectedEmail.senderName} <${selectedEmail.senderEmail}> escribió:\n> Estimado equipo,\n> Adjunto los detalles acordados para la etapa de cierre de año...\n`
                        )}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 cursor-pointer transition-colors"
                        title="Responder"
                      >
                        <Reply className="h-3.5 w-3.5" />
                        <span>Responder</span>
                      </button>

                      {/* Dropdown de Más Acciones (Responder a todos, Reenviar...) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setEmailActionsMenuOpen((prev) => !prev)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            emailActionsMenuOpen
                              ? "bg-muted text-foreground border-primary"
                              : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                          title="Más opciones: Responder a todos, Reenviar"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {emailActionsMenuOpen && (
                          <>
                            {/* Backdrop para cerrar al hacer clic fuera */}
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setEmailActionsMenuOpen(false)}
                            />
                            {/* Menú Flotante */}
                            <div className="absolute right-0 top-full mt-1.5 z-50 w-60 bg-card border border-border rounded-xl shadow-2xl py-1.5 text-xs animate-in fade-in zoom-in-95 backdrop-blur-md">
                              <button
                                type="button"
                                onClick={() => handleReplyAll(selectedEmail)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted text-foreground transition-colors cursor-pointer group"
                              >
                                <ReplyAll className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                                <div>
                                  <div className="font-semibold text-foreground">Responder a todos</div>
                                  <div className="text-[10px] text-muted-foreground">Incluye remitente y a todos en copia</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleForward(selectedEmail)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted text-foreground transition-colors cursor-pointer group"
                              >
                                <Forward className="h-4 w-4 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
                                <div>
                                  <div className="font-semibold text-foreground">Reenviar</div>
                                  <div className="text-[10px] text-muted-foreground">Reenvía correo con adjuntos</div>
                                </div>
                              </button>

                              <div className="h-px bg-border my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  setActionNotice("Correo marcado como no leído");
                                  setEmailActionsMenuOpen(false);
                                  setTimeout(() => setActionNotice(null), 3000);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              >
                                <Mail className="h-4 w-4 shrink-0" />
                                <span>Marcar como no leído</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEmailActionsMenuOpen(false);
                                  window.print();
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              >
                                <Printer className="h-4 w-4 shrink-0" />
                                <span>Imprimir correo</span>
                              </button>

                              <div className="h-px bg-border my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  setEmailsList((prev) => prev.filter((e) => e.id !== selectedEmail.id));
                                  setActionNotice("Correo movido a la papelera");
                                  setEmailActionsMenuOpen(false);
                                  setTimeout(() => setActionNotice(null), 3000);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 shrink-0" />
                                <span>Eliminar correo</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Campos de Cabecera del Correo */}
                  <div className="space-y-2 text-xs pt-1">
                    {/* Campo DE: */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-muted-foreground w-14 shrink-0 uppercase text-[10px]">De:</span>
                        <span className="font-bold text-foreground text-sm">{selectedEmail.senderName}</span>
                        <span className="text-muted-foreground font-mono">&lt;{selectedEmail.senderEmail}&gt;</span>
                        <span
                          className="px-2 py-0.2 rounded text-[10px] font-semibold text-white ml-1"
                          style={{ backgroundColor: selectedEmail.account.color }}
                        >
                          {selectedEmail.account.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSaveContact(selectedEmail.senderEmail, selectedEmail.senderName)}
                          className="text-[10px] text-primary hover:underline font-semibold ml-2 flex items-center gap-1 cursor-pointer bg-primary/10 px-2 py-0.5 rounded"
                          title="Guardar este remitente como contacto en el directorio corporativo"
                        >
                          <UserPlus className="h-3 w-3" />
                          <span>+ Guardar contacto</span>
                        </button>
                      </div>
                      <span className="text-muted-foreground text-xs font-mono">{selectedEmail.time}</span>
                    </div>

                    {/* Campo PARA: */}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-muted-foreground w-14 shrink-0 uppercase text-[10px]">Para:</span>
                      <span className="text-muted-foreground font-mono">
                        {selectedEmail.to?.join(", ") || "equipo@empresa.com"}
                      </span>
                    </div>

                    {/* Campo CC: si existe */}
                    {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-muted-foreground w-14 shrink-0 uppercase text-[10px]">CC:</span>
                        <span className="text-muted-foreground font-mono">{selectedEmail.cc.join(", ")}</span>
                      </div>
                    )}

                    {/* Etiquetas Claras y Selector Interactivo */}
                    <div className="flex items-center gap-2 pt-1.5 border-t border-border/40">
                      <span className="font-bold text-muted-foreground w-14 shrink-0 uppercase text-[10px]">Etiquetas:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(selectedEmail.tags || ["#Proyecto-MailMe", "#Dirección"]).map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1"
                          >
                            <Tag className="h-3 w-3" />
                            <span>{tag}</span>
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddTagPrompt(selectedEmail.id)}
                          className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded border border-dashed border-primary/40 hover:bg-primary/5"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Etiquetar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. CUERPO DEL CORREO: Aspecto de Hoja de Papel */}
                <div className="p-8 text-xs leading-relaxed space-y-4 text-foreground/90 font-sans min-h-[220px] bg-card">
                  <p>Estimado equipo,</p>
                  <p>
                    Adjunto los detalles acordados para la etapa de cierre de año. En el archivo se detalla el
                    desglose por rubro y los plazos de entrega estimados para cada entregable.
                  </p>
                  <p>
                    ¿Tendrán disponibilidad el <strong>jueves a las 15:00 hs</strong> para revisar estos puntos en
                    una llamada de 45 minutos?
                  </p>
                  <p className="pt-3">
                    Saludos cordiales,<br />
                    <strong>{selectedEmail.senderName}</strong>
                  </p>
                </div>

                {/* 4. Archivos Adjuntos (Estilo Outlook con descarga y vista previa) */}
                <div className="px-8 py-3.5 bg-muted/20 border-t border-border/60">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                    Archivos Adjuntos (1 archivo • Escaneado por ClamAV)
                  </span>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors cursor-pointer group shadow-sm">
                      <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                        <File className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors block">
                          Presupuesto_Q4_v2.pdf
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">1.4 MB • Documento PDF</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert("Descargando Presupuesto_Q4_v2.pdf...")}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted ml-2 cursor-pointer"
                        title="Descargar archivo"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5. Respuestas Sugeridas de IA al Pie de la Hoja */}
                <div className="px-8 py-3.5 bg-muted/30 border-t border-border/60 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-muted-foreground">Respuestas sugeridas:</span>
                    <button
                      onClick={() => handleQuickAction("Confirmar reunión jueves 15:00")}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{t.ai.acceptMeeting}</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction("Solicitar desglose adicional")}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
                    >
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      <span>{t.ai.askDetails}</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction("Proponer viernes 11:00")}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      <span>{t.ai.proposeAlternative}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          {/* Column C: Contextual Panel (Contact 360° & AI Assistant) */}
          <aside className="w-80 border-l border-border flex flex-col bg-card/40 backdrop-blur-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                {t.contact360.title}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500">
                VIP
              </span>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {/* Contact Card */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                  CM
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-foreground">Carlos Mendoza</h4>
                  <p className="text-[11px] text-muted-foreground">TechCorp Solutions</p>
                  <p className="text-[10px] text-muted-foreground">CTO & Fundador</p>
                </div>
              </div>

              {/* Recent Interactions */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {t.contact360.recentInteractions}
                </span>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="truncate">Reunión de avance</span>
                    <span className="text-[10px]">Hace 3 días</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="truncate">Envío de NDA firmado</span>
                    <span className="text-[10px]">12 Oct</span>
                  </div>
                </div>
              </div>

              {/* Shared Files */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {t.contact360.sharedFiles}
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 p-1.5 bg-muted/40 rounded text-xs cursor-pointer hover:bg-muted">
                    <Paperclip className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate font-medium">Presupuesto_Q4_v2.pdf</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded AI Assistant Box */}
            <div className="p-3 border-t border-border bg-card">
              <div className="relative">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && aiPrompt.trim()) {
                      handleQuickAction(aiPrompt);
                      setAiPrompt("");
                    }
                  }}
                  placeholder={t.ai.askAboutThread}
                  className="w-full bg-muted/60 pl-3 pr-8 py-2 rounded-lg border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={() => {
                    if (aiPrompt.trim()) {
                      handleQuickAction(aiPrompt);
                      setAiPrompt("");
                    }
                  }}
                  className="absolute right-2 top-2 text-primary hover:text-primary/80"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
      </main>

      {/* Floating Mail Composer Window */}
      <MailComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        initialTo={composerData.to}
        initialCc={composerData.cc}
        initialSubject={composerData.subject}
        initialBody={composerData.body}
        initialAttachments={composerData.attachments}
        accounts={accountsList}
        onSaveContact={(email) => handleSaveContact(email)}
        onSendSuccess={(msg) => {
          setActionNotice(msg);
          setTimeout(() => setActionNotice(null), 4000);
        }}
      />

      {/* Account Manager Modal */}
      <AccountManagerModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
        accounts={accountsList}
        onAddAccount={(newAcc) => {
          setAccountsList((prev) => [...prev, newAcc]);
          setActionNotice(`Cuenta ${newAcc.email} vinculada con éxito`);
          setTimeout(() => setActionNotice(null), 4000);
        }}
        onRemoveAccount={(accId) => {
          setAccountsList((prev) => prev.filter((a) => a.id !== accId));
          setActionNotice("Cuenta desconectada");
          setTimeout(() => setActionNotice(null), 4000);
        }}
      />

      {/* Universal Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(mod) => setActiveModule(mod)}
        onOpenComposer={() => handleOpenComposer()}
        onOpenAdmin={() => {
          if (onOpenAdmin) onOpenAdmin();
        }}
        onSetLocale={(loc) => setLocale(loc)}
        onTriggerAiQuery={(query) => {
          handleQuickAction(query);
        }}
      />
    </div>
  );
}

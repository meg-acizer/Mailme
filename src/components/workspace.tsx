"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { dictionaries, type Locale } from "@/lib/i18n/dictionaries";
import { MailComposer } from "./mail-composer";
import { CommandPalette } from "./command-palette";
import { TodayView } from "./views/today-view";
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
  CheckCircle,
  AlertCircle,
  FileText,
  CalendarPlus,
  PenSquare,
  LogOut,
  ShieldAlert,
  RefreshCw,
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
  const [composerData, setComposerData] = useState({ to: "", subject: "", body: "" });

  const t = dictionaries[locale];

  const filteredEmails = emailsList.filter((email) => email.triage === triageFilter);

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

  const handleOpenComposer = (to = "", subject = "", body = "") => {
    setComposerData({ to, subject, body });
    setComposerOpen(true);
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
          <div className="px-4 pt-6 pb-2">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t.common.allAccounts}
            </h2>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded cursor-pointer">
                <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                <span className="truncate">Google (Personal)</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded cursor-pointer">
                <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                <span className="truncate">Outlook (Trabajo)</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded cursor-pointer">
                <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                <span className="truncate">IMAP (Clientes)</span>
              </div>
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

        {/* Main Content Area: Today Dashboard View or 3-Column Unified Inbox */}
        {activeModule === "today" ? (
          <TodayView
            userName={user?.name || "meg-acizer"}
            onNavigateToMail={() => setActiveModule("mail")}
            onNavigateToCalendar={() => setActiveModule("calendar")}
            onOpenComposer={(to, sub) => handleOpenComposer(to, sub)}
          />
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

          {/* Column B: Email Reading & Context Pane */}
          <section className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto">
            {selectedEmail ? (
              <div className="p-6 max-w-3xl space-y-4">
                {/* Security Verification Banner */}
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="font-medium">{t.common.verified}</span>
                    <span className="text-muted-foreground">
                      (DMARC pass, spf=pass ip=209.85.220.41)
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Imágenes remotas protegidas</span>
                </div>

                {/* Email Subject & Header */}
                <div className="border-b border-border pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-foreground">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenComposer(selectedEmail.senderEmail, `Re: ${selectedEmail.subject}`)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground cursor-pointer"
                        title="Responder"
                      >
                        <Reply className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-muted text-muted-foreground cursor-pointer">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{selectedEmail.senderName}</span>
                    <span>&lt;{selectedEmail.senderEmail}&gt;</span>
                    <span>•</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                      style={{ backgroundColor: selectedEmail.account.color }}
                    >
                      {selectedEmail.account.name}
                    </span>
                  </div>
                </div>

                {/* Smart AI Summary & Extracted Data Pills */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-xs text-primary">
                      <Sparkles className="h-4 w-4" />
                      <span>{t.ai.summaryTitle}</span>
                    </div>
                    <button
                      onClick={() => handleRunAiTriage(selectedEmail)}
                      disabled={isTriaging}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-primary/25 bg-primary/10 hover:bg-primary/20 text-[11px] font-semibold text-primary transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${isTriaging ? "animate-spin" : ""}`} />
                      <span>{isTriaging ? "Analizando..." : "Re-analizar con IA"}</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedEmail.aiSummary}
                  </p>

                  {/* Extracted Data Badges */}
                  {selectedEmail.extractedData && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
                      {selectedEmail.extractedData.meeting && (
                        <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 px-2.5 py-1 rounded-md text-xs font-medium">
                          <CalendarPlus className="h-3.5 w-3.5" />
                          <span>{selectedEmail.extractedData.meeting}</span>
                        </div>
                      )}
                      {selectedEmail.extractedData.invoice && (
                        <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-500 px-2.5 py-1 rounded-md text-xs font-medium">
                          <FileText className="h-3.5 w-3.5" />
                          <span>{selectedEmail.extractedData.invoice}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Email Body */}
                <div className="py-4 text-xs leading-relaxed space-y-3 text-foreground/90">
                  <p>Estimado equipo,</p>
                  <p>
                    Adjunto los detalles acordados para la etapa de cierre de año. En el archivo se
                    detalla el desglose por rubro y los plazos de entrega estimados para cada
                    entregable.
                  </p>
                  <p>
                    ¿Tendrán disponibilidad el <strong>jueves a las 15:00 hs</strong> para revisar
                    estos puntos en una llamada de 45 minutos?
                  </p>
                  <p className="pt-2">Saludos cordiales,<br />Carlos Mendoza</p>
                </div>

                {/* Quick AI Response Suggestions */}
                <div className="border-t border-border pt-4 space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {t.ai.suggestedReplies}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleQuickAction("Confirmar reunión jueves 15:00")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{t.ai.acceptMeeting}</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction("Solicitar desglose adicional")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium transition-colors"
                    >
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      <span>{t.ai.askDetails}</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction("Proponer viernes 11:00")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium transition-colors"
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
        initialSubject={composerData.subject}
        initialBody={composerData.body}
        onSendSuccess={(msg) => {
          setActionNotice(msg);
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

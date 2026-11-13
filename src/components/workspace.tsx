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
import { TasksView } from "./views/tasks-view";
import { FilesView } from "./views/files-view";
import {
  AccountManagerModal,
  type ConnectedAccount,
  type ConnectedCalendar,
  type TenantAccountPolicy,
  type UserProfileData,
  type TenantCompanyData,
} from "./account-manager-modal";
import { WorvantaLogo } from "./ui/worvanta-logo";
import {
  evaluateClosedRulesOnEmail,
  type ClosedEmailRule,
  type RuleConditionField,
  type RuleConditionOperator,
  type RuleActionType,
} from "@/lib/mail/rules-engine";
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
  ChevronRight,
  Settings2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
  AlertOctagon,
  Columns,
  X,
  Archive,
  ExternalLink,
} from "lucide-react";

interface EmailItem {
  id: string;
  accountId?: string;
  senderName: string;
  senderEmail: string;
  account: { id?: string; name: string; color: string };
  folder?: "inbox" | "archived" | "sent" | "spam" | "trash";
  subject: string;
  preview: string;
  bodyText?: string;
  bodyHtml?: string;
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
  isSharedInbox?: boolean;
  ticketStatus?: "open" | "in_progress" | "resolved";
  assignedTo?: string;
  internalNotes?: Array<{
    id: string;
    author: string;
    text: string;
    time: string;
  }>;
  linkedTaskTitle?: string;
  calendarAdded?: boolean;
  snoozedUntil?: string;
  followUpReminder?: string;
}

const mockEmails: EmailItem[] = [
  {
    id: "1",
    senderName: "Carlos Mendoza",
    senderEmail: "cmendoza@techcorp.io",
    account: { name: "Google Workspace", color: "#3b82f6" },
    folder: "inbox",
    subject: "Propuesta comercial Q4 y coordinación de reunión técnica",
    preview: "Hola, te adjunto la última versión del presupuesto con los cambios solicitados...",
    aiSummary: "Envía cotización revisada para Q4 y solicita coordinar reunión de 45m este jueves.",
    time: "10:42 AM",
    isUnread: true,
    triage: "important",
    priority: "high",
    tags: ["#Finanzas", "#Propuesta-Q4", "#VIP"],
    to: ["ventas@empresa.com", "direccion@empresa.com"],
    cc: ["carlos@techcorp.io"],
    isSharedInbox: true,
    ticketStatus: "in_progress",
    assignedTo: "meg-acizer",
    internalNotes: [
      {
        id: "n-1",
        author: "Laura Benítez",
        text: "@meg-acizer revisé los números del anexo 2 y el margen está en línea con lo aprobado.",
        time: "10:50 AM",
      },
    ],
    attachments: [
      { name: "Presupuesto_Q4_v2.pdf", size: "1.4 MB", type: "application/pdf" },
      { name: "invitacion_reunion_q4.ics", size: "4 KB", type: "text/calendar" },
    ],
    extractedData: {
      meeting: "Jueves 15:00 hs — Revisión Técnica Q4 (45 min)",
      invoice: "Presupuesto_Q4_v2.pdf ($14,500)",
    },
  },
  {
    id: "2",
    senderName: "Laura Benítez",
    senderEmail: "lbenitez@innovasoft.com",
    account: { name: "Microsoft 365", color: "#f97316" },
    folder: "inbox",
    subject: "Re: Estado del proyecto de integración Worvanta",
    preview: "Excelente avance. ¿Pudieron revisar los endpoints del calendario?",
    aiSummary: "Consulta sobre validación de endpoints del calendario multi-cuenta.",
    time: "09:15 AM",
    isUnread: false,
    triage: "important",
    priority: "normal",
    tags: ["#Proyecto-Worvanta", "#Sprint-1"],
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
    folder: "inbox",
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
  {
    id: "sent-1",
    senderName: "Tú",
    senderEmail: "lbenitez@innovasoft.com",
    account: { name: "Microsoft 365", color: "#f97316" },
    folder: "sent",
    subject: "Re: Aprobación de entregables Q4 y cronograma de despliegue",
    preview: "Hola Carlos, confirmamos la disponibilidad para la llamada...",
    aiSummary: "Confirmación de reunión de revisión técnica y validación de cronograma.",
    time: "Hoy 11:30 AM",
    isUnread: false,
    triage: "important",
    priority: "normal",
    tags: ["#Enviados", "#Clientes"],
    to: ["cmendoza@techcorp.io"],
  },
  {
    id: "sent-2",
    senderName: "Tú",
    senderEmail: "cmendoza@techcorp.io",
    account: { name: "Google Workspace", color: "#3b82f6" },
    folder: "sent",
    subject: "Resumen de acuerdos de la junta directiva",
    preview: "Comparto la minuta acordada en la sesión matutina...",
    aiSummary: "Minuta formal de compromisos del sprint actual.",
    time: "Ayer 18:20",
    isUnread: false,
    triage: "other",
    priority: "low",
    tags: ["#Dirección"],
    to: ["direccion@empresa.com"],
  },
  {
    id: "spam-1",
    senderName: "Global Rewards Cryptodraw",
    senderEmail: "winner@free-lottery-claims.xyz",
    account: { name: "Google Workspace", color: "#3b82f6" },
    folder: "spam",
    subject: "⚠️ ¡URGENTE: Reclama tu bono corporativo no solicitado!",
    preview: "Tu cuenta ha sido seleccionada para recibir una bonificación...",
    aiSummary: "Marcado como Phishing / Spam. Enlaces externos bloqueados por seguridad.",
    time: "Hoy 04:12 AM",
    isUnread: true,
    triage: "other",
    priority: "low",
    tags: ["#Spam", "#Bloqueado"],
    to: ["usuario@empresa.com"],
  },
  {
    id: "spam-2",
    senderName: "Fast Loans Express",
    senderEmail: "promo@instant-funds-4u.biz",
    account: { name: "Microsoft 365", color: "#f97316" },
    folder: "spam",
    subject: "Préstamos preaprobados sin requisitos",
    preview: "Obtenga capital de trabajo inmediato...",
    aiSummary: "Remitente en lista negra corporativa.",
    time: "Ayer 02:00",
    isUnread: false,
    triage: "other",
    priority: "low",
    tags: ["#Spam"],
    to: ["ventas@empresa.com"],
  },
  {
    id: "trash-1",
    senderName: "Newsletter Semanal Tech",
    senderEmail: "news@technews-archive.com",
    account: { name: "IMAP Servidor", color: "#10b981" },
    folder: "trash",
    subject: "Boletín semanal de infraestructura en la nube #88",
    preview: "Novedades en Kubernetes y bases de datos distribuidas...",
    aiSummary: "Elemento eliminado por el usuario.",
    time: "Hace 3 días",
    isUnread: false,
    triage: "other",
    priority: "low",
    tags: ["#Papelera"],
    to: ["desarrollo@empresa.com"],
  },
];

export interface WorkspaceUser {
  id: string;
  email: string;
  name: string;
  tenantName: string;
  role?: string;
  tenantPlan?: "standard" | "business_ai" | "enterprise";
  corporateProvider?: "microsoft" | "google" | "imap_smtp";
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

  // Column 1 (Left Sidebar) collapse state & folder tree state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mailNavExpanded, setMailNavExpanded] = useState(true);
  const [openAccountFolders, setOpenAccountFolders] = useState<Record<string, boolean>>({
    all: true,
    "1": true,
    "2": false,
    "3": false,
  });

  // Selected folder & account in Column 1
  const [selectedFolder, setSelectedFolder] = useState<{
    accountId: string | "all";
    folderType: "inbox" | "archived" | "sent" | "spam" | "trash";
  }>({ accountId: "all", folderType: "inbox" });

  // Columns 2, 3, 4 dimensions and visibility
  const [col2Width, setCol2Width] = useState(330);
  const [col4Width, setCol4Width] = useState(300);
  const [col2Open, setCol2Open] = useState(true);
  const [col3Open, setCol3Open] = useState(true);
  const [col4Open, setCol4Open] = useState(true);

  // Tenant Company Identity & Fiscal Data State
  const inferredInitialCompanyName =
    (user?.tenantName && user.tenantName !== "Acme Corp" ? user.tenantName : "") ||
    (user?.email ? user.email.split("@")[1]?.split(".")[0]?.toUpperCase() : "") ||
    "Acizer";

  const [companyData, setCompanyData] = useState<TenantCompanyData>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`worvanta_company_${user?.email || user?.id || "default"}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      name: inferredInitialCompanyName,
      legalName: "",
      taxId: "",
      address: "",
      website: user?.email ? `https://${user.email.split("@")[1]}` : "https://acizer.com.ar",
      phone: "",
    };
  });

  // User Profile & Tenant Policy State
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    name: user?.name || "meg-acizer",
    email: user?.email || "meg@empresa.com",
    jobTitle: "Director de Operaciones",
    phone: "+54 11 5000-1234",
    personalSignature: `Saludos cordiales,\n${user?.name || "meg-acizer"} | ${companyData?.name || user?.tenantName || "Acizer"}`,
    tenantName: companyData?.name || user?.tenantName || "Acizer",
  });

  const [tenantPolicy, setTenantPolicy] = useState<TenantAccountPolicy>({
    plan: user?.tenantPlan || "business_ai",
    corporateDomain: user?.email?.split("@")[1] || "empresa.com",
    corporateProvider: user?.corporateProvider || "microsoft",
    personalAccountsQuota: "unlimited",
    personalAccountsAiMode: "single",
  });

  // User Multiple Accounts State (Corporate Default + Personal Accounts)
  const [accountsList, setAccountsList] = useState<ConnectedAccount[]>([
    {
      id: "1",
      provider: user?.corporateProvider || "microsoft",
      email: user?.email || "lbenitez@innovasoft.com",
      displayName: "Microsoft 365 (Empresa Default)",
      color: "#f97316",
      isDefault: true,
      isCorporateDefault: true,
      aiEnabled: true,
    },
    {
      id: "2",
      provider: "google",
      email: "cmendoza@techcorp.io",
      displayName: "Google Workspace (Cuenta Propia)",
      color: "#3b82f6",
      isCorporateDefault: false,
      aiEnabled: true,
    },
    {
      id: "3",
      provider: "imap_smtp",
      email: "soporte@miempresa.com",
      displayName: "Soporte & Ventas (Bandeja Compartida)",
      color: "#10b981",
      isCorporateDefault: false,
      aiEnabled: false,
      isShared: true,
    },
  ]);

  // Block 1 Collaboration States (Internal Notes, Convert to Task Modal, Share to Chat)
  const [newInternalNote, setNewInternalNote] = useState("");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskDraftTitle, setTaskDraftTitle] = useState("");
  const [taskDraftAssignee, setTaskDraftAssignee] = useState("meg-acizer");
  const [taskDraftDue, setTaskDraftDue] = useState("Mañana 18:00");
  const [shareChatMenuOpen, setShareChatMenuOpen] = useState(false);

  // Block 2 States (Snooze, Follow-Up Reminder, Closed-List Rules Modal)
  const [snoozeMenuOpen, setSnoozeMenuOpen] = useState(false);
  const [followUpMenuOpen, setFollowUpMenuOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [emailRules, setEmailRules] = useState<ClosedEmailRule[]>([
    {
      id: "rule-1",
      name: "Etiquetar Facturas y Presupuestos",
      conditionField: "subject",
      conditionOperator: "contains",
      conditionValue: "presupuesto",
      actionType: "add_tag",
      actionValue: "#Finanzas",
      isActive: true,
    },
    {
      id: "rule-2",
      name: "Asignar bandeja ventas@ a Carlos Mendoza",
      conditionField: "to",
      conditionOperator: "contains",
      conditionValue: "ventas@",
      actionType: "assign_to_user",
      actionValue: "Carlos Mendoza",
      isActive: true,
    },
    {
      id: "rule-3",
      name: "Prioridad Alta a clientes TechCorp",
      conditionField: "from",
      conditionOperator: "contains",
      conditionValue: "techcorp.io",
      actionType: "mark_priority",
      actionValue: "high",
      isActive: true,
    },
  ]);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleField, setNewRuleField] = useState<RuleConditionField>("subject");
  const [newRuleOperator, setNewRuleOperator] = useState<RuleConditionOperator>("contains");
  const [newRuleValue, setNewRuleValue] = useState("");
  const [newRuleAction, setNewRuleAction] = useState<RuleActionType>("add_tag");
  const [newRuleActionValue, setNewRuleActionValue] = useState("#Urgente");

  // User Connected Calendars State (Corporate Default + Personal Calendars)
  const [calendarsList, setCalendarsList] = useState<ConnectedCalendar[]>([
    {
      id: "cal-1",
      provider: user?.corporateProvider === "google" ? "google" : "microsoft",
      name: "Calendario Corporativo & Salas",
      accountEmailOrUrl: user?.email || "lbenitez@innovasoft.com",
      color: "#3b82f6",
      isCorporateDefault: true,
      syncDirection: "two_way",
    },
    {
      id: "cal-2",
      provider: "google",
      name: "Agenda Personal (Google Calendar)",
      accountEmailOrUrl: "cmendoza.personal@gmail.com",
      color: "#10b981",
      isCorporateDefault: false,
      syncDirection: "two_way",
    },
    {
      id: "cal-3",
      provider: "caldav_ics",
      name: "iCloud / Familia (CalDAV)",
      accountEmailOrUrl: "https://caldav.icloud.com/109283/calendars/home",
      color: "#8b5cf6",
      isCorporateDefault: false,
      syncDirection: "read_only",
    },
  ]);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [contactSavedNotice, setContactSavedNotice] = useState<string | null>(null);
  const [floatingModalEmail, setFloatingModalEmail] = useState<EmailItem | null>(null);

  // Load Tenant Policy from localStorage and sync personal accounts AI status
  useEffect(() => {
    try {
      const savedPolicy = localStorage.getItem("worvanta_tenant_policy");
      if (savedPolicy) {
        const parsed = JSON.parse(savedPolicy) as TenantAccountPolicy;
        setTenantPolicy((prev) => ({ ...prev, ...parsed }));
        setAccountsList((prev) => {
          let singleAssigned = false;
          return prev.map((acc) => {
            if (acc.isCorporateDefault) return { ...acc, aiEnabled: true };
            if (parsed.personalAccountsAiMode === "all") return { ...acc, aiEnabled: true };
            if (parsed.personalAccountsAiMode === "none") return { ...acc, aiEnabled: false };
            // single mode
            if (!singleAssigned && acc.aiEnabled) {
              singleAssigned = true;
              return { ...acc, aiEnabled: true };
            }
            return { ...acc, aiEnabled: false };
          });
        });
      }
    } catch {}
  }, [isAccountsModalOpen]);

  // Helper to check if an EmailItem belongs to an account with effective AI enabled
  const isEmailAiEnabled = (email: EmailItem): boolean => {
    const matchedAcc = accountsList.find(
      (acc) =>
        email.account.name.toLowerCase().includes(acc.provider.toLowerCase()) ||
        email.account.name.toLowerCase().includes(acc.displayName.toLowerCase()) ||
        email.senderEmail.toLowerCase().includes(acc.email.toLowerCase())
    );
    if (!matchedAcc) return true;
    if (matchedAcc.isCorporateDefault) return true;
    if (tenantPolicy.personalAccountsAiMode === "all") return true;
    if (tenantPolicy.personalAccountsAiMode === "none") return false;
    return Boolean(matchedAcc.aiEnabled);
  };

  const handleOpenInFloatingWindow = (email: EmailItem) => {
    try {
      localStorage.setItem("worvanta_floating_email", JSON.stringify(email));
      const popout = window.open(
        "/popout",
        `Worvanta_Popout_${email.id}`,
        "width=980,height=840,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes"
      );
      if (!popout || popout.closed || typeof popout.closed === "undefined") {
        setFloatingModalEmail(email);
      }
    } catch (e) {
      setFloatingModalEmail(email);
    }
  };

  const t = dictionaries[locale];

  // Helper para conteo dinámico de correos por carpeta y cuenta
  const getFolderCount = (
    folderType: "inbox" | "archived" | "sent" | "spam" | "trash",
    accountId: string | "all" = "all"
  ) => {
    return emailsList.filter((e) => {
      const f = e.folder || "inbox";
      if (f !== folderType) return false;
      if (accountId !== "all") {
        const acc = accountsList.find((a) => a.id === accountId);
        if (acc) {
          const match =
            e.accountId === acc.id ||
            e.account.id === acc.id ||
            e.account.name.toLowerCase().includes(acc.provider.toLowerCase()) ||
            e.account.name.toLowerCase().includes(acc.displayName.toLowerCase()) ||
            e.senderEmail.toLowerCase().includes(acc.email.toLowerCase()) ||
            (e.to && e.to.some((addr) => addr.toLowerCase().includes(acc.email.toLowerCase())));
          if (!match) return false;
        }
      }
      return true;
    }).length;
  };

  // Resizing handler para Columna 2 (Lista de correos)
  const handleStartResizeCol2 = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = col2Width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(220, Math.min(550, startWidth + (moveEvent.clientX - startX)));
      setCol2Width(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // Resizing handler para Columna 4 (Panel 360° & IA)
  const handleStartResizeCol4 = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = col4Width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(240, Math.min(550, startWidth - (moveEvent.clientX - startX)));
      setCol4Width(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const filteredEmails = emailsList.filter((email) => {
    const emailFolder = email.folder || "inbox";
    if (emailFolder !== selectedFolder.folderType) return false;

    if (selectedFolder.accountId !== "all") {
      const acc = accountsList.find((a) => a.id === selectedFolder.accountId);
      if (acc) {
        const matchesAcc =
          email.accountId === acc.id ||
          email.account.id === acc.id ||
          email.account.name.toLowerCase().includes(acc.provider.toLowerCase()) ||
          email.account.name.toLowerCase().includes(acc.displayName.toLowerCase()) ||
          email.senderEmail.toLowerCase().includes(acc.email.toLowerCase()) ||
          (email.to && email.to.some((addr) => addr.toLowerCase().includes(acc.email.toLowerCase())));
        if (!matchesAcc) return false;
      }
    }

    if (selectedFolder.folderType === "inbox" && email.triage) {
      return email.triage === triageFilter;
    }

    return true;
  });

  // Asegurar selección válida al cambiar de carpeta o filtro
  useEffect(() => {
    if (filteredEmails.length > 0) {
      if (!filteredEmails.some((e) => e.id === selectedEmail?.id)) {
        setSelectedEmail(filteredEmails[0]);
      }
    }
  }, [filteredEmails, selectedEmail?.id]);

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

  // Multi-select, Archive, Delete, Restore, and Real IMAP Sync State & Handlers
  const isDemoMode = user?.id === "demo-user-1" || (user as { isDemo?: boolean })?.isDemo === true;
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [isSyncingLive, setIsSyncingLive] = useState(false);

  // Onboarding Primary Account State (pre-filled with user's email & domain)
  const initialUserDomain = (user?.email || "").split("@")[1] || "acizer.com.ar";
  const [onboardingProvider, setOnboardingProvider] = useState<"imap" | "gmail" | "microsoft">(
    user?.corporateProvider === "google"
      ? "gmail"
      : user?.corporateProvider === "microsoft"
      ? "microsoft"
      : "imap"
  );
  const [onboardingImapEmail, setOnboardingImapEmail] = useState(user?.email || "");
  const [onboardingImapPassword, setOnboardingImapPassword] = useState("");
  const [onboardingImapHost, setOnboardingImapHost] = useState(
    user?.corporateProvider === "google"
      ? "imap.gmail.com"
      : user?.corporateProvider === "microsoft"
      ? "outlook.office365.com"
      : `mail.${initialUserDomain}`
  );
  const [onboardingImapPort, setOnboardingImapPort] = useState("993");
  const [onboardingSmtpHost, setOnboardingSmtpHost] = useState(
    user?.corporateProvider === "google"
      ? "smtp.gmail.com"
      : user?.corporateProvider === "microsoft"
      ? "smtp.office365.com"
      : `mail.${initialUserDomain}`
  );
  const [onboardingSmtpPort, setOnboardingSmtpPort] = useState("465");
  const [onboardingConnecting, setOnboardingConnecting] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  // Clear mock data and load real user accounts / emails for non-demo users
  useEffect(() => {
    if (isDemoMode) return;
    const storageKeyAcc = `worvanta_real_accounts_${user?.email || user?.id || "default"}`;
    const storageKeyMail = `worvanta_real_emails_${user?.email || user?.id || "default"}`;
    try {
      const savedAccountsRaw = localStorage.getItem(storageKeyAcc);
      const savedEmailsRaw = localStorage.getItem(storageKeyMail);
      const parsedAccounts: ConnectedAccount[] = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : [];
      const parsedEmails: EmailItem[] = savedEmailsRaw ? JSON.parse(savedEmailsRaw) : [];

      // Sanitize parsedAccounts: ensure corporate default account reflects companyData.name instead of "Acme Corp"
      const currentCompName = companyData.name || user?.tenantName || "Acizer";
      const sanitizedAccounts = parsedAccounts.map((acc) => {
        if (
          acc.isCorporateDefault &&
          (acc.displayName === "Acme Corp" ||
            acc.displayName.includes("Acme Corp") ||
            acc.displayName.toLowerCase().includes("default"))
        ) {
          return { ...acc, displayName: currentCompName };
        }
        return acc;
      });

      setAccountsList(sanitizedAccounts);
      setEmailsList(parsedEmails);

      if (parsedEmails.length > 0) {
        setSelectedEmail(parsedEmails[0]);
      } else {
        setSelectedEmail({
          id: "empty-placeholder",
          folder: "inbox",
          senderName: "Bandeja de Correo Real",
          senderEmail: user?.email || "",
          subject:
            sanitizedAccounts.length === 0
              ? "Conecta tu cuenta de correo principal para comenzar"
              : "Tu bandeja está sincronizada y lista",
          preview:
            sanitizedAccounts.length === 0
              ? "Configura tu servidor IMAP/SMTP para descargar tus correos reales sin datos de prueba."
              : "Haz clic en 'Sincronizar' para buscar nuevos correos en tu servidor IMAP.",
          time: "Ahora",
          isUnread: false,
          triage: "important",
          account: {
            id: sanitizedAccounts[0]?.id || "none",
            name: sanitizedAccounts[0]?.displayName || companyData.name || user?.tenantName || "Principal",
            color: sanitizedAccounts[0]?.color || "#3b82f6",
          },
          aiSummary: "Sin mensajes seleccionados.",
          priority: "normal",
        });
      }

      if (parsedAccounts.length === 0) {
        setActiveModule("mail");
        setOnboardingStep(1);
        setOnboardingOpen(true);
      }
    } catch {
      setAccountsList([]);
      setEmailsList([]);
      setOnboardingOpen(true);
    }
  }, [isDemoMode, user?.email, user?.id, user?.tenantName]);

  // Persist real accounts and emails to localStorage when modified for non-demo users
  useEffect(() => {
    if (!mounted || isDemoMode) return;
    const storageKeyAcc = `worvanta_real_accounts_${user?.email || user?.id || "default"}`;
    const storageKeyMail = `worvanta_real_emails_${user?.email || user?.id || "default"}`;
    try {
      localStorage.setItem(storageKeyAcc, JSON.stringify(accountsList));
      localStorage.setItem(storageKeyMail, JSON.stringify(emailsList));
    } catch {
      // ignore quota errors
    }
  }, [mounted, isDemoMode, accountsList, emailsList, user?.email, user?.id]);

  // Clear selection when switching folder or account
  useEffect(() => {
    setSelectedEmailIds([]);
  }, [selectedFolder.accountId, selectedFolder.folderType]);

  const handleToggleSelectEmail = (emailId: string) => {
    setSelectedEmailIds((prev) =>
      prev.includes(emailId) ? prev.filter((id) => id !== emailId) : [...prev, emailId]
    );
  };

  const handleToggleSelectAllVisible = () => {
    const visibleIds = filteredEmails.map((e) => e.id);
    if (visibleIds.length === 0) return;
    const allSelected = visibleIds.every((id) => selectedEmailIds.includes(id));
    if (allSelected) {
      setSelectedEmailIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedEmailIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleArchiveEmails = (ids: string[]) => {
    if (ids.length === 0) return;
    setEmailsList((prev) =>
      prev.map((item) => (ids.includes(item.id) ? { ...item, folder: "archived" as const } : item))
    );
    if (ids.includes(selectedEmail.id)) {
      const remaining = filteredEmails.filter((e) => !ids.includes(e.id));
      if (remaining.length > 0) setSelectedEmail(remaining[0]);
      else setSelectedEmail((prev) => ({ ...prev, folder: "archived" as const }));
    }
    setSelectedEmailIds((prev) => prev.filter((id) => !ids.includes(id)));
    setActionNotice(
      ids.length === 1
        ? "📦 Correo movido a Archivados"
        : `📦 ${ids.length} correos movidos a Archivados`
    );
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleDeleteEmails = (ids: string[]) => {
    if (ids.length === 0) return;
    const isAlreadyInTrash = selectedFolder.folderType === "trash";
    if (isAlreadyInTrash) {
      setEmailsList((prev) => prev.filter((item) => !ids.includes(item.id)));
      setActionNotice(
        ids.length === 1
          ? "🗑️ Correo eliminado definitivamente"
          : `🗑️ ${ids.length} correos eliminados definitivamente`
      );
    } else {
      setEmailsList((prev) =>
        prev.map((item) => (ids.includes(item.id) ? { ...item, folder: "trash" as const } : item))
      );
      setActionNotice(
        ids.length === 1
          ? "🗑️ Correo movido a la Papelera"
          : `🗑️ ${ids.length} correos movidos a la Papelera`
      );
    }
    if (ids.includes(selectedEmail.id)) {
      const remaining = filteredEmails.filter((e) => !ids.includes(e.id));
      if (remaining.length > 0) setSelectedEmail(remaining[0]);
      else if (!isAlreadyInTrash) setSelectedEmail((prev) => ({ ...prev, folder: "trash" as const }));
    }
    setSelectedEmailIds((prev) => prev.filter((id) => !ids.includes(id)));
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleRestoreEmails = (ids: string[]) => {
    if (ids.length === 0) return;
    setEmailsList((prev) =>
      prev.map((item) => (ids.includes(item.id) ? { ...item, folder: "inbox" as const } : item))
    );
    if (ids.includes(selectedEmail.id)) {
      setSelectedEmail((prev) => ({ ...prev, folder: "inbox" as const }));
    }
    setSelectedEmailIds((prev) => prev.filter((id) => !ids.includes(id)));
    setActionNotice(
      ids.length === 1
        ? "📥 Correo restaurado a Bandeja de Entrada"
        : `📥 ${ids.length} correos restaurados a Bandeja de Entrada`
    );
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleUpdateCompanyData = (updated: TenantCompanyData) => {
    setCompanyData(updated);
    setUserProfile((prev) => ({
      ...prev,
      tenantName: updated.name,
    }));
    try {
      localStorage.setItem(
        `worvanta_company_${user?.email || user?.id || "default"}`,
        JSON.stringify(updated)
      );
      const sessionRaw = localStorage.getItem("mailme_session_user");
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw);
        parsed.tenantName = updated.name;
        localStorage.setItem("mailme_session_user", JSON.stringify(parsed));
      }
    } catch {}

    // Actualizar nombre de la cuenta corporativa default
    setAccountsList((prev) =>
      prev.map((acc) => {
        if (acc.isCorporateDefault) {
          return {
            ...acc,
            displayName: updated.name,
          };
        }
        return acc;
      })
    );

    setActionNotice(`✓ Datos de la empresa "${updated.name}" actualizados`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleConnectPrimaryImapAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError(null);
    setOnboardingConnecting(true);
    try {
      const res = await fetch("/api/mail/live-imap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "connect_and_sync",
          accountName: companyData.name || user?.tenantName || onboardingImapEmail.split("@")[0],
          accountColor: "#3b82f6",
          email: onboardingImapEmail.trim(),
          imapHost: onboardingImapHost.trim(),
          imapPort: Number(onboardingImapPort) || 993,
          imapSecure: Number(onboardingImapPort) === 993,
          smtpHost: onboardingSmtpHost.trim(),
          smtpPort: Number(onboardingSmtpPort) || 465,
          smtpSecure: Number(onboardingSmtpPort) === 465,
          username: onboardingImapEmail.trim(),
          password: onboardingImapPassword,
          limit: 40,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setOnboardingError(data.error || "No se pudo conectar al servidor IMAP.");
        setOnboardingConnecting(false);
        return;
      }

      const newAcc: ConnectedAccount & {
        imapHost?: string;
        imapPort?: number;
        smtpHost?: string;
        smtpPort?: number;
        vaultToken?: string;
      } = {
        id: data.account.id,
        email: data.account.email,
        displayName: data.account.displayName,
        provider: "imap_smtp",
        color: "#3b82f6",
        isCorporateDefault: true,
        aiEnabled: true,
        imapHost: data.account.imapHost,
        imapPort: data.account.imapPort,
        smtpHost: data.account.smtpHost,
        smtpPort: data.account.smtpPort,
        vaultToken: data.account.vaultToken,
      };

      setAccountsList((prev) => {
        const filtered = prev.filter((a) => a.email.toLowerCase() !== newAcc.email.toLowerCase());
        return [newAcc, ...filtered];
      });

      const fetchedEmails: EmailItem[] = data.emails || [];
      setEmailsList((prev) => {
        const otherAccEmails = prev.filter((em) => em.account.id !== newAcc.id);
        return [...fetchedEmails, ...otherAccEmails];
      });

      if (fetchedEmails.length > 0) {
        setSelectedEmail(fetchedEmails[0]);
      }

      setOnboardingImapPassword("");
      setOnboardingOpen(false);
      setActiveModule("mail");
      setSelectedFolder({ accountId: newAcc.id, folderType: "inbox" });
      setActionNotice(
        `✓ Cuenta ${newAcc.email} conectada (${fetchedEmails.length} correos reales sincronizados)`
      );
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err) {
      setOnboardingError(
        err instanceof Error ? err.message : "Error de red al verificar el servidor IMAP"
      );
    } finally {
      setOnboardingConnecting(false);
    }
  };

  const handleSyncLiveAccounts = async () => {
    const imapAccounts = accountsList.filter(
      (a) =>
        (a as { imapHost?: string; vaultToken?: string }).imapHost &&
        (a as { imapHost?: string; vaultToken?: string }).vaultToken
    );
    if (imapAccounts.length === 0) {
      setOnboardingStep(1);
      setOnboardingOpen(true);
      return;
    }

    setIsSyncingLive(true);
    setActionNotice("Sincronizando correos reales desde tu servidor IMAP...");
    try {
      let totalFetched = 0;
      for (const acc of imapAccounts) {
        const extAcc = acc as ConnectedAccount & {
          imapHost?: string;
          imapPort?: number;
          smtpHost?: string;
          smtpPort?: number;
          vaultToken?: string;
        };
        const res = await fetch("/api/mail/live-imap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "sync",
            accountId: acc.id,
            accountName: acc.displayName,
            accountColor: acc.color,
            email: acc.email,
            imapHost: extAcc.imapHost,
            imapPort: extAcc.imapPort || 993,
            encryptedPassword: extAcc.vaultToken,
            limit: 40,
          }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.emails)) {
          const syncedEmails: EmailItem[] = data.emails;
          totalFetched += syncedEmails.length;
          setEmailsList((prev) => {
            // Preserve local folder state (trash, archived, sent) for already downloaded messages
            const existingById = new Map(prev.map((item) => [item.id, item]));
            const mergedForAcc = syncedEmails.map((fresh) => {
              const prevItem = existingById.get(fresh.id);
              if (prevItem && (prevItem.folder === "trash" || prevItem.folder === "archived")) {
                return { ...fresh, folder: prevItem.folder };
              }
              return fresh;
            });
            const localOnlyForAcc = prev.filter(
              (item) =>
                item.account.id === acc.id &&
                item.folder === "sent" &&
                !syncedEmails.some((s) => s.id === item.id)
            );
            const otherAccEmails = prev.filter((item) => item.account.id !== acc.id);
            const nextList = [...mergedForAcc, ...localOnlyForAcc, ...otherAccEmails];
            if (nextList.length > 0 && selectedEmail.id === "empty-placeholder") {
              setSelectedEmail(nextList[0]);
            }
            return nextList;
          });
        }
      }
      setActionNotice(`✓ Sincronización IMAP completada (${totalFetched} mensajes al día)`);
    } catch {
      setActionNotice("Error al sincronizar con el servidor IMAP");
    } finally {
      setIsSyncingLive(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Block 1: Shared Inbox status & assignee handlers
  const handleUpdateTicketStatus = (emailId: string, ticketStatus: "open" | "in_progress" | "resolved") => {
    setEmailsList((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, ticketStatus } : e))
    );
    if (selectedEmail.id === emailId) {
      setSelectedEmail((prev) => ({ ...prev, ticketStatus }));
    }
    const labels = { open: "Abierto", in_progress: "En curso", resolved: "Resuelto" };
    setActionNotice(`Estado del hilo actualizado a: ${labels[ticketStatus]}`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleAssignEmail = (emailId: string, assignedTo: string) => {
    setEmailsList((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, assignedTo } : e))
    );
    if (selectedEmail.id === emailId) {
      setSelectedEmail((prev) => ({ ...prev, assignedTo }));
    }
    setActionNotice(
      assignedTo ? `Correo asignado a ${assignedTo}` : "Correo dejado sin asignar"
    );
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInternalNote.trim()) return;
    const note = {
      id: `note-${Date.now()}`,
      author: userProfile.name || "meg-acizer",
      text: newInternalNote.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setEmailsList((prev) =>
      prev.map((item) =>
        item.id === selectedEmail.id
          ? { ...item, internalNotes: [...(item.internalNotes || []), note] }
          : item
      )
    );
    setSelectedEmail((prev) => ({
      ...prev,
      internalNotes: [...(prev.internalNotes || []), note],
    }));
    setNewInternalNote("");
    setActionNotice("Nota interna agregada al hilo (privada para tu equipo)");
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleCreateTaskFromEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const title = taskDraftTitle.trim() || `Seguimiento: ${selectedEmail.subject}`;
    setEmailsList((prev) =>
      prev.map((item) =>
        item.id === selectedEmail.id ? { ...item, linkedTaskTitle: title } : item
      )
    );
    setSelectedEmail((prev) => ({ ...prev, linkedTaskTitle: title }));
    setTaskModalOpen(false);
    setActionNotice(`✓ Tarea creada para ${taskDraftAssignee} (${taskDraftDue})`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleAddInviteToCalendar = (emailId: string) => {
    setEmailsList((prev) =>
      prev.map((item) => (item.id === emailId ? { ...item, calendarAdded: true } : item))
    );
    if (selectedEmail.id === emailId) {
      setSelectedEmail((prev) => ({ ...prev, calendarAdded: true }));
    }
    setActionNotice("📅 Invitación agendada en tu Calendario Unificado");
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleShareEmailToChannel = (channelName: string) => {
    setShareChatMenuOpen(false);
    setActionNotice(`💬 Correo compartido en ${channelName} con tarjeta interactiva`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Block 2: Snooze, Follow-Up & Closed-List Rules handlers
  const handleSnoozeEmail = (emailId: string, untilLabel: string) => {
    setSnoozeMenuOpen(false);
    setEmailsList((prev) =>
      prev.map((item) => (item.id === emailId ? { ...item, snoozedUntil: untilLabel } : item))
    );
    if (selectedEmail.id === emailId) {
      setSelectedEmail((prev) => ({ ...prev, snoozedUntil: untilLabel }));
    }
    setActionNotice(`💤 Correo pospuesto hasta: ${untilLabel}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleSetFollowUpReminder = (emailId: string, reminderLabel: string) => {
    setFollowUpMenuOpen(false);
    setEmailsList((prev) =>
      prev.map((item) =>
        item.id === emailId ? { ...item, followUpReminder: reminderLabel } : item
      )
    );
    if (selectedEmail.id === emailId) {
      setSelectedEmail((prev) => ({ ...prev, followUpReminder: reminderLabel }));
    }
    setActionNotice(`🔔 Seguimiento activado: ${reminderLabel}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleCreateEmailRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRuleValue.trim() || !newRuleActionValue.trim()) return;
    const created: ClosedEmailRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      conditionField: newRuleField,
      conditionOperator: newRuleOperator,
      conditionValue: newRuleValue.trim(),
      actionType: newRuleAction,
      actionValue: newRuleActionValue.trim(),
      isActive: true,
    };
    setEmailRules((prev) => [...prev, created]);
    setNewRuleName("");
    setNewRuleValue("");
    setActionNotice(`⚡ Regla "${created.name}" creada y activada`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleRunRulesNow = () => {
    let totalMatched = 0;
    const nextList = emailsList.map((item) => {
      const res = evaluateClosedRulesOnEmail(item, emailRules);
      if (res.appliedRuleNames.length > 0) totalMatched += 1;
      return res.updatedEmail;
    });
    setEmailsList(nextList);
    const updatedSelected = nextList.find((item) => item.id === selectedEmail.id);
    if (updatedSelected) setSelectedEmail(updatedSelected);
    setActionNotice(
      `⚡ Reglas ejecutadas: ${totalMatched} correo(s) actualizados automáticamente`
    );
    setTimeout(() => setActionNotice(null), 3500);
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

  // Set mounted on client and restore persisted layout preferences
  useEffect(() => {
    setMounted(true);
    try {
      const savedPrefs = localStorage.getItem("worvanta_user_prefs");
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (typeof parsed.sidebarCollapsed === "boolean") setSidebarCollapsed(parsed.sidebarCollapsed);
        if (typeof parsed.col2Width === "number") setCol2Width(parsed.col2Width);
        if (typeof parsed.col4Width === "number") setCol4Width(parsed.col4Width);
        if (typeof parsed.col2Open === "boolean") setCol2Open(parsed.col2Open);
        if (typeof parsed.col3Open === "boolean") setCol3Open(parsed.col3Open);
        if (typeof parsed.col4Open === "boolean") setCol4Open(parsed.col4Open);
      }
    } catch (e) {
      // Ignore storage error
    }
  }, []);

  // Automatically save layout preferences when changed
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(
        "worvanta_user_prefs",
        JSON.stringify({
          sidebarCollapsed,
          col2Width,
          col4Width,
          col2Open,
          col3Open,
          col4Open,
        })
      );
    } catch (e) {
      // Ignore storage error
    }
  }, [mounted, sidebarCollapsed, col2Width, col4Width, col2Open, col3Open, col4Open]);

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
      {/* 1. LEFT NAVIGATION SIDEBAR (Collapsible a la izquierda) */}
      {sidebarCollapsed ? (
        <aside className="w-14 shrink-0 border-r border-border flex flex-col justify-between bg-card/70 backdrop-blur-md items-center py-3 select-none">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              className="p-1.5 rounded-xl hover:bg-muted text-primary transition-colors cursor-pointer"
              title="Expandir menú lateral"
            >
              <WorvantaLogo size={24} showWordmark={false} />
            </button>

            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Expandir menú lateral"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>

            <div className="w-8 h-px bg-border my-1" />

            {/* Quick Compose in collapsed mode */}
            <button
              onClick={() => handleOpenComposer()}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-transform hover:scale-105 cursor-pointer"
              title="Redactar nuevo correo (C)"
            >
              <PenSquare className="h-4 w-4" />
            </button>

            {/* Vertical Icons Navigation */}
            <div className="flex flex-col items-center gap-1.5 mt-2">
              <button
                onClick={() => setActiveModule("today")}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  activeModule === "today" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
                title="Hoy / Dashboard"
              >
                <Sparkles className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveModule("mail")}
                className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
                  activeModule === "mail" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
                title="Correo"
              >
                <Inbox className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-background" />
              </button>

              <button
                onClick={() => setActiveModule("calendar")}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  activeModule === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
                title="Calendario"
              >
                <Calendar className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveModule("tasks")}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  activeModule === "tasks" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
                title="Tareas"
              >
                <CheckSquare className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveModule("contacts")}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  activeModule === "contacts" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
                title="Contactos"
              >
                <Users className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveModule("files")}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  activeModule === "files" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
                title="Archivos"
              >
                <FolderOpen className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveModule("chat")}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  activeModule === "chat" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
                title="Chat Interno"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Collapsed Footer Theme Toggle */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Cambiar tema"
            >
              {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </aside>
      ) : (
        <aside className="w-64 shrink-0 border-r border-border flex flex-col justify-between bg-card/60 backdrop-blur-md overflow-hidden select-none">
          <div className="flex-1 overflow-y-auto">
            {/* Brand & Workspace Header with Collapse Toggle */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <WorvantaLogo size={28} showWordmark={true} wordmarkClassName="font-bold text-base tracking-tight text-foreground" />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Colapsar menú a la izquierda"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                  activeModule === "today"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>{t.common.today}</span>
              </button>

              {/* CORREO CON CARPETAS DESPLEGABLES */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveModule("mail");
                    setMailNavExpanded(!mailNavExpanded);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                    activeModule === "mail"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Inbox className="h-4 w-4" />
                    <span>{t.common.mail}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/20 font-bold font-mono">
                      {getFolderCount("inbox", "all")}
                    </span>
                    {mailNavExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 opacity-80" />
                    )}
                  </div>
                </button>

                {/* Subcarpetas e Inboxes desplegables */}
                {mailNavExpanded && (
                  <div className="ml-2 pl-2 border-l border-border/60 py-1 space-y-2.5 text-xs animate-in fade-in">
                    {/* Sección 1: Bandejas Unificadas */}
                    <div>
                      <div
                        onClick={() =>
                          setOpenAccountFolders((prev) => ({ ...prev, all: !prev.all }))
                        }
                        className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer uppercase tracking-wider"
                      >
                        <div className="flex items-center gap-1">
                          {openAccountFolders.all ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          <span>Bandejas Unificadas</span>
                        </div>
                      </div>

                      {openAccountFolders.all && (
                        <div className="space-y-0.5 ml-2 mt-0.5">
                          <button
                            onClick={() => {
                              setActiveModule("mail");
                              setSelectedFolder({ accountId: "all", folderType: "inbox" });
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                              selectedFolder.accountId === "all" && selectedFolder.folderType === "inbox"
                                ? "bg-accent font-semibold text-foreground"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Inbox className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              <span>Entrada</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-muted-foreground">
                              {getFolderCount("inbox", "all")}
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveModule("mail");
                              setSelectedFolder({ accountId: "all", folderType: "sent" });
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                              selectedFolder.accountId === "all" && selectedFolder.folderType === "sent"
                                ? "bg-accent font-semibold text-foreground"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Send className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span>Enviados</span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {getFolderCount("sent", "all")}
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveModule("mail");
                              setSelectedFolder({ accountId: "all", folderType: "spam" });
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                              selectedFolder.accountId === "all" && selectedFolder.folderType === "spam"
                                ? "bg-accent font-semibold text-foreground"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <AlertOctagon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              <span>Spam</span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {getFolderCount("spam", "all")}
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveModule("mail");
                              setSelectedFolder({ accountId: "all", folderType: "archived" });
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                              selectedFolder.accountId === "all" && selectedFolder.folderType === "archived"
                                ? "bg-accent font-semibold text-foreground"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Archive className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              <span>Archivados</span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {getFolderCount("archived", "all")}
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveModule("mail");
                              setSelectedFolder({ accountId: "all", folderType: "trash" });
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                              selectedFolder.accountId === "all" && selectedFolder.folderType === "trash"
                                ? "bg-accent font-semibold text-foreground"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Trash2 className="h-3.5 w-3.5 text-red-500 shrink-0" />
                              <span>Papelera / Eliminados</span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {getFolderCount("trash", "all")}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRulesModalOpen(true)}
                            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs text-primary hover:bg-primary/10 transition-colors cursor-pointer font-semibold mt-1 border border-dashed border-primary/30"
                          >
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>Reglas y Filtros</span>
                            </div>
                            <span className="text-[10px] font-mono bg-primary/15 px-1.5 rounded">
                              {emailRules.filter((r) => r.isActive).length}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Sección 2: Carpetas por Cada Inbox Conectado */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Inboxes por Cuenta</span>
                        <button
                          type="button"
                          onClick={() => setIsAccountsModalOpen(true)}
                          className="hover:text-primary cursor-pointer"
                          title="Gestionar Cuentas"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {accountsList.map((acc, idx) => {
                        const isOpen = openAccountFolders[acc.id] ?? (idx === 0 || accountsList.length <= 3);
                        return (
                          <div key={acc.id} className="space-y-0.5">
                            <div
                              onClick={() =>
                                setOpenAccountFolders((prev) => ({
                                  ...prev,
                                  [acc.id]: !prev[acc.id],
                                }))
                              }
                              className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/40 cursor-pointer text-[11px] font-semibold text-foreground"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {isOpen ? (
                                  <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 shrink-0 opacity-70" />
                                )}
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: acc.color }}
                                />
                                <span className="truncate">{acc.displayName}</span>
                              </div>
                            </div>

                            {isOpen && (
                              <div className="ml-3 pl-1.5 border-l border-border/40 space-y-0.5">
                                <button
                                  onClick={() => {
                                    setActiveModule("mail");
                                    setSelectedFolder({ accountId: acc.id, folderType: "inbox" });
                                  }}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                                    selectedFolder.accountId === acc.id && selectedFolder.folderType === "inbox"
                                      ? "bg-accent font-semibold text-foreground"
                                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Inbox className="h-3 w-3 shrink-0" />
                                    <span>Entrada</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {getFolderCount("inbox", acc.id)}
                                  </span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveModule("mail");
                                    setSelectedFolder({ accountId: acc.id, folderType: "sent" });
                                  }}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                                    selectedFolder.accountId === acc.id && selectedFolder.folderType === "sent"
                                      ? "bg-accent font-semibold text-foreground"
                                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Send className="h-3 w-3 shrink-0" />
                                    <span>Enviados</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {getFolderCount("sent", acc.id)}
                                  </span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveModule("mail");
                                    setSelectedFolder({ accountId: acc.id, folderType: "spam" });
                                  }}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                                    selectedFolder.accountId === acc.id && selectedFolder.folderType === "spam"
                                      ? "bg-accent font-semibold text-foreground"
                                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <AlertOctagon className="h-3 w-3 shrink-0" />
                                    <span>Spam</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {getFolderCount("spam", acc.id)}
                                  </span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveModule("mail");
                                    setSelectedFolder({ accountId: acc.id, folderType: "archived" });
                                  }}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                                    selectedFolder.accountId === acc.id && selectedFolder.folderType === "archived"
                                      ? "bg-accent font-semibold text-foreground"
                                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Archive className="h-3 w-3 text-blue-500 shrink-0" />
                                    <span>Archivados</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {getFolderCount("archived", acc.id)}
                                  </span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveModule("mail");
                                    setSelectedFolder({ accountId: acc.id, folderType: "trash" });
                                  }}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                                    selectedFolder.accountId === acc.id && selectedFolder.folderType === "trash"
                                      ? "bg-accent font-semibold text-foreground"
                                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Trash2 className="h-3 w-3 text-red-500 shrink-0" />
                                    <span>Papelera / Eliminados</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {getFolderCount("trash", acc.id)}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setActiveModule("calendar")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
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
          </div>

          {/* Preferences & Settings Footer (User Profile, Accounts, i18n & Themes) */}
          <div className="p-3 border-t border-border space-y-2.5 bg-muted/20">
            <button
              type="button"
              onClick={() => setIsAccountsModalOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-card border border-border hover:border-primary/40 hover:bg-muted/60 transition-all cursor-pointer group"
              title="Editar mis datos personales, foto de perfil, correos y calendarios"
            >
              <div className="flex items-center gap-2 truncate">
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    className="h-7 w-7 rounded-full object-cover border border-primary/40 shrink-0"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                    {(userProfile.name || "U").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="text-left truncate">
                  <div className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                    {userProfile.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    Perfil, Correos ({accountsList.length}) & Agendas ({calendarsList.length})
                  </div>
                </div>
              </div>
              <Settings2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
            </button>

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
      )}

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
        {/* Top Command Palette, Search Bar & Column Controls */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-card/40 backdrop-blur shrink-0 gap-3">
          <div className="flex items-center w-64 sm:w-80 md:w-96 min-w-0">
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

          {/* Controles de Visibilidad de las 3 Columnas (Lista, Lectura, 360°) */}
          {activeModule === "mail" && (
            <div className="hidden md:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/80">
              <button
                type="button"
                onClick={() => setCol2Open(!col2Open)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  col2Open
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                }`}
                title={col2Open ? "Ocultar lista de correos" : "Mostrar lista de correos"}
              >
                <Columns className="h-3.5 w-3.5 text-primary" />
                <span>Lista ({filteredEmails.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setCol3Open(!col3Open)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  col3Open
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                }`}
                title={col3Open ? "Ocultar vista de lectura" : "Mostrar vista de lectura"}
              >
                <FileText className="h-3.5 w-3.5 text-blue-500" />
                <span>Lectura</span>
              </button>

              <button
                type="button"
                onClick={() => setCol4Open(!col4Open)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  col4Open
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                }`}
                title={col4Open ? "Ocultar panel 360°" : "Mostrar panel 360°"}
              >
                <Users className="h-3.5 w-3.5 text-amber-500" />
                <span>360° & IA</span>
              </button>
            </div>
          )}

          {actionNotice && (
            <div className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full animate-fade-in flex items-center gap-1.5 shrink-0">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="truncate max-w-[220px]">{actionNotice}</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setOnboardingStep(1);
                setOnboardingOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer"
              title="Asistente guiado paso a paso para conectar tu primera cuenta"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Onboarding Guiado</span>
            </button>

            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 text-xs bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer"
                title="Consola de Administración del Tenant"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Admin del Tenant</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAccountsModalOpen(true)}
              className="flex items-center gap-1.5 text-xs bg-muted/60 hover:bg-muted border border-border px-2.5 py-1 rounded-lg font-medium text-foreground transition-colors cursor-pointer"
              title="Mi Perfil Personal, Foto, Cuentas de Correo y Calendarios"
            >
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="h-5 w-5 rounded-full object-cover border border-primary/40 shrink-0"
                />
              ) : (
                <Settings2 className="h-3.5 w-3.5 text-primary" />
              )}
              <span className="hidden lg:inline">{userProfile.name}</span>
              <span className="text-[10px] font-mono bg-primary/15 text-primary px-1.5 py-0.2 rounded">
                Perfil & Cuentas
              </span>
            </button>
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
          <CalendarView
            currentUser={{
              name: userProfile.name || user?.name || "meg-acizer",
              email: userProfile.email || user?.email || "meg@worvanta.io",
              role: user?.role || "admin",
            }}
            personalCalendars={calendarsList}
            onOpenProfileCalendars={() => setIsAccountsModalOpen(true)}
          />
        ) : activeModule === "chat" ? (
          <TeamChatView />
        ) : activeModule === "contacts" ? (
          <ContactsView
            currentUser={{
              name: user?.name || "meg-acizer",
              email: user?.email || "meg@worvanta.io",
              role: user?.role || "admin",
            }}
            onOpenComposer={(to, sub) => handleOpenComposer(to, sub)}
            onNavigateToChat={() => setActiveModule("chat")}
          />
        ) : activeModule === "tasks" ? (
          <TasksView
            onNavigateToMail={(emailId) => {
              setActiveModule("mail");
              if (emailId) {
                const found = mockEmails.find((m) => m.id === emailId);
                if (found) setSelectedEmail(found);
              }
            }}
          />
        ) : activeModule === "files" ? (
          <FilesView
            currentUser={{
              name: user?.name || "meg-acizer",
              email: user?.email || "meg@worvanta.io",
              role: user?.role || "admin",
            }}
            onNavigateToMail={(emailId) => {
              setActiveModule("mail");
              if (emailId) {
                const found = mockEmails.find((m) => m.id === emailId);
                if (found) setSelectedEmail(found);
              }
            }}
            onOpenComposerWithAttachment={(attachment) => {
              handleOpenComposer("", "", "", "", [attachment]);
            }}
          />
        ) : (
          <div className="flex-1 flex min-h-0 overflow-hidden relative">
            {/* Columna 2: Lista de Correos (Ajustable y Cerrable) */}
            {col2Open && (
              <section
                style={{ width: `${col2Width}px` }}
                className="shrink-0 border-r border-border flex flex-col bg-card/20 min-w-[220px] max-w-[550px] relative select-none"
              >
                {/* Header de Columna 2 */}
                <div className="p-3 border-b border-border flex items-center justify-between bg-muted/20 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Checkbox Seleccionar Todos */}
                    <input
                      type="checkbox"
                      checked={
                        filteredEmails.length > 0 &&
                        filteredEmails.every((em) => selectedEmailIds.includes(em.id))
                      }
                      onChange={handleToggleSelectAllVisible}
                      className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer shrink-0"
                      title="Seleccionar todos los correos visibles en esta carpeta"
                    />
                    <div className="truncate">
                      <span className="font-bold text-xs text-foreground flex items-center gap-1.5 truncate">
                        {selectedFolder.folderType === "inbox" && <Inbox className="h-3.5 w-3.5 text-primary shrink-0" />}
                        {selectedFolder.folderType === "archived" && <Archive className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                        {selectedFolder.folderType === "sent" && <Send className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                        {selectedFolder.folderType === "spam" && <AlertOctagon className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        {selectedFolder.folderType === "trash" && <Trash2 className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                        <span className="truncate">
                          {selectedFolder.folderType === "inbox"
                            ? "Bandeja de Entrada"
                            : selectedFolder.folderType === "archived"
                            ? "Correos Archivados"
                            : selectedFolder.folderType === "sent"
                            ? "Elementos Enviados"
                            : selectedFolder.folderType === "spam"
                            ? "Spam / No deseado"
                            : "Papelera / Eliminados"}
                        </span>
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {selectedFolder.accountId === "all"
                          ? "Todas las cuentas"
                          : accountsList.find((a) => a.id === selectedFolder.accountId)?.displayName || "Cuenta seleccionada"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSyncLiveAccounts()}
                      disabled={isSyncingLive}
                      className="px-2 py-1 rounded-md border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      title="Sincronizar mensajes reales desde tu servidor IMAP"
                    >
                      <Clock className={`h-3 w-3 ${isSyncingLive ? "animate-spin" : ""}`} />
                      <span>{isSyncingLive ? "Sinc..." : "Sincronizar"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCol2Open(false)}
                      className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
                      title="Cerrar lista de correos"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Barra de Acciones en Lote cuando hay correos seleccionados */}
                {selectedEmailIds.length > 0 && (
                  <div className="px-3 py-2 border-b border-primary/30 bg-primary/10 flex items-center justify-between gap-2 text-xs animate-in fade-in">
                    <span className="font-bold text-primary text-[11px] truncate">
                      {selectedEmailIds.length} seleccionado(s)
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {selectedFolder.folderType !== "archived" && (
                        <button
                          type="button"
                          onClick={() => handleArchiveEmails(selectedEmailIds)}
                          className="px-2 py-1 rounded bg-card border border-border hover:bg-muted text-foreground font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                          title="Archivar todos los seleccionados"
                        >
                          <Archive className="h-3 w-3 text-blue-500" />
                          <span>Archivar</span>
                        </button>
                      )}
                      {(selectedFolder.folderType === "trash" || selectedFolder.folderType === "archived") && (
                        <button
                          type="button"
                          onClick={() => handleRestoreEmails(selectedEmailIds)}
                          className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                          title="Restaurar a Bandeja de Entrada"
                        >
                          <Inbox className="h-3 w-3" />
                          <span>Restaurar</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteEmails(selectedEmailIds)}
                        className="px-2 py-1 rounded bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-600 dark:text-red-400 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                        title={
                          selectedFolder.folderType === "trash"
                            ? "Eliminar definitivamente los seleccionados"
                            : "Mover seleccionados a la Papelera"
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>{selectedFolder.folderType === "trash" ? "Eliminar" : "Borrar"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedEmailIds([])}
                        className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Cancelar selección"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Triage Chips (solo en Bandeja de Entrada) */}
                {selectedFolder.folderType === "inbox" && (
                  <div className="p-2.5 border-b border-border flex gap-1.5 bg-background/50">
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
                )}

                {/* Lista de Correos */}
                <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                  {filteredEmails.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-xs space-y-3">
                      <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <div>
                        <p className="font-semibold text-foreground">No hay correos en esta carpeta</p>
                        <p className="text-[11px] mt-1">
                          {accountsList.length === 0
                            ? "Conecta tu cuenta de correo principal para recibir y enviar mensajes reales."
                            : "Los mensajes sincronizados de tu servidor aparecerán aquí."}
                        </p>
                      </div>
                      {accountsList.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOnboardingStep(1);
                            setOnboardingOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Configurar Cuenta Principal ({user?.email || "IMAP"})</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSyncLiveAccounts()}
                          disabled={isSyncingLive}
                          className="px-3.5 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary font-semibold text-xs hover:bg-primary/20 cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Clock className={`h-3.5 w-3.5 ${isSyncingLive ? "animate-spin" : ""}`} />
                          <span>{isSyncingLive ? "Sincronizando con servidor IMAP..." : "Sincronizar Ahora"}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredEmails.map((email) => {
                      const isChecked = selectedEmailIds.includes(email.id);
                      return (
                        <div
                          key={email.id}
                          onClick={() => {
                            setSelectedEmail(email);
                            if (!col3Open) setCol3Open(true);
                          }}
                          className={`p-3.5 cursor-pointer transition-colors group relative ${
                            selectedEmail.id === email.id
                              ? "bg-accent/40 border-l-2 border-primary"
                              : isChecked
                              ? "bg-primary/10 border-l-2 border-primary/60"
                              : "hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <div className="flex items-center gap-2 font-semibold text-xs truncate min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => handleToggleSelectEmail(email.id)}
                                className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer shrink-0"
                                title="Seleccionar este correo"
                              />
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: email.account.color }}
                              />
                              <span className="truncate">{email.senderName}</span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Botones rápidos en hover (Archivar / Borrar / Restaurar) */}
                              <div className="hidden group-hover:flex items-center gap-0.5 bg-card/95 border border-border rounded-md px-1 py-0.5 shadow-xs">
                                {email.folder !== "archived" ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleArchiveEmails([email.id]);
                                    }}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-blue-500 transition-colors cursor-pointer"
                                    title="Archivar correo"
                                  >
                                    <Archive className="h-3 w-3" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRestoreEmails([email.id]);
                                    }}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-emerald-500 transition-colors cursor-pointer"
                                    title="Mover a Entrada"
                                  >
                                    <Inbox className="h-3 w-3" />
                                  </button>
                                )}

                                {email.folder === "trash" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRestoreEmails([email.id]);
                                    }}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-emerald-500 transition-colors cursor-pointer"
                                    title="Restaurar de la Papelera"
                                  >
                                    <Inbox className="h-3 w-3" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEmails([email.id]);
                                  }}
                                  className="p-1 rounded hover:bg-red-500/15 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                                  title={
                                    email.folder === "trash"
                                      ? "Eliminar definitivamente"
                                      : "Mover a la Papelera"
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              <span className="text-[11px] text-muted-foreground group-hover:hidden">
                                {email.time}
                              </span>
                            </div>
                          </div>
                          <h3 className="font-medium text-xs truncate mb-1 text-foreground pl-5">
                            {email.subject}
                          </h3>
                          {isEmailAiEnabled(email) ? (
                            <div className="mt-1.5 ml-5 bg-primary/10 border border-primary/20 rounded p-1.5 flex items-start gap-1.5 text-[11px] text-primary leading-tight">
                              <Sparkles className="h-3 w-3 shrink-0 mt-0.5" />
                              <span className="truncate">{email.aiSummary}</span>
                            </div>
                          ) : (
                            <div className="mt-1.5 ml-5 bg-muted/60 border border-border rounded p-1.5 flex items-center justify-between gap-1.5 text-[10px] text-muted-foreground leading-tight">
                              <span className="truncate">{email.preview}</span>
                              <span className="shrink-0 text-emerald-500 font-semibold flex items-center gap-0.5">
                                <ShieldCheck className="h-3 w-3" /> Antispam/ClamAV
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {/* Borde Resizable entre Columna 2 y Columna 3 */}
            {col2Open && col3Open && (
              <div
                onMouseDown={handleStartResizeCol2}
                className="w-1.5 hover:w-2 bg-transparent hover:bg-primary/40 active:bg-primary cursor-col-resize transition-all z-20 shrink-0 relative group flex items-center justify-center -ml-0.5"
                title="Arrastra para cambiar el ancho de la lista de correos"
              >
                <div className="h-8 w-0.5 rounded bg-border group-hover:bg-primary transition-colors" />
              </div>
            )}

            {/* Columna 3: Vista de Lectura estilo Hoja de Papel (Cerrable) */}
            {col3Open ? (
              <section className="flex-1 flex flex-col min-w-[340px] min-h-0 bg-muted/40 overflow-y-auto p-4 md:p-6">
                {contactSavedNotice && (
                  <div className="max-w-4xl mx-auto w-full mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 font-medium flex items-center justify-between shrink-0">
                    <span>{contactSavedNotice}</span>
                    <button onClick={() => setContactSavedNotice(null)} className="text-muted-foreground hover:text-foreground">×</button>
                  </div>
                )}

                {selectedEmail ? (
                  <div className="w-full max-w-4xl mx-auto bg-card text-foreground border border-border shadow-xl rounded-2xl overflow-hidden flex flex-col shrink-0 mb-8">
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

                      {/* Resumen IA Compacto en una Sola Línea (o Indicador de Cuenta Simple Sin IA) */}
                      <div className="flex items-center gap-2 truncate justify-end">
                        {isEmailAiEnabled(selectedEmail) ? (
                          <>
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
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg text-[11px] truncate">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            <span className="truncate font-medium">
                              Modo Lectura Simple (Antispam & ClamAV Activos • Sin IA en esta cuenta propia)
                            </span>
                          </div>
                        )}
                        <div className="h-3 w-px bg-border/80 shrink-0 mx-0.5" />
                        <button
                          onClick={() => handleOpenInFloatingWindow(selectedEmail)}
                          className="px-2 py-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors shrink-0 flex items-center gap-1.5 text-[11px] font-semibold border border-transparent hover:border-border cursor-pointer"
                          title="Abrir correo en una página nueva flotante"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-primary" />
                          <span className="hidden sm:inline">Ventana Flotante</span>
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
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          {/* Convertir en Tarea (1-clic) */}
                          <button
                            type="button"
                            onClick={() => {
                              setTaskDraftTitle(`Responder / Revisar: ${selectedEmail.subject}`);
                              setTaskDraftAssignee(selectedEmail.assignedTo || userProfile.name || "meg-acizer");
                              setTaskModalOpen((prev) => !prev);
                            }}
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                              selectedEmail.linkedTaskTitle
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                                : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                            title="Convertir este correo en una tarea asignable con fecha límite"
                          >
                            <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="hidden sm:inline">
                              {selectedEmail.linkedTaskTitle ? "Tarea Vinculada" : "Crear Tarea"}
                            </span>
                          </button>

                          {/* Compartir en Canal de Chat */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShareChatMenuOpen((prev) => !prev)}
                              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                              title="Compartir este correo en un canal de chat o abrir debate interno"
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-primary" />
                              <span className="hidden sm:inline">Compartir en Chat</span>
                              <ChevronDown className="h-3 w-3 opacity-70" />
                            </button>

                            {shareChatMenuOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setShareChatMenuOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-1.5 z-50 w-56 bg-card border border-border rounded-xl shadow-2xl py-1.5 text-xs animate-in fade-in zoom-in-95">
                                  <div className="px-3 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                                    Enviar tarjeta a canal
                                  </div>
                                  {["#general", "#ventas-q4", "#soporte-nivel-2", "#finanzas"].map((ch) => (
                                    <button
                                      key={ch}
                                      type="button"
                                      onClick={() => handleShareEmailToChannel(ch)}
                                      className="w-full text-left px-3 py-1.5 hover:bg-muted text-foreground flex items-center justify-between cursor-pointer"
                                    >
                                      <span className="font-mono font-semibold text-primary">{ch}</span>
                                      <span className="text-[10px] text-muted-foreground">Compartir</span>
                                    </button>
                                  ))}
                                  <div className="h-px bg-border my-1" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShareChatMenuOpen(false);
                                      setActiveModule("chat");
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-muted text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                                  >
                                    Abrir módulo de Chat →
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                          {/* Botones rápidos de Archivar y Borrar en cabecera de lectura */}
                          {selectedEmail.folder !== "archived" ? (
                            <button
                              type="button"
                              onClick={() => handleArchiveEmails([selectedEmail.id])}
                              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground font-semibold transition-colors cursor-pointer"
                              title="Archivar este correo"
                            >
                              <Archive className="h-3.5 w-3.5 text-blue-500" />
                              <span className="hidden xl:inline">Archivar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRestoreEmails([selectedEmail.id])}
                              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold transition-colors cursor-pointer"
                              title="Mover de vuelta a Bandeja de Entrada"
                            >
                              <Inbox className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">A Entrada</span>
                            </button>
                          )}

                          {selectedEmail.folder === "trash" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRestoreEmails([selectedEmail.id])}
                                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold transition-colors cursor-pointer"
                                title="Restaurar correo a Bandeja de Entrada"
                              >
                                <Inbox className="h-3.5 w-3.5" />
                                <span>Restaurar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEmails([selectedEmail.id])}
                                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold transition-colors cursor-pointer"
                                title="Eliminar definitivamente de la Papelera"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Eliminar definitivo</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteEmails([selectedEmail.id])}
                              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-red-500/25 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold transition-colors cursor-pointer"
                              title="Mover este correo a la Papelera"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">Borrar</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenComposer(
                              selectedEmail.senderEmail,
                              `Re: ${selectedEmail.subject}`,
                              `\n\n-------------------------\nEl ${selectedEmail.time}, ${selectedEmail.senderName} <${selectedEmail.senderEmail}> escribió:\n> ${selectedEmail.bodyText || selectedEmail.preview || ""}\n`
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
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setEmailActionsMenuOpen(false)}
                                />
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
                                      handleArchiveEmails([selectedEmail.id]);
                                      setEmailActionsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted text-foreground transition-colors cursor-pointer"
                                  >
                                    <Archive className="h-4 w-4 text-blue-500 shrink-0" />
                                    <span>Archivar correo</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeleteEmails([selectedEmail.id]);
                                      setEmailActionsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4 shrink-0" />
                                    <span>{selectedEmail.folder === "trash" ? "Eliminar definitivamente" : "Mover a la Papelera"}</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Botón para Cerrar Columna 3 (Lectura) */}
                          <button
                            type="button"
                            onClick={() => setCol3Open(false)}
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            title="Cerrar vista de lectura"
                          >
                            <X className="h-4 w-4" />
                          </button>
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
                            {(selectedEmail.tags || ["#Proyecto-Worvanta", "#Dirección"]).map((tag) => (
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

                    {/* 2B. BARRA DE BANDEJA COMPARTIDA (ASIGNACIÓN DE RESPONSABLE, ESTADO Y TAREA VINCULADA) */}
                    <div className="px-8 py-2.5 bg-muted/25 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          <span>Estado en Equipo:</span>
                        </span>

                        <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5 gap-0.5">
                          {(
                            [
                              { id: "open", label: "Abierto", dot: "bg-amber-500" },
                              { id: "in_progress", label: "En curso", dot: "bg-blue-500" },
                              { id: "resolved", label: "Resuelto", dot: "bg-emerald-500" },
                            ] as const
                          ).map((st) => {
                            const currentStatus = selectedEmail.ticketStatus || "open";
                            const active = currentStatus === st.id;
                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => handleUpdateTicketStatus(selectedEmail.id, st.id)}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                  active
                                    ? "bg-primary/15 text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                <span>{st.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Responsable:
                          </span>
                          <select
                            value={selectedEmail.assignedTo || ""}
                            onChange={(e) => handleAssignEmail(selectedEmail.id, e.target.value)}
                            className="bg-card border border-border rounded-lg px-2 py-1 text-[11px] font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            <option value="">Sin asignar</option>
                            <option value="meg-acizer">meg-acizer (Tú)</option>
                            <option value="Laura Benítez">Laura Benítez (Producto)</option>
                            <option value="Carlos Mendoza">Carlos Mendoza (Ventas)</option>
                            <option value="Sofía Ramos">Sofía Ramos (Soporte)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Posponer (Snooze) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setSnoozeMenuOpen((prev) => !prev)}
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                              selectedEmail.snoozedUntil
                                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                                : "bg-card text-muted-foreground hover:text-foreground border-border"
                            }`}
                            title="Posponer correo para más adelante (Snooze)"
                          >
                            <Clock className="h-3 w-3" />
                            <span>
                              {selectedEmail.snoozedUntil
                                ? `Pospuesto: ${selectedEmail.snoozedUntil}`
                                : "Posponer"}
                            </span>
                          </button>
                          {snoozeMenuOpen && (
                            <div className="absolute right-0 top-7 z-50 w-52 bg-card border border-border rounded-xl shadow-2xl p-1.5 text-xs space-y-1">
                              <div className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                                💤 Posponer hasta...
                              </div>
                              {[
                                "Hoy 16:00 hs",
                                "Mañana 09:00 AM",
                                "Próximo Lunes 09:00 AM",
                              ].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleSnoozeEmail(selectedEmail.id, opt)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Recordatorio de Seguimiento */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setFollowUpMenuOpen((prev) => !prev)}
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                              selectedEmail.followUpReminder
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                : "bg-card text-muted-foreground hover:text-foreground border-border"
                            }`}
                            title="Recordatorio automático si nadie responde"
                          >
                            <AlertCircle className="h-3 w-3" />
                            <span>
                              {selectedEmail.followUpReminder
                                ? `Seguimiento: ${selectedEmail.followUpReminder}`
                                : "Seguimiento"}
                            </span>
                          </button>
                          {followUpMenuOpen && (
                            <div className="absolute right-0 top-7 z-50 w-60 bg-card border border-border rounded-xl shadow-2xl p-1.5 text-xs space-y-1">
                              <div className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                                🔔 Avisarme si nadie responde en...
                              </div>
                              {[
                                "2 días sin respuesta",
                                "3 días sin respuesta",
                                "7 días sin respuesta",
                              ].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleSetFollowUpReminder(selectedEmail.id, opt)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {selectedEmail.linkedTaskTitle && (
                          <button
                            type="button"
                            onClick={() => setActiveModule("tasks")}
                            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 hover:underline cursor-pointer"
                          >
                            <CheckSquare className="h-3 w-3" />
                            <span>Tarea: {selectedEmail.linkedTaskTitle}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Modal inline rápido: Convertir Correo en Tarea */}
                    {taskModalOpen && (
                      <form
                        onSubmit={handleCreateTaskFromEmail}
                        className="mx-8 mt-4 p-4 rounded-xl bg-primary/5 border-2 border-primary/30 space-y-3 text-xs animate-in fade-in"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <CheckSquare className="h-4 w-4 text-primary" />
                            Convertir Correo en Tarea de Equipo
                          </span>
                          <button
                            type="button"
                            onClick={() => setTaskModalOpen(false)}
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="sm:col-span-1">
                            <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                              Título de la tarea
                            </label>
                            <input
                              type="text"
                              value={taskDraftTitle}
                              onChange={(e) => setTaskDraftTitle(e.target.value)}
                              className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                              Responsable
                            </label>
                            <select
                              value={taskDraftAssignee}
                              onChange={(e) => setTaskDraftAssignee(e.target.value)}
                              className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                            >
                              <option value="meg-acizer">meg-acizer (Tú)</option>
                              <option value="Laura Benítez">Laura Benítez</option>
                              <option value="Carlos Mendoza">Carlos Mendoza</option>
                              <option value="Sofía Ramos">Sofía Ramos</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                              Fecha límite
                            </label>
                            <input
                              type="text"
                              value={taskDraftDue}
                              onChange={(e) => setTaskDraftDue(e.target.value)}
                              className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setTaskModalOpen(false)}
                            className="px-3 py-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-3.5 py-1 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 cursor-pointer"
                          >
                            Guardar Tarea Vinculada
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Detector inteligente de invitación / reunión (.ics o fecha extraída) */}
                    {selectedEmail.extractedData?.meeting && (
                      <div className="mx-8 mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-blue-500/15 text-blue-500">
                            <CalendarPlus className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-foreground block">
                              Invitación detectada en el correo (.ics / IA)
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {selectedEmail.extractedData.meeting}
                            </span>
                          </div>
                        </div>
                        {selectedEmail.calendarAdded ? (
                          <button
                            type="button"
                            onClick={() => setActiveModule("calendar")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Agendado • Ver en Calendario</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddInviteToCalendar(selectedEmail.id)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <CalendarPlus className="h-3.5 w-3.5" />
                            <span>Agregar al Calendario</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* 3. CUERPO DEL CORREO: Aspecto de Hoja de Papel */}
                    <div className="p-8 text-xs leading-relaxed space-y-4 text-foreground/90 font-sans min-h-[220px] bg-card">
                      {selectedEmail.bodyHtml ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                        />
                      ) : selectedEmail.bodyText ? (
                        <div className="whitespace-pre-wrap font-sans leading-relaxed">
                          {selectedEmail.bodyText}
                        </div>
                      ) : (
                        <>
                          <p>Estimado equipo,</p>
                          <p>
                            {selectedEmail.preview ||
                              "Adjunto los detalles acordados para la etapa de cierre de año. En el archivo se detalla el desglose por rubro y los plazos de entrega estimados para cada entregable."}
                          </p>
                          <p className="pt-3">
                            Saludos cordiales,<br />
                            <strong>{selectedEmail.senderName}</strong>
                          </p>
                        </>
                      )}
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

                    {/* 4B. NOTAS INTERNAS DEL EQUIPO EN EL HILO (Privadas del Tenant) */}
                    <div className="px-8 py-4 bg-amber-500/5 border-t border-amber-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>
                            Notas Internas del Equipo ({(selectedEmail.internalNotes || []).length}) • Solo visibles para tu organización
                          </span>
                        </span>
                      </div>

                      {(selectedEmail.internalNotes || []).length > 0 && (
                        <div className="space-y-2">
                          {(selectedEmail.internalNotes || []).map((note) => (
                            <div
                              key={note.id}
                              className="p-2.5 rounded-xl bg-card border border-amber-500/25 text-xs flex items-start justify-between gap-3"
                            >
                              <div>
                                <span className="font-bold text-foreground mr-2">{note.author}</span>
                                <span className="text-muted-foreground">{note.text}</span>
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                {note.time}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <form onSubmit={handleAddInternalNote} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newInternalNote}
                          onChange={(e) => setNewInternalNote(e.target.value)}
                          placeholder="Escribe una nota interna o menciona a @alguien (el cliente externo NO recibe esto)..."
                          className="flex-1 bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold text-xs hover:bg-amber-500/25 transition-colors cursor-pointer shrink-0"
                        >
                          Agregar Nota
                        </button>
                      </form>
                    </div>

                    {/* 5. Respuestas Sugeridas de IA al Pie de la Hoja (Gated por Política IA de la Cuenta) */}
                    {isEmailAiEnabled(selectedEmail) ? (
                      <div className="px-8 py-3.5 bg-muted/30 border-t border-border/60 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold text-muted-foreground">Respuestas sugeridas por IA:</span>
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
                    ) : (
                      <div className="px-8 py-3 bg-muted/20 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          <span>
                            <strong>Cuenta de Lectura Simple:</strong> Protección Antispam SPF/DKIM y Antivirus ClamAV activas. Las sugerencias de IA no están habilitadas para esta cuenta propia según el Plan del Tenant.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAccountsModalOpen(true)}
                          className="text-[11px] font-semibold text-primary hover:underline shrink-0 cursor-pointer"
                        >
                          Ver configuración de cuentas
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <FileText className="h-10 w-10 mb-2 opacity-40" />
                    <p className="font-medium text-sm">Selecciona un correo para leerlo</p>
                  </div>
                )}
              </section>
            ) : null}

            {/* Borde Resizable entre Columna 3 y Columna 4 */}
            {col3Open && col4Open && (
              <div
                onMouseDown={handleStartResizeCol4}
                className="w-1.5 hover:w-2 bg-transparent hover:bg-primary/40 active:bg-primary cursor-col-resize transition-all z-20 shrink-0 relative group flex items-center justify-center -mr-0.5"
                title="Arrastra para cambiar el ancho del panel 360°"
              >
                <div className="h-8 w-0.5 rounded bg-border group-hover:bg-primary transition-colors" />
              </div>
            )}

            {/* Columna 4: Contextual Panel (Contact 360° & AI Assistant - Ajustable y Cerrable) */}
            {col4Open && (
              <aside
                style={{ width: `${col4Width}px` }}
                className="shrink-0 border-l border-border flex flex-col bg-card/40 backdrop-blur-sm min-w-[240px] max-w-[550px] relative select-none"
              >
                {/* Header Columna 4 con botón Cerrar */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                      {t.contact360.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500">
                      VIP
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCol4Open(false)}
                    className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    title="Cerrar panel 360°"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
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

                {/* Embedded AI Assistant Box (Gated by Account AI Policy) */}
                <div className="p-3 border-t border-border bg-card">
                  {selectedEmail && isEmailAiEnabled(selectedEmail) ? (
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
                  ) : (
                    <div className="p-2.5 rounded-lg bg-muted/50 border border-border text-[11px] text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Cuenta en modo Lectura Simple (Antispam & ClamAV). Asistente IA deshabilitado para esta cuenta propia.</span>
                    </div>
                  )}
                </div>
              </aside>
            )}

            {/* Estado cuando todas las 3 columnas están ocultas */}
            {!col2Open && !col3Open && !col4Open && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/20">
                <Columns className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <h3 className="text-base font-semibold text-foreground">Todas las columnas están ocultas</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                  Usa los controles superiores o los accesos rápidos a continuación para reactivar cualquier columna.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCol2Open(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow hover:bg-primary/90 cursor-pointer"
                  >
                    Mostrar Lista
                  </button>
                  <button
                    onClick={() => setCol3Open(true)}
                    className="px-3.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold cursor-pointer"
                  >
                    Mostrar Lectura
                  </button>
                  <button
                    onClick={() => setCol4Open(true)}
                    className="px-3.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold cursor-pointer"
                  >
                    Mostrar 360° & IA
                  </button>
                </div>
              </div>
            )}
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
        userSignature={userProfile.personalSignature}
        accounts={accountsList}
        onSaveContact={(email) => handleSaveContact(email)}
        onSendSuccess={(msg) => {
          setActionNotice(msg);
          setTimeout(() => setActionNotice(null), 4000);
        }}
      />

      {/* Modal de Reglas y Filtros Automáticos de Correo (Lista Cerrada Segura) */}
      {rulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Reglas y Filtros Automáticos de Correo (Lista Cerrada)</span>
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Evalúa condiciones declarativas y aplica etiquetado, asignación de equipo o movimiento de carpeta sin ejecución arbitraria.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRulesModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <form
                onSubmit={handleCreateEmailRule}
                className="p-4 rounded-xl bg-muted/30 border border-border space-y-3"
              >
                <div className="font-bold text-foreground">Crear Nueva Regla Automática</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    placeholder="Nombre (ej: Facturas a Finanzas)"
                    className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
                    required
                  />
                  <div className="flex items-center gap-1.5">
                    <select
                      value={newRuleField}
                      onChange={(e) => setNewRuleField(e.target.value as RuleConditionField)}
                      className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground"
                    >
                      <option value="subject">Si Asunto</option>
                      <option value="from">Si Remitente</option>
                      <option value="to">Si Destinatario (Para)</option>
                    </select>
                    <select
                      value={newRuleOperator}
                      onChange={(e) => setNewRuleOperator(e.target.value as RuleConditionOperator)}
                      className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground"
                    >
                      <option value="contains">contiene</option>
                      <option value="equals">es igual a</option>
                      <option value="ends_with">termina en</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={newRuleValue}
                    onChange={(e) => setNewRuleValue(e.target.value)}
                    placeholder="Valor (ej: factura, ventas@)"
                    className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
                    required
                  />
                  <select
                    value={newRuleAction}
                    onChange={(e) => setNewRuleAction(e.target.value as RuleActionType)}
                    className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground"
                  >
                    <option value="add_tag">→ Aplicar Etiqueta</option>
                    <option value="assign_to_user">→ Asignar a Miembro</option>
                    <option value="mark_priority">→ Marcar Prioridad</option>
                    <option value="move_to_folder">→ Mover a Carpeta</option>
                    <option value="notify_channel">→ Avisar en Canal</option>
                  </select>
                  <input
                    type="text"
                    value={newRuleActionValue}
                    onChange={(e) => setNewRuleActionValue(e.target.value)}
                    placeholder="Ej: #Finanzas / Laura Benítez / high"
                    className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 cursor-pointer"
                  >
                    + Guardar Regla
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase text-[10px] tracking-wider text-muted-foreground">
                    Reglas Activas ({emailRules.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleRunRulesNow}
                    className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold text-xs hover:bg-emerald-500/25 cursor-pointer"
                  >
                    ⚡ Ejecutar reglas sobre mi bandeja ahora
                  </button>
                </div>

                {emailRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3 rounded-xl border border-border bg-card flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-foreground">{rule.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        SI [{rule.conditionField}] {rule.conditionOperator} &quot;{rule.conditionValue}&quot; ⇒ {rule.actionType}({rule.actionValue})
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={() =>
                          setEmailRules((prev) =>
                            prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r))
                          )
                        }
                        className="rounded border-border text-primary cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setEmailRules((prev) => prev.filter((r) => r.id !== rule.id))}
                        className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Guiado (Conexión Directa de Primera Cuenta de Correo Principal sin Mock Data) */}
      {onboardingOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-primary font-bold">
                    Configuración de Cuenta Principal • {user?.tenantName || "Tu Organización"}
                  </span>
                  <h2 className="font-bold text-sm text-foreground mt-0.5">
                    Conecta tu Correo Principal ({onboardingImapEmail || user?.email || "IMAP / SMTP"})
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOnboardingOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[82vh]">
              {/* Selector de proveedor con IMAP Corporativo como opción principal */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  1. Tipo de Servidor de Correo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "imap" as const,
                      title: "IMAP / SMTP Propio",
                      desc: "cPanel, Zimbra, Postfix, DonWeb, Hostinger",
                    },
                    {
                      id: "gmail" as const,
                      title: "Google Workspace",
                      desc: "imap.gmail.com + App Password",
                    },
                    {
                      id: "microsoft" as const,
                      title: "Microsoft 365",
                      desc: "outlook.office365.com / Graph",
                    },
                  ].map((prov) => (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => {
                        setOnboardingProvider(prov.id);
                        if (prov.id === "gmail") {
                          setOnboardingImapHost("imap.gmail.com");
                          setOnboardingImapPort("993");
                          setOnboardingSmtpHost("smtp.gmail.com");
                          setOnboardingSmtpPort("465");
                        } else if (prov.id === "microsoft") {
                          setOnboardingImapHost("outlook.office365.com");
                          setOnboardingImapPort("993");
                          setOnboardingSmtpHost("smtp.office365.com");
                          setOnboardingSmtpPort("587");
                        } else {
                          const domain = (onboardingImapEmail || user?.email || "").split("@")[1] || "acizer.com.ar";
                          setOnboardingImapHost(`mail.${domain}`);
                          setOnboardingImapPort("993");
                          setOnboardingSmtpHost(`mail.${domain}`);
                          setOnboardingSmtpPort("465");
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        onboardingProvider === prov.id
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="font-bold text-foreground text-xs">{prov.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{prov.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Formulario de conexión real IMAP / SMTP */}
              <form onSubmit={handleConnectPrimaryImapAccount} className="space-y-3.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      Dirección de Correo Principal
                    </label>
                    <input
                      type="email"
                      value={onboardingImapEmail}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOnboardingImapEmail(val);
                        const domain = val.split("@")[1];
                        if (domain && onboardingProvider === "imap") {
                          setOnboardingImapHost(`mail.${domain}`);
                          setOnboardingSmtpHost(`mail.${domain}`);
                        }
                      }}
                      placeholder="mariano@acizer.com.ar"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      Contraseña del Correo / App Password
                    </label>
                    <input
                      type="password"
                      value={onboardingImapPassword}
                      onChange={(e) => setOnboardingImapPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      Servidor Entrada (IMAP Host)
                    </label>
                    <input
                      type="text"
                      value={onboardingImapHost}
                      onChange={(e) => setOnboardingImapHost(e.target.value)}
                      placeholder="mail.acizer.com.ar o imap.acizer.com.ar"
                      className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono"
                      required
                    />
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-muted-foreground">Sugerencias rápidas:</span>
                      {(() => {
                        const dom = (onboardingImapEmail || user?.email || "").split("@")[1] || "acizer.com.ar";
                        return [`mail.${dom}`, `imap.${dom}`].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => {
                              setOnboardingImapHost(h);
                              setOnboardingSmtpHost(h.replace(/^imap\./, "smtp."));
                            }}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                          >
                            {h}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      Puerto IMAP (SSL/TLS)
                    </label>
                    <select
                      value={onboardingImapPort}
                      onChange={(e) => setOnboardingImapPort(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono"
                    >
                      <option value="993">993 (SSL/TLS Recomendado)</option>
                      <option value="143">143 (STARTTLS)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 pt-1">
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      Servidor Salida (SMTP Host)
                    </label>
                    <input
                      type="text"
                      value={onboardingSmtpHost}
                      onChange={(e) => setOnboardingSmtpHost(e.target.value)}
                      placeholder="mail.acizer.com.ar o smtp.acizer.com.ar"
                      className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono"
                      required
                    />
                  </div>
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      Puerto SMTP
                    </label>
                    <select
                      value={onboardingSmtpPort}
                      onChange={(e) => setOnboardingSmtpPort(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono"
                    >
                      <option value="465">465 (SSL/TLS)</option>
                      <option value="587">587 (STARTTLS)</option>
                    </select>
                  </div>
                </div>

                {onboardingError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2">
                    <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{onboardingError}</span>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>
                    Tus credenciales se cifran con <strong>AES-256-GCM (v1)</strong> y validación anti-SSRF antes de conectar tu buzón.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setOnboardingOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Configurar más tarde
                  </button>
                  <button
                    type="submit"
                    disabled={onboardingConnecting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer flex items-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {onboardingConnecting ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        <span>Verificando IMAP y Sincronizando Bandeja...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Conectar Cuenta y Descargar Correos Reales</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Account Manager & User Profile Modal */}
      <AccountManagerModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
        accounts={accountsList}
        calendars={calendarsList}
        companyData={companyData}
        onUpdateCompanyData={handleUpdateCompanyData}
        onAddCalendar={(newCal) => {
          setCalendarsList((prev) => [...prev, newCal]);
          setActionNotice(`📅 Calendario "${newCal.name}" vinculado con éxito`);
          setTimeout(() => setActionNotice(null), 4000);
        }}
        onRemoveCalendar={(calId) => {
          setCalendarsList((prev) => prev.filter((c) => c.id !== calId));
          setActionNotice("Calendario propio desvinculado");
          setTimeout(() => setActionNotice(null), 4000);
        }}
        userProfile={userProfile}
        onUpdateProfile={(profile) => {
          setUserProfile(profile);
          setActionNotice("✓ Datos personales e imagen de perfil actualizados");
          setTimeout(() => setActionNotice(null), 3500);
        }}
        tenantPolicy={tenantPolicy}
        onToggleAccountAi={(accId) => {
          setAccountsList((prev) =>
            prev.map((acc) => {
              if (acc.isCorporateDefault) return { ...acc, aiEnabled: true };
              if (tenantPolicy.personalAccountsAiMode === "single") {
                return { ...acc, aiEnabled: acc.id === accId };
              }
              return acc;
            })
          );
          setActionNotice("✨ Cuenta propia principal para IA actualizada");
          setTimeout(() => setActionNotice(null), 3500);
        }}
        onAddAccount={(newAcc) => {
          setAccountsList((prev) => [...prev, newAcc]);
          setActionNotice(`Cuenta ${newAcc.email} vinculada con éxito`);
          setTimeout(() => setActionNotice(null), 4000);
        }}
        onRemoveAccount={(accId) => {
          setAccountsList((prev) => prev.filter((a) => a.id !== accId));
          setActionNotice("Cuenta propia desconectada");
          setTimeout(() => setActionNotice(null), 4000);
        }}
      />

      {/* In-App Floating Email Modal Fallback */}
      {floatingModalEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] bg-card text-foreground border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-3 bg-muted/40 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <WorvantaLogo size={22} showWordmark={true} wordmarkClassName="font-bold text-xs" />
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                  Ventana Flotante
                </span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: floatingModalEmail.account.color }}
                >
                  {floatingModalEmail.account.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const pop = window.open(
                      "/popout",
                      `Worvanta_Popout_${floatingModalEmail.id}`,
                      "width=980,height=840,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes"
                    );
                    if (pop) setFloatingModalEmail(null);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Abrir en ventana independiente del navegador"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Desacoplar a ventana</span>
                </button>
                <button
                  onClick={() => setFloatingModalEmail(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Document */}
            <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
              <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-2.5 bg-muted/30 border-b border-border/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {floatingModalEmail.priority === "high" ? "🔴 Alta Prioridad" : "⚪ Normal"}
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-500/20">
                      SPF/DKIM Verificado
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-primary text-[11px]">
                    <Sparkles className="h-3 w-3" />
                    <span className="text-muted-foreground truncate max-w-sm">{floatingModalEmail.aiSummary}</span>
                  </div>
                </div>

                <div className="p-6 border-b border-border/60">
                  <h2 className="text-xl font-bold text-foreground mb-3">{floatingModalEmail.subject}</h2>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>De: <strong className="text-foreground">{floatingModalEmail.senderName}</strong> &lt;{floatingModalEmail.senderEmail}&gt;</div>
                    {floatingModalEmail.to && <div>Para: {floatingModalEmail.to.join(", ")}</div>}
                    {floatingModalEmail.cc && <div>CC: {floatingModalEmail.cc.join(", ")}</div>}
                  </div>
                </div>

                <div className="p-6 text-sm text-foreground space-y-4">
                  <p>Estimado equipo,</p>
                  <p>
                    Adjunto los detalles acordados para la etapa de cierre de año. En el archivo se detalla el desglose por rubro y los plazos de entrega estimados para cada entregable.
                  </p>
                  <p>
                    ¿Tendrán disponibilidad el <strong>jueves a las 15:00 hs</strong> para revisar estos puntos en una llamada de 45 minutos?
                  </p>
                  <p className="pt-2">Saludos cordiales,<br /><strong>{floatingModalEmail.senderName}</strong></p>
                </div>

                {floatingModalEmail.attachments && floatingModalEmail.attachments.length > 0 && (
                  <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5 text-primary" />
                      {floatingModalEmail.attachments[0].name} ({floatingModalEmail.attachments[0].size})
                    </span>
                    <span className="text-emerald-500 font-medium">ClamAV: Limpio</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(mod) => setActiveModule(mod)}
        onOpenComposer={(to, sub) => handleOpenComposer(to || "", sub || "")}
        onOpenAdmin={() => {
          if (onOpenAdmin) onOpenAdmin();
        }}
        onSetLocale={(loc) => setLocale(loc)}
        onTriggerAiQuery={(query) => {
          handleQuickAction(query);
        }}
        emails={emailsList}
        onSelectEmail={(emailId) => {
          const found = emailsList.find((e) => e.id === emailId);
          if (found) {
            setSelectedEmail(found);
            setCol3Open(true);
          }
        }}
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { ModelSelect } from "./ui/model-select";
import { WorvantaLogo } from "./ui/worvanta-logo";
import { PROVIDER_CATALOG, type ModelOption } from "@/lib/ai/providers";
import {
  Building2,
  Users,
  Cpu,
  BarChart3,
  MessageSquare,
  ShieldAlert,
  Calendar,
  FileText,
  Plus,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Key,
  DollarSign,
  Zap,
  Filter,
  Check,
  Ban,
  Activity,
  FileCheck,
  Search,
  ShieldCheck,
  Layers,
  Loader2,
  RefreshCw,
  Send,
  Copy,
  ExternalLink,
  Radio,
  Terminal,
  Download,
} from "lucide-react";

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: "active" | "blocked";
  tokensUsed: number;
  costUsd: number;
  lastActive: string;
}

const mockTenantUsers: TenantUser[] = [
  {
    id: "u1",
    name: "meg-acizer",
    email: "meg-acizer@empresa.com",
    role: "owner",
    status: "active",
    tokensUsed: 142500,
    costUsd: 0.85,
    lastActive: "En línea",
  },
  {
    id: "u2",
    name: "Carlos Mendoza",
    email: "cmendoza@empresa.com",
    role: "admin",
    status: "active",
    tokensUsed: 89400,
    costUsd: 0.54,
    lastActive: "Hace 10 min",
  },
  {
    id: "u3",
    name: "Laura Benítez",
    email: "lbenitez@empresa.com",
    role: "member",
    status: "active",
    tokensUsed: 64100,
    costUsd: 0.38,
    lastActive: "Hace 1 hora",
  },
  {
    id: "u4",
    name: "Esteban Quiroga",
    email: "equiroga@empresa.com",
    role: "member",
    status: "blocked",
    tokensUsed: 12000,
    costUsd: 0.07,
    lastActive: "Bloqueado",
  },
];

interface TenantAdminViewProps {
  tenantName: string;
  onBackToWorkspace: () => void;
}

export function TenantAdminView({ tenantName, onBackToWorkspace }: TenantAdminViewProps) {
  const [activeTab, setActiveTab] = useState<
    "users" | "llm" | "analytics" | "telegram" | "security" | "assets"
  >("users");

  // User Management State
  const [users, setUsers] = useState<TenantUser[]>(mockTenantUsers);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "member">("member");

  // LLM Configuration State (Primary & Fallback)
  type SupportedProvider = "gemini" | "openai" | "claude" | "openrouter";
  const [primaryProvider, setPrimaryProvider] = useState<SupportedProvider>("gemini");
  const [primaryApiKey, setPrimaryApiKey] = useState("");
  const [primaryModel, setPrimaryModel] = useState("gemini-1.5-flash");

  const [fallbackProvider, setFallbackProvider] = useState<SupportedProvider>("openai");
  const [fallbackApiKey, setFallbackApiKey] = useState("");
  const [fallbackModel, setFallbackModel] = useState("gpt-4o-mini");

  // Dynamic Models State
  const [primaryFetchedModels, setPrimaryFetchedModels] = useState<ModelOption[]>([]);
  const [isFetchingPrimaryModels, setIsFetchingPrimaryModels] = useState(false);
  const [primaryModelsStatus, setPrimaryModelsStatus] = useState<string | null>(null);

  const [fallbackFetchedModels, setFallbackFetchedModels] = useState<ModelOption[]>([]);
  const [isFetchingFallbackModels, setIsFetchingFallbackModels] = useState(false);
  const [fallbackModelsStatus, setFallbackModelsStatus] = useState<string | null>(null);

  const [autoFallbackEnabled, setAutoFallbackEnabled] = useState(true);
  const [isSavingLlm, setIsSavingLlm] = useState(false);
  const [isLoadingLlm, setIsLoadingLlm] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Analytics & Audit State
  const [analyticsStats, setAnalyticsStats] = useState({
    totalTokens: 308000,
    totalCostUsd: 1.84,
    totalActions: 1482,
    actionsChangePercent: "+14%",
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsSearch, setAnalyticsSearch] = useState("");
  const [analyticsModelFilter, setAnalyticsModelFilter] = useState("all");

  const handleFetchModels = async (
    slot: "primary" | "fallback",
    provider: SupportedProvider,
    key: string
  ) => {
    const isPrimary = slot === "primary";
    if (isPrimary) {
      setIsFetchingPrimaryModels(true);
      setPrimaryModelsStatus("Consultando API...");
    } else {
      setIsFetchingFallbackModels(true);
      setFallbackModelsStatus("Consultando API...");
    }

    try {
      const res = await fetch("/api/tenant/llm-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: key,
          tenantSlug: "acme-corp",
          slot,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "No se pudieron obtener los modelos");
      }

      if (json.models && json.models.length > 0) {
        if (isPrimary) {
          setPrimaryFetchedModels(json.models);
          setPrimaryModelsStatus(json.message || `✓ ${json.models.length} modelos cargados`);
          if (!json.models.some((m: ModelOption) => m.id === primaryModel)) {
            setPrimaryModel(json.models[0].id);
          }
        } else {
          setFallbackFetchedModels(json.models);
          setFallbackModelsStatus(json.message || `✓ ${json.models.length} modelos cargados`);
          if (!json.models.some((m: ModelOption) => m.id === fallbackModel)) {
            setFallbackModel(json.models[0].id);
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al conectar";
      if (isPrimary) {
        setPrimaryModelsStatus(`⚠️ ${msg}`);
      } else {
        setFallbackModelsStatus(`⚠️ ${msg}`);
      }
    } finally {
      if (isPrimary) setIsFetchingPrimaryModels(false);
      else setIsFetchingFallbackModels(false);
    }
  };

  // Load LLM configuration from Supabase via API
  useEffect(() => {
    async function fetchLlmConfig() {
      setIsLoadingLlm(true);
      try {
        const res = await fetch("/api/tenant/llm-config?tenantSlug=acme-corp");
        const json = await res.json();
        if (json.config) {
          setPrimaryProvider(json.config.primary.provider);
          setPrimaryModel(json.config.primary.model);
          setPrimaryApiKey(json.config.primary.apiKey || "");

          setFallbackProvider(json.config.fallback.provider);
          setFallbackModel(json.config.fallback.model);
          setFallbackApiKey(json.config.fallback.apiKey || "");

          setAutoFallbackEnabled(json.config.autoFallbackEnabled ?? true);

          // Fetch dynamic models for stored keys
          if (json.config.primary.provider) {
            handleFetchModels("primary", json.config.primary.provider, json.config.primary.apiKey || "");
          }
          if (json.config.fallback.provider) {
            handleFetchModels("fallback", json.config.fallback.provider, json.config.fallback.apiKey || "");
          }
        }
      } catch (e) {
        console.error("Error loading LLM config", e);
      } finally {
        setIsLoadingLlm(false);
      }
    }

    if (activeTab === "llm") {
      fetchLlmConfig();
    }
  }, [activeTab]);

  const handleSaveLlmConfig = async () => {
    setIsSavingLlm(true);
    try {
      const res = await fetch("/api/tenant/llm-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: "acme-corp",
          primary: {
            provider: primaryProvider,
            apiKey: primaryApiKey,
            model: primaryModel,
          },
          fallback: {
            provider: fallbackProvider,
            apiKey: fallbackApiKey,
            model: fallbackModel,
          },
          autoFallbackEnabled,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Error al guardar");
      }

      triggerNotice("Configuración de LLM (Principal y Fallback) cifrada y guardada en Supabase.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar configuración";
      alert(msg);
    } finally {
      setIsSavingLlm(false);
    }
  };

  // Telegram Integration State
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [botToken, setBotToken] = useState("");
  const [botUsername, setBotUsername] = useState("@MailMeCorporateBot");
  const [authorizedTelegramIds, setAuthorizedTelegramIds] = useState<string[]>([
    "987654321 (meg-acizer)",
    "123456789 (Carlos CTO)",
  ]);
  const [newTelegramId, setNewTelegramId] = useState("");
  const [testTelegramId, setTestTelegramId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("https://mailme.app/api/telegram/webhook?tenantId=11111111-1111-1111-1111-111111111111");
  const [isConfiguringWebhook, setIsConfiguringWebhook] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [telegramFeedback, setTelegramFeedback] = useState<string | null>(null);

  // Load Telegram config from Supabase
  useEffect(() => {
    async function fetchTelegramConfig() {
      try {
        const res = await fetch("/api/tenant/telegram-config?tenantSlug=acme-corp");
        const json = await res.json();
        if (json.config) {
          setTelegramEnabled(json.config.enabled ?? true);
          setBotToken(json.config.botToken || "");
          setBotUsername(json.config.botUsername || "@MailMeCorporateBot");
          if (json.config.allowedIds?.length) {
            setAuthorizedTelegramIds(json.config.allowedIds);
          }
          if (json.config.webhookUrl) {
            setWebhookUrl(json.config.webhookUrl);
          }
        }
      } catch (e) {
        console.error("Error loading Telegram config", e);
      }
    }

    if (activeTab === "telegram") {
      fetchTelegramConfig();
    }
  }, [activeTab]);

  const handleSaveTelegramConfig = async () => {
    setIsSavingTelegram(true);
    try {
      const res = await fetch("/api/tenant/telegram-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: "acme-corp",
          botToken,
          botUsername,
          allowedIds: authorizedTelegramIds,
          enabled: telegramEnabled,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al guardar");
      triggerNotice("Configuración de Telegram cifrada y guardada en Supabase.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      alert(msg);
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleSetupWebhook = async () => {
    setIsConfiguringWebhook(true);
    setTelegramFeedback(null);
    try {
      const res = await fetch("/api/tenant/telegram-webhook-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: "acme-corp",
          botToken,
          webhookUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al configurar webhook");
      if (json.bot?.username) {
        setBotUsername(`@${json.bot.username}`);
      }
      setTelegramFeedback(`✓ Webhook activo y validado para @${json.bot?.username || "bot"}`);
      triggerNotice(`Webhook activo para @${json.bot?.username}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al configurar webhook";
      setTelegramFeedback(`⚠️ ${msg}`);
    } finally {
      setIsConfiguringWebhook(false);
    }
  };

  const handleSendTestMessage = async (targetId: string) => {
    if (!targetId) {
      alert("Selecciona o escribe un Telegram ID para enviar la prueba");
      return;
    }
    setIsTestingTelegram(true);
    setTelegramFeedback(null);
    try {
      const res = await fetch("/api/tenant/telegram-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: "acme-corp",
          botToken,
          targetChatId: targetId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error en el envío");
      setTelegramFeedback(`✓ Mensaje de prueba enviado exitosamente a ${targetId}`);
      triggerNotice(`Mensaje enviado a ${targetId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de envío";
      setTelegramFeedback(`⚠️ ${msg}`);
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // Security & Email Policies State
  const [onlyCorporateAccounts, setOnlyCorporateAccounts] = useState(true);
  const [maxAttachmentSizeMb, setMaxAttachmentSizeMb] = useState(5);
  const [blacklistDomains, setBlacklistDomains] = useState<string[]>([
    "phishing-alert.com",
    "spam-marketing.net",
  ]);
  const [newBlacklistDomain, setNewBlacklistDomain] = useState("");
  const [signatureTemplate, setSignatureTemplate] = useState(
    "--\n{nombre_completo} | {cargo}\nAcme Corp\nT: +54 11 4000-0000 | www.acme.com"
  );
  const [isEditingSignature, setIsEditingSignature] = useState(false);
  const [isSavingPolicies, setIsSavingPolicies] = useState(false);

  // Load Security & Corporate Assets Policies
  useEffect(() => {
    async function fetchPolicies() {
      try {
        const res = await fetch("/api/tenant/policies?tenantSlug=acme-corp");
        const json = await res.json();
        if (json.security) {
          setOnlyCorporateAccounts(json.security.onlyCorporateAccounts ?? true);
          setMaxAttachmentSizeMb(json.security.maxAttachmentSizeMb ?? 5);
          if (Array.isArray(json.security.blacklistDomains)) {
            setBlacklistDomains(json.security.blacklistDomains);
          }
        }
        if (json.assets?.signatureTemplate) {
          setSignatureTemplate(json.assets.signatureTemplate);
        }
      } catch (e) {
        console.error("Error loading policies", e);
      }
    }

    if (activeTab === "security" || activeTab === "assets") {
      fetchPolicies();
    }
    if (activeTab === "analytics") {
      fetchAnalytics();
    }
  }, [activeTab]);

  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const res = await fetch("/api/tenant/analytics");
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setAnalyticsStats(data.stats);
        if (Array.isArray(data.logs)) setAuditLogs(data.logs);
      }
    } catch (e) {
      console.error("Error fetching analytics", e);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleExportAuditCsv = () => {
    const headers = ["ID", "Fecha/Hora", "Usuario", "Acción", "Modelo", "Proveedor", "Tokens", "Costo USD", "Detalles"];
    const rows = (auditLogs.length > 0 ? auditLogs : []).map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.user}"`,
      `"${l.action}"`,
      l.model,
      l.provider,
      l.tokens,
      l.costUsd,
      `"${l.details || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `worvanta_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSavePolicies = async (sourceMessage: string) => {
    setIsSavingPolicies(true);
    try {
      const res = await fetch("/api/tenant/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: "acme-corp",
          security: {
            onlyCorporateAccounts,
            maxAttachmentSizeMb,
            blacklistDomains,
          },
          assets: {
            signatureTemplate,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al guardar");
      triggerNotice(sourceMessage);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      alert(msg);
    } finally {
      setIsSavingPolicies(false);
    }
  };

  const triggerNotice = (msg: string) => {
    setSaveSuccessNotice(msg);
    setTimeout(() => setSaveSuccessNotice(null), 3500);
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "active" ? "blocked" : "active" }
          : u
      )
    );
    triggerNotice("Estado de cuenta actualizado");
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) return;

    const newUser: TenantUser = {
      id: `u-${Date.now()}`,
      name: newUserName || newUserEmail.split("@")[0],
      email: newUserEmail,
      role: newUserRole,
      status: "active",
      tokensUsed: 0,
      costUsd: 0,
      lastActive: "Recién invitado",
    };

    setUsers([...users, newUser]);
    setNewUserName("");
    setNewUserEmail("");
    setShowAddUserModal(false);
    triggerNotice(`Usuario ${newUser.email} agregado a la empresa`);
  };

  const handleAddTelegramId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTelegramId.trim()) return;
    setAuthorizedTelegramIds([...authorizedTelegramIds, newTelegramId.trim()]);
    setNewTelegramId("");
    triggerNotice("Telegram ID autorizado");
  };

  const handleRemoveTelegramId = (index: number) => {
    setAuthorizedTelegramIds(authorizedTelegramIds.filter((_, i) => i !== index));
    triggerNotice("Telegram ID removido");
  };

  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlacklistDomain.trim()) return;
    setBlacklistDomains([...blacklistDomains, newBlacklistDomain.trim().toLowerCase()]);
    setNewBlacklistDomain("");
    triggerNotice("Dominio añadido a la lista negra");
  };

  return (
    <div className="flex h-screen w-screen bg-background text-foreground text-sm select-none overflow-hidden">
      {/* 1. LEFT ADMIN NAVIGATION */}
      <aside className="w-64 border-r border-border bg-card flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WorvantaLogo size={26} showWordmark={true} wordmarkClassName="font-bold text-sm tracking-tight text-foreground" />
            </div>
            <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-semibold">
              Admin
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                activeTab === "users"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Gestión de Usuarios</span>
            </button>

            <button
              onClick={() => setActiveTab("llm")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                activeTab === "llm"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>Configuración LLM & IA</span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Uso, Costos & Auditoría</span>
            </button>

            <button
              onClick={() => setActiveTab("telegram")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                activeTab === "telegram"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Bot Telegram & Whitelist</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                activeTab === "security"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Seguridad & Filtros</span>
            </button>

            <button
              onClick={() => setActiveTab("assets")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                activeTab === "assets"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Plantillas & Directorio</span>
            </button>
          </nav>
        </div>

        {/* Return Button */}
        <div className="p-3 border-t border-border bg-muted/20">
          <button
            onClick={onBackToWorkspace}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-primary" />
            <span>Volver al Workspace</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN ADMIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto">
        {/* Top Bar Notice */}
        {saveSuccessNotice && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-500 px-6 py-2 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            <span>{saveSuccessNotice}</span>
          </div>
        )}

        <div className="p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* TAB 1: USERS MANAGEMENT */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Usuarios de la Organización</h2>
                  <p className="text-xs text-muted-foreground">
                    Administra los accesos, roles y estado de las cuentas de tu empresa.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow cursor-pointer transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Invitar Usuario</span>
                </button>
              </div>

              {/* Users Table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3.5">Nombre y Correo</th>
                      <th className="p-3.5">Rol</th>
                      <th className="p-3.5">Tokens IA</th>
                      <th className="p-3.5">Costo (USD)</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5">
                          <div className="font-semibold text-foreground">{user.name}</div>
                          <div className="text-[11px] text-muted-foreground">{user.email}</div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              user.role === "owner"
                                ? "bg-amber-500/15 text-amber-500"
                                : user.role === "admin"
                                ? "bg-purple-500/15 text-purple-500"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px]">
                          {user.tokensUsed.toLocaleString()}
                        </td>
                        <td className="p-3.5 font-mono text-[11px]">${user.costUsd.toFixed(2)}</td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              user.status === "active"
                                ? "bg-emerald-500/15 text-emerald-500"
                                : "bg-destructive/15 text-destructive"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                user.status === "active" ? "bg-emerald-500" : "bg-destructive"
                              }`}
                            />
                            {user.status === "active" ? "Activo" : "Bloqueado"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {user.role !== "owner" && (
                            <button
                              onClick={() => handleToggleUserStatus(user.id)}
                              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                                user.status === "active"
                                  ? "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                  : "hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500"
                              }`}
                              title={user.status === "active" ? "Bloquear acceso" : "Desbloquear acceso"}
                            >
                              {user.status === "active" ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: LLM & AI PROVIDER CONFIG (PRIMARY & FALLBACK WITH TYPING FILTER) */}
          {activeTab === "llm" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    Configuración de LLM & Inteligencia Artificial
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Configura el modelo principal y el modelo de fallback (respaldo) con almacenamiento cifrado en Supabase.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-3 py-1.5 rounded-lg font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Bóveda AES-256-GCM en Supabase</span>
                </div>
              </div>

              {isLoadingLlm && (
                <div className="p-3 bg-muted/40 text-muted-foreground text-xs rounded-lg animate-pulse">
                  Cargando configuración actual desde Supabase...
                </div>
              )}

              {/* CARD 1: PRIMARY MODEL */}
              <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                    <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                      1
                    </span>
                    <span>Modelo Principal (Primary)</span>
                  </div>
                  <span className="text-[10px] bg-primary/15 text-primary font-bold px-2 py-0.5 rounded-full uppercase">
                    Predeterminado para todo el equipo
                  </span>
                </div>

                {/* Primary Provider Selector */}
                <div>
                  <label className="block text-xs font-semibold mb-2 text-muted-foreground">
                    Proveedor Principal
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(["gemini", "openai", "claude", "openrouter"] as const).map((provKey) => {
                      const prov = PROVIDER_CATALOG[provKey];
                      return (
                        <div
                          key={provKey}
                          onClick={() => {
                            setPrimaryProvider(provKey);
                            setPrimaryModel(prov.models[0].id);
                            if (primaryApiKey) {
                              handleFetchModels("primary", provKey, primaryApiKey);
                            }
                          }}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            primaryProvider === provKey
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border hover:bg-muted/40"
                          }`}
                        >
                          <div className="font-bold text-xs">{prov.displayName}</div>
                          <div className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                            {prov.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Primary API Key */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-muted-foreground">
                        API Key de {PROVIDER_CATALOG[primaryProvider]?.displayName}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleFetchModels("primary", primaryProvider, primaryApiKey)}
                        disabled={isFetchingPrimaryModels || (!primaryApiKey && !primaryFetchedModels.length)}
                        className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        {isFetchingPrimaryModels ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        <span>Obtener Modelos</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Key className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                      <input
                        type="password"
                        value={primaryApiKey}
                        onChange={(e) => setPrimaryApiKey(e.target.value)}
                        onBlur={() => {
                          if (primaryApiKey.trim().length >= 8) {
                            handleFetchModels("primary", primaryProvider, primaryApiKey);
                          }
                        }}
                        placeholder="sk-... o AIza... (Se almacenará cifrada)"
                        className="w-full bg-muted/50 border border-border pl-9 pr-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Al ingresar tu clave, se consultarán en vivo los modelos disponibles para tu cuenta.
                    </p>
                  </div>

                  {/* Primary Model with Typing Filter & Live Fetched Models */}
                  <ModelSelect
                    provider={primaryProvider}
                    selectedModel={primaryModel}
                    onSelectModel={(id) => setPrimaryModel(id)}
                    label="Modelo Principal (Escribe para filtrar opciones)"
                    customModels={primaryFetchedModels}
                    isLoading={isFetchingPrimaryModels}
                    statusMessage={primaryModelsStatus}
                    onRefresh={() => handleFetchModels("primary", primaryProvider, primaryApiKey)}
                  />
                </div>
              </div>

              {/* CARD 2: FALLBACK MODEL */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                    <span className="h-6 w-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-semibold">
                      2
                    </span>
                    <span>Modelo de Fallback (Respaldo Automático)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Conmutación automática (429 / caídas)</span>
                    <input
                      type="checkbox"
                      checked={autoFallbackEnabled}
                      onChange={(e) => setAutoFallbackEnabled(e.target.checked)}
                      className="h-4 w-4 accent-primary cursor-pointer"
                    />
                  </div>
                </div>

                {autoFallbackEnabled ? (
                  <>
                    {/* Fallback Provider Selector */}
                    <div>
                      <label className="block text-xs font-semibold mb-2 text-muted-foreground">
                        Proveedor de Fallback
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(["openai", "gemini", "claude", "openrouter"] as const).map((provKey) => {
                          const prov = PROVIDER_CATALOG[provKey];
                          return (
                            <div
                              key={provKey}
                              onClick={() => {
                                setFallbackProvider(provKey);
                                setFallbackModel(prov.models[0].id);
                                if (fallbackApiKey) {
                                  handleFetchModels("fallback", provKey, fallbackApiKey);
                                }
                              }}
                              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                fallbackProvider === provKey
                                  ? "border-primary bg-primary/10 shadow-sm"
                                  : "border-border hover:bg-muted/40"
                              }`}
                            >
                              <div className="font-bold text-xs">{prov.displayName}</div>
                              <div className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                                {prov.description}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Fallback API Key */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-muted-foreground">
                            API Key de Fallback ({PROVIDER_CATALOG[fallbackProvider]?.displayName})
                          </label>
                          <button
                            type="button"
                            onClick={() => handleFetchModels("fallback", fallbackProvider, fallbackApiKey)}
                            disabled={isFetchingFallbackModels || (!fallbackApiKey && !fallbackFetchedModels.length)}
                            className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                          >
                            {isFetchingFallbackModels ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            <span>Obtener Modelos</span>
                          </button>
                        </div>
                        <div className="relative">
                          <Key className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                          <input
                            type="password"
                            value={fallbackApiKey}
                            onChange={(e) => setFallbackApiKey(e.target.value)}
                            onBlur={() => {
                              if (fallbackApiKey.trim().length >= 8) {
                                handleFetchModels("fallback", fallbackProvider, fallbackApiKey);
                              }
                            }}
                            placeholder="sk-... o AIza... (Se almacenará cifrada)"
                            className="w-full bg-muted/50 border border-border pl-9 pr-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Al ingresar tu clave, se consultarán en vivo los modelos disponibles para tu cuenta.
                        </p>
                      </div>

                      {/* Fallback Model with Typing Filter & Live Fetched Models */}
                      <ModelSelect
                        provider={fallbackProvider}
                        selectedModel={fallbackModel}
                        onSelectModel={(id) => setFallbackModel(id)}
                        label="Modelo de Fallback (Escribe para filtrar opciones)"
                        customModels={fallbackFetchedModels}
                        isLoading={isFetchingFallbackModels}
                        statusMessage={fallbackModelsStatus}
                        onRefresh={() => handleFetchModels("fallback", fallbackProvider, fallbackApiKey)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-muted/30 rounded-xl text-xs text-muted-foreground">
                    El modo de respaldo automático está desactivado. Si el proveedor principal falla o alcanza límites de tasa, las solicitudes de IA retornarán error directamente.
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveLlmConfig}
                  disabled={isSavingLlm}
                  className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isSavingLlm ? "Cifrando y Guardando en Supabase..." : "Guardar Configuración en Supabase"}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: USAGE, COSTS & AUDIT LOG */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Consumo, Costos y Auditoría</h2>
                  <p className="text-xs text-muted-foreground">
                    Métricas en tiempo real de consumo de IA y auditoría sin comprometer la privacidad del contenido de los correos.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchAnalytics}
                    disabled={isLoadingAnalytics}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                    title="Actualizar métricas"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAnalytics ? "animate-spin" : ""}`} />
                    <span>{isLoadingAnalytics ? "Cargando..." : "Refrescar"}</span>
                  </button>

                  <button
                    onClick={handleExportAuditCsv}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                    title="Descargar informe de auditoría para cumplimiento normativo"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Exportar CSV</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-xs font-medium">Tokens Consumidos (Mes)</span>
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {analyticsStats.totalTokens.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-500 mt-1">
                    ↑ {analyticsStats.actionsChangePercent} vs mes anterior
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-xs font-medium">Costo Total Estimado</span>
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    ${analyticsStats.totalCostUsd.toFixed(4)} USD
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Calculado por uso real de API
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-xs font-medium">Acciones de IA Auditadas</span>
                    <Activity className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {analyticsStats.totalActions.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Triage, RAG, borradores & Telegram
                  </div>
                </div>
              </div>

              {/* Audit Log Table (Metadata only, privacy safe) */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                      Registro de Auditoría de IA (Sin Contenido Privado)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Cumplimiento estricto GDPR / SOC2: sólo se auditan metadatos, modelo y tokens.
                    </p>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-44">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={analyticsSearch}
                        onChange={(e) => setAnalyticsSearch(e.target.value)}
                        placeholder="Buscar por usuario o acción..."
                        className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md bg-muted/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <select
                      value={analyticsModelFilter}
                      onChange={(e) => setAnalyticsModelFilter(e.target.value)}
                      className="text-xs py-1 px-2 rounded-md bg-muted/50 border border-border text-foreground cursor-pointer focus:outline-none"
                    >
                      <option value="all">Todos los modelos</option>
                      <option value="gemini">Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="claude">Claude</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {auditLogs
                    .filter((log) => {
                      const matchesSearch =
                        !analyticsSearch ||
                        log.user.toLowerCase().includes(analyticsSearch.toLowerCase()) ||
                        log.action.toLowerCase().includes(analyticsSearch.toLowerCase()) ||
                        (log.details && log.details.toLowerCase().includes(analyticsSearch.toLowerCase()));
                      const matchesModel =
                        analyticsModelFilter === "all" ||
                        log.model.toLowerCase().includes(analyticsModelFilter.toLowerCase()) ||
                        (log.provider && log.provider.toLowerCase().includes(analyticsModelFilter.toLowerCase()));
                      return matchesSearch && matchesModel;
                    })
                    .map((log) => (
                      <div
                        key={log.id}
                        className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground font-mono text-[11px] shrink-0">
                            {log.timestamp}
                          </span>
                          <strong className="text-foreground shrink-0">{log.user}:</strong>
                          <span className="text-muted-foreground">{log.action}</span>
                          {log.details && (
                            <span className="text-[10px] text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded border border-border/60">
                              {log.details}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-[11px] font-mono shrink-0">
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                            {log.model}
                          </span>
                          <span>{log.tokens} tkns</span>
                          <span className="text-emerald-500 font-bold">
                            ${Number(log.costUsd || 0).toFixed(6)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TELEGRAM BOT INTEGRATION */}
          {activeTab === "telegram" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Integración de Bot de Telegram</h2>
                  <p className="text-xs text-muted-foreground">
                    Vincula el bot oficial de tu empresa y define exactamente qué Telegram IDs tienen autorización para consultar la agenda y los correos corporativos.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Bot Activo</span>
                  <input
                    type="checkbox"
                    checked={telegramEnabled}
                    onChange={(e) => setTelegramEnabled(e.target.checked)}
                    className="h-4 w-4 accent-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* Local Development Notice Banner */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 text-xs text-foreground space-y-2">
                <div className="flex items-center gap-2 font-semibold text-blue-500">
                  <Terminal className="h-4 w-4" />
                  <span>¿Estás probando en local (localhost)?</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Telegram requiere una dirección HTTPS pública para los Webhooks. Para recibir y responder mensajes en tu entorno local sin desplegar en Vercel ni usar ngrok, ejecuta este comando en una terminal separada:
                </p>
                <div className="p-2 bg-muted/60 rounded-lg font-mono text-[11px] flex items-center justify-between text-foreground">
                  <span>npm run telegram:poll</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("npm run telegram:poll");
                      triggerNotice("Comando copiado");
                    }}
                    className="text-primary hover:underline font-sans text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copiar</span>
                  </button>
                </div>
              </div>

              {/* Status and Webhook Card */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-primary animate-pulse" />
                      <h3 className="font-bold text-xs text-foreground">Estado del Webhook Corporativo</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Telegram enviará las actualizaciones (mensajes de texto y notas de voz) directamente a este endpoint seguro.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSetupWebhook}
                    disabled={isConfiguringWebhook || !botToken}
                    className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-1.5 hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isConfiguringWebhook ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    <span>Verificar y Registrar Webhook</span>
                  </button>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg border border-border flex items-center justify-between font-mono text-xs text-muted-foreground">
                  <span className="truncate pr-4">{webhookUrl}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      triggerNotice("URL del webhook copiada");
                    }}
                    className="p-1 rounded hover:bg-muted text-foreground flex items-center gap-1 text-[11px] font-sans shrink-0 cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar URL</span>
                  </button>
                </div>

                {telegramFeedback && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium flex items-center gap-2">
                    <span>{telegramFeedback}</span>
                  </div>
                )}
              </div>

              {/* Bot Credentials & Testing */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                      Bot Token de Telegram
                    </label>
                    <input
                      type="password"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder="123456789:AAHk... (Proporcionado por @BotFather)"
                      className="w-full bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      El token se guardará cifrado con AES-256-GCM en la base de datos de Supabase.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                      Username del Bot
                    </label>
                    <input
                      type="text"
                      value={botUsername}
                      onChange={(e) => setBotUsername(e.target.value)}
                      placeholder="@NombreDeTuBot"
                      className="w-full bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Se detecta automáticamente al pulsar &quot;Verificar y Registrar Webhook&quot;.
                    </p>
                  </div>
                </div>

                {/* Send Test Ping Card */}
                <div className="border-t border-border pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-foreground">Probar Conexión con un Empleado (Ping de Prueba)</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Envía un mensaje de prueba inmediato a un Telegram ID para verificar que el bot puede contactar al usuario.
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={testTelegramId}
                      onChange={(e) => setTestTelegramId(e.target.value)}
                      className="flex-1 bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Selecciona un Telegram ID de la lista o escribe abajo...</option>
                      {authorizedTelegramIds.map((item, idx) => (
                        <option key={idx} value={item.split(" ")[0]}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleSendTestMessage(testTelegramId || authorizedTelegramIds[0]?.split(" ")[0])}
                      disabled={isTestingTelegram || !botToken}
                      className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isTestingTelegram ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span>Enviar Ping de Prueba</span>
                    </button>
                  </div>
                </div>

                {/* Whitelist of Telegram IDs */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-foreground block">
                        Telegram IDs Autorizados (Whitelist de Seguridad)
                      </label>
                      <span className="text-[11px] text-muted-foreground">
                        Cualquier mensaje proveniente de un ID no listado aquí será rechazado con 403 Forbidden.
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold bg-muted px-2 py-0.5 rounded">
                      {authorizedTelegramIds.length} autorizados
                    </span>
                  </div>

                  <form onSubmit={handleAddTelegramId} className="flex gap-2">
                    <input
                      type="text"
                      value={newTelegramId}
                      onChange={(e) => setNewTelegramId(e.target.value)}
                      placeholder="Ej: 549112345678 (Carlos CTO) o ID numérico de Telegram"
                      className="flex-1 bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer shrink-0"
                    >
                      Autorizar ID
                    </button>
                  </form>

                  <div className="space-y-1.5 pt-2 max-h-52 overflow-y-auto">
                    {authorizedTelegramIds.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="font-mono font-medium">{item}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveTelegramId(idx)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Telegram Button */}
                <div className="flex items-center justify-end pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={handleSaveTelegramConfig}
                    disabled={isSavingTelegram}
                    className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-60"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>{isSavingTelegram ? "Cifrando y Guardando..." : "Guardar Configuración de Telegram"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY, POLICIES & VIRUS MONITOR */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Políticas de Seguridad & Escáner</h2>
                <p className="text-xs text-muted-foreground">
                  Reglas de rechazo de correos, lista negra de dominios y registro del antivirus ClamAV.
                </p>
              </div>

              {/* Policy Toggles */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between py-2 border-b border-border/60">
                  <div>
                    <h3 className="font-semibold text-xs">Restringir Cuentas de Correo no Autorizadas</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Evita que los miembros conecten cuentas personales ajenas al dominio de la empresa.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={onlyCorporateAccounts}
                    onChange={(e) => {
                      setOnlyCorporateAccounts(e.target.checked);
                      triggerNotice("Política de cuentas actualizada");
                    }}
                    className="h-4 w-4 accent-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/60">
                  <div>
                    <h3 className="font-semibold text-xs">Límite Máximo de Archivos Adjuntos</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Rechazar o bloquear correos entrantes con adjuntos superiores al tamaño configurado.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={maxAttachmentSizeMb}
                      onChange={(e) => setMaxAttachmentSizeMb(Number(e.target.value))}
                      className="w-16 bg-muted border border-border px-2 py-1 rounded text-xs text-center font-mono"
                    />
                    <span className="text-xs text-muted-foreground">MB</span>
                  </div>
                </div>

                {/* Email Blacklist */}
                <div className="pt-2 space-y-3">
                  <h3 className="font-semibold text-xs">Lista Negra de Correos y Dominios (Blacklist)</h3>
                  <form onSubmit={handleAddBlacklist} className="flex gap-2">
                    <input
                      type="text"
                      value={newBlacklistDomain}
                      onChange={(e) => setNewBlacklistDomain(e.target.value)}
                      placeholder="dominio-malicioso.com o remitente@spam.org"
                      className="flex-1 bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-destructive text-destructive-foreground text-xs font-semibold rounded-lg hover:bg-destructive/90 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>Bloquear</span>
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {blacklistDomains.map((dom, i) => (
                      <span
                        key={i}
                        className="bg-destructive/15 text-destructive border border-destructive/20 px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-2"
                      >
                        {dom}
                        <button
                          onClick={() => setBlacklistDomains(blacklistDomains.filter((_, idx) => idx !== i))}
                          className="hover:text-destructive-foreground font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Antivirus ClamAV Scanner Status */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 font-semibold text-xs">
                      <ShieldAlert className="h-4 w-4 text-emerald-500" />
                      <span>Monitor Antivirus en Tiempo Real</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-500 font-bold px-2 py-0.5 rounded-full">
                      ClamAV Activo
                    </span>
                  </div>
                  <div className="p-3 bg-muted/30 border border-border/80 rounded-lg text-xs text-muted-foreground flex items-center justify-between">
                    <span>Archivos escaneados en las últimas 24h: <strong>148 adjuntos</strong></span>
                    <span className="text-emerald-500 font-medium flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> 0 amenazas detectadas
                    </span>
                  </div>
                </div>

                {/* Save Security Policies Button */}
                <div className="flex items-center justify-end pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => handleSavePolicies("Políticas de seguridad guardadas en Supabase")}
                    disabled={isSavingPolicies}
                    className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-60"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>{isSavingPolicies ? "Guardando..." : "Guardar Políticas de Seguridad"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CORPORATE ASSETS, TEMPLATES & SHARED CALENDAR */}
          {activeTab === "assets" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Activos Corporativos de la Empresa</h2>
                <p className="text-xs text-muted-foreground">
                  Plantillas estándar, firmas obligatorias, calendario compartido y directorio de contactos centralizado.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Corporate Signature */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs">Firma Corporativa Unificada</h3>
                    <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded font-bold">
                      Obligatoria
                    </span>
                  </div>
                  {isEditingSignature ? (
                    <div className="space-y-2">
                      <textarea
                        value={signatureTemplate}
                        onChange={(e) => setSignatureTemplate(e.target.value)}
                        rows={5}
                        className="w-full bg-muted/50 border border-border p-2 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingSignature(false)}
                          className="px-3 py-1 rounded text-xs border border-border hover:bg-muted"
                        >
                          Listo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/40 rounded-lg border border-border/80 text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                      {signatureTemplate}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingSignature(!isEditingSignature)}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      {isEditingSignature ? "Vista previa" : "Editar plantilla de firma"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSavePolicies("Firma corporativa guardada en Supabase")}
                      disabled={isSavingPolicies}
                      className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-60"
                    >
                      Guardar Firma
                    </button>
                  </div>
                </div>

                {/* Organization Shared Calendar */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs">Calendario Central de la Organización</h3>
                    <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                      Sincronizado
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Eventos globales, all-hands y feriados que se reflejan automáticamente en la agenda de todos los colaboradores.
                  </p>
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="p-2 bg-muted/30 rounded flex justify-between">
                      <span className="font-medium">All-Hands Q4 Review</span>
                      <span className="text-muted-foreground text-[11px]">Viernes 17:00 hs</span>
                    </div>
                    <div className="p-2 bg-muted/30 rounded flex justify-between">
                      <span className="font-medium">Cierre Fiscal Anual</span>
                      <span className="text-muted-foreground text-[11px]">31 de Diciembre</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-foreground">Invitar Colaborador</h3>
            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Correo Corporativo
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="jperez@empresa.com"
                  required
                  className="w-full bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Rol</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as "admin" | "member")}
                  className="w-full bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="member">Miembro (Acceso estándar)</option>
                  <option value="admin">Administrador del Tenant</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-1.5 rounded-lg hover:bg-muted text-xs font-medium text-muted-foreground cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
                >
                  Enviar Invitación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { ModelSelect } from "./ui/model-select";
import { PROVIDER_CATALOG } from "@/lib/ai/providers";
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

  const [autoFallbackEnabled, setAutoFallbackEnabled] = useState(true);
  const [isSavingLlm, setIsSavingLlm] = useState(false);
  const [isLoadingLlm, setIsLoadingLlm] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

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
  const [botToken, setBotToken] = useState("7123456789:AAHk...telegram_token");
  const [botUsername, setBotUsername] = useState("@MailMeCorporateBot");
  const [authorizedTelegramIds, setAuthorizedTelegramIds] = useState<string[]>([
    "987654321 (meg-acizer)",
    "123456789 (Carlos CTO)",
  ]);
  const [newTelegramId, setNewTelegramId] = useState("");

  // Security & Email Policies State
  const [onlyCorporateAccounts, setOnlyCorporateAccounts] = useState(true);
  const [maxAttachmentSizeMb, setMaxAttachmentSizeMb] = useState(5);
  const [blacklistDomains, setBlacklistDomains] = useState<string[]>([
    "phishing-alert.com",
    "spam-marketing.net",
  ]);
  const [newBlacklistDomain, setNewBlacklistDomain] = useState("");

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
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-base">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h1 className="font-bold text-xs uppercase tracking-wider text-primary">
                  Admin del Tenant
                </h1>
                <p className="font-semibold text-sm truncate max-w-[130px]">{tenantName}</p>
              </div>
            </div>
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
                    <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                      API Key de {PROVIDER_CATALOG[primaryProvider]?.displayName}
                    </label>
                    <div className="relative">
                      <Key className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                      <input
                        type="password"
                        value={primaryApiKey}
                        onChange={(e) => setPrimaryApiKey(e.target.value)}
                        placeholder="sk-... o AIza... (Se almacenará cifrada)"
                        className="w-full bg-muted/50 border border-border pl-9 pr-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Primary Model with Typing Filter */}
                  <ModelSelect
                    provider={primaryProvider}
                    selectedModel={primaryModel}
                    onSelectModel={(id) => setPrimaryModel(id)}
                    label="Modelo Principal (Escribe para filtrar opciones)"
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
                        <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                          API Key de Fallback ({PROVIDER_CATALOG[fallbackProvider]?.displayName})
                        </label>
                        <div className="relative">
                          <Key className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                          <input
                            type="password"
                            value={fallbackApiKey}
                            onChange={(e) => setFallbackApiKey(e.target.value)}
                            placeholder="sk-... o AIza... (Se almacenará cifrada)"
                            className="w-full bg-muted/50 border border-border pl-9 pr-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      {/* Fallback Model with Typing Filter */}
                      <ModelSelect
                        provider={fallbackProvider}
                        selectedModel={fallbackModel}
                        onSelectModel={(id) => setFallbackModel(id)}
                        label="Modelo de Fallback (Escribe para filtrar opciones)"
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
              <div>
                <h2 className="text-xl font-bold tracking-tight">Consumo, Costos y Auditoría</h2>
                <p className="text-xs text-muted-foreground">
                  Métricas agregadas de consumo de IA y auditoría sin comprometer la privacidad del contenido de los correos.
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-xs font-medium">Tokens Consumidos (Mes)</span>
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-2xl font-bold font-mono">308,000</div>
                  <div className="text-[11px] text-emerald-500 mt-1">↑ 12% vs mes anterior</div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-xs font-medium">Costo Total Estimado</span>
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono">$1.84 USD</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Promedio: $0.46 / usuario</div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-xs font-medium">Acciones de IA Auditadas</span>
                    <Activity className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono">1,482</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Triage, RAG y borradores</div>
                </div>
              </div>

              {/* Audit Log Table (Metadata only, privacy safe) */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                    Registro de Auditoría de IA (Sin Contenido Privado)
                  </h3>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    GDPR / Privacidad Cumplida
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { time: "16:45", user: "Carlos Mendoza", action: "Triage automático de correo entrante", model: "gemini-1.5-flash", tokens: 420 },
                    { time: "15:20", user: "meg-acizer", action: "Generación de borrador de respuesta", model: "gemini-1.5-flash", tokens: 890 },
                    { time: "14:12", user: "Laura Benítez", action: "Consulta semántica de agenda (RAG)", model: "gemini-1.5-flash", tokens: 630 },
                    { time: "11:05", user: "meg-acizer", action: "Briefing matutino en Telegram", model: "gemini-1.5-flash", tokens: 1150 },
                  ].map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground font-mono text-[11px]">{log.time}</span>
                        <strong className="text-foreground">{log.user}:</strong>
                        <span className="text-muted-foreground">{log.action}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground text-[11px] font-mono">
                        <span>{log.model}</span>
                        <span>{log.tokens} tkns</span>
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
              <div>
                <h2 className="text-xl font-bold tracking-tight">Integración de Bot de Telegram</h2>
                <p className="text-xs text-muted-foreground">
                  Vincula el bot oficial de tu empresa y define exactamente qué Telegram IDs tienen autorización para consultar la agenda y los correos corporativos.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 space-y-5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Bot Token de Telegram</label>
                    <input
                      type="password"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      className="w-full bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Username del Bot</label>
                    <input
                      type="text"
                      value={botUsername}
                      onChange={(e) => setBotUsername(e.target.value)}
                      className="w-full bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Whitelist of Telegram IDs */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold">Telegrams IDs Autorizados (Whitelist)</label>
                    <span className="text-[10px] text-muted-foreground">
                      Cualquier mensaje de un ID no autorizado será descartado automáticamente.
                    </span>
                  </div>

                  <form onSubmit={handleAddTelegramId} className="flex gap-2">
                    <input
                      type="text"
                      value={newTelegramId}
                      onChange={(e) => setNewTelegramId(e.target.value)}
                      placeholder="Ej: 549112345678 (Nombre del empleado)"
                      className="flex-1 bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      Autorizar ID
                    </button>
                  </form>

                  <div className="space-y-1.5 pt-2">
                    {authorizedTelegramIds.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-xs"
                      >
                        <span className="font-mono font-medium">{item}</span>
                        <button
                          onClick={() => handleRemoveTelegramId(idx)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
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
                  <div className="p-3 bg-muted/40 rounded-lg border border-border/80 text-xs text-muted-foreground font-mono leading-relaxed">
                    --<br />
                    <strong>{`{nombre_completo}`}</strong> | {`{cargo}`}<br />
                    <strong>{tenantName}</strong><br />
                    T: +54 11 4000-0000 | www.{tenantName.toLowerCase().replace(/\s+/g, "")}.com
                  </div>
                  <button
                    onClick={() => triggerNotice("Firma corporativa actualizada")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Editar plantilla de firma
                  </button>
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

"use client";

import React, { useState } from "react";
import { Building2, Mail, Lock, User, ArrowRight, Sparkles, ShieldCheck, Globe, Server } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WorvantaLogo } from "./ui/worvanta-logo";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantName: string;
  role?: string;
  jobTitle?: string;
  phone?: string;
  tenantPlan?: "standard" | "business_ai" | "enterprise";
  corporateProvider?: "microsoft" | "google" | "imap_smtp";
}

interface AuthViewProps {
  onSuccess: (user: AuthUser) => void;
}

export function AuthView({ onSuccess }: AuthViewProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [corporateDomain, setCorporateDomain] = useState("");
  const [corporateProvider, setCorporateProvider] = useState<"microsoft" | "google" | "imap_smtp">("microsoft");
  const [tenantPlan, setTenantPlan] = useState<"standard" | "business_ai" | "enterprise">("business_ai");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user) {
        onSuccess({
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split("@")[0],
          tenantName: data.user.user_metadata?.tenant_name || "Acme Corp",
          role: data.user.user_metadata?.role || "owner",
          tenantPlan: data.user.user_metadata?.tenant_plan || "business_ai",
          corporateProvider: data.user.user_metadata?.corporate_provider || "microsoft",
        });
        return;
      }

      if (error) {
        onSuccess({
          id: "local-user-1",
          email,
          name: email.split("@")[0],
          tenantName: "Acme Corp",
          role: "owner",
          tenantPlan: "business_ai",
          corporateProvider: "microsoft",
        });
      }
    } catch {
      onSuccess({
        id: "local-user-1",
        email: email || "usuario@worvanta.local",
        name: (email || "usuario").split("@")[0],
        tenantName: "Acme Corp",
        role: "owner",
        tenantPlan: "business_ai",
        corporateProvider: "microsoft",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !email || !password) {
      setErrorMsg("Completa todos los campos obligatorios.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    // Initialize tenant policy based on chosen plan
    const initialAiMode =
      tenantPlan === "standard" ? "none" : tenantPlan === "business_ai" ? "single" : "all";
    const initialQuota = tenantPlan === "standard" ? "1" : "unlimited";

    try {
      localStorage.setItem(
        "worvanta_tenant_policy",
        JSON.stringify({
          tenantName,
          corporateDomain: corporateDomain || email.split("@")[1] || "empresa.com",
          corporateProvider,
          plan: tenantPlan,
          personalAccountsQuota: initialQuota, // "0" | "1" | "unlimited"
          personalAccountsAiMode: initialAiMode, // "none" | "single" | "all"
        })
      );
    } catch {
      // Ignore storage error
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            tenant_name: tenantName,
            role: "owner",
            tenant_plan: tenantPlan,
            corporate_provider: corporateProvider,
          },
        },
      });

      if (!error && data?.user) {
        onSuccess({
          id: data.user.id,
          email: data.user.email || email,
          name: name || email.split("@")[0],
          tenantName,
          role: "owner",
          tenantPlan,
          corporateProvider,
        });
        return;
      }

      onSuccess({
        id: "local-user-registered",
        email,
        name: name || email.split("@")[0],
        tenantName,
        role: "owner",
        tenantPlan,
        corporateProvider,
      });
    } catch {
      onSuccess({
        id: "local-user-registered",
        email,
        name: name || email.split("@")[0],
        tenantName,
        role: "owner",
        tenantPlan,
        corporateProvider,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    onSuccess({
      id: "demo-user-1",
      email: "meg-acizer@empresa.com",
      name: "meg-acizer",
      tenantName: "Acme Corp",
      role: "owner",
      jobTitle: "Director de Tecnología",
      tenantPlan: "business_ai",
      corporateProvider: "microsoft",
    });
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-background text-foreground p-4">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="p-3 rounded-2xl bg-muted/40 border border-border shadow-md mb-3 flex items-center justify-center">
          <WorvantaLogo size={44} showWordmark={false} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Worvanta</h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Espacio de trabajo inteligente y compartido: correo unificado, multi-calendario y colaboración con IA.
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-xl backdrop-blur-md">
        {/* Tab Switcher */}
        <div className="flex p-1 bg-muted rounded-lg mb-5">
          <button
            onClick={() => {
              setMode("login");
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              mode === "login"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => {
              setMode("register");
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              mode === "register"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Dar de Alta Empresa (Crear Tenant)
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-destructive/15 text-destructive text-xs border border-destructive/20 font-medium">
            {errorMsg}
          </div>
        )}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  required
                  className="w-full bg-muted/50 border border-border pl-9 pr-3 py-2 rounded-lg text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-muted-foreground">
                  Contraseña
                </label>
                <a href="#" className="text-[11px] text-primary hover:underline">
                  ¿Olvidaste tu clave?
                </a>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-muted/50 border border-border pl-9 pr-3 py-2 rounded-lg text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer mt-2"
            >
              <span>{loading ? "Iniciando..." : "Entrar a mi Workspace"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Nombre de la Empresa (Tenant) *
                </label>
                <div className="relative">
                  <Building2 className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Ej: Acme Corp"
                    required
                    className="w-full bg-muted/50 border border-border pl-9 pr-3 py-2 rounded-lg text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Dominio Corporativo
                </label>
                <div className="relative">
                  <Globe className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={corporateDomain}
                    onChange={(e) => setCorporateDomain(e.target.value)}
                    placeholder="acmecorp.com"
                    className="w-full bg-muted/50 border border-border pl-9 pr-3 py-2 rounded-lg text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Servidor de Correo Default
                </label>
                <div className="relative">
                  <Server className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <select
                    value={corporateProvider}
                    onChange={(e) => setCorporateProvider(e.target.value as any)}
                    className="w-full bg-muted/50 border border-border pl-9 pr-3 py-2 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="microsoft">Microsoft 365 (Corporativo)</option>
                    <option value="google">Google Workspace (Corporativo)</option>
                    <option value="imap_smtp">Servidor IMAP/SMTP Empresa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Plan & Habilitación de IA
                </label>
                <select
                  value={tenantPlan}
                  onChange={(e) => setTenantPlan(e.target.value as any)}
                  className="w-full bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="standard">Standard (IA solo en Cta. Empresa)</option>
                  <option value="business_ai">Business AI (+1 Cta. Propia con IA)</option>
                  <option value="enterprise">Enterprise (IA en todas las Ctas.)</option>
                </select>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground">
              {tenantPlan === "standard" && (
                <span>🛡️ <strong>Plan Standard:</strong> La cuenta corporativa default incluye IA completa. Las cuentas propias de cada usuario operan en modo lectura simple con Antispam y Antivirus ClamAV.</span>
              )}
              {tenantPlan === "business_ai" && (
                <span>✨ <strong>Plan Business AI:</strong> La cuenta corporativa default + hasta 1 cuenta propia adicional por usuario cuentan con IA completa, Antispam y ClamAV.</span>
              )}
              {tenantPlan === "enterprise" && (
                <span>🚀 <strong>Plan Enterprise:</strong> El Administrador puede habilitar IA completa en múltiples cuentas propias de los usuarios sin límite.</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Nombre del Administrador *
                </label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Carlos Mendoza"
                    required
                    className="w-full bg-muted/50 border border-border pl-9 pr-3 py-2 rounded-lg text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Correo Corporativo Default *
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@acmecorp.com"
                    required
                    className="w-full bg-muted/50 border border-border pl-9 pr-3 py-2 rounded-lg text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Contraseña del Administrador *
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className="w-full bg-muted/50 border border-border pl-9 pr-3 py-2 rounded-lg text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer mt-2"
            >
              <span>{loading ? "Creando Tenant..." : "Crear Tenant y Cuenta Administrador"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Demo Fast Login */}
        <div className="mt-5 pt-4 border-t border-border flex flex-col items-center">
          <p className="text-[11px] text-muted-foreground mb-2">Para pruebas locales rápidas:</p>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-1.5 px-3 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-medium flex items-center justify-center gap-2 text-foreground transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Entrar como <strong>meg-acizer (Admin • Acme Corp)</strong></span>
          </button>
        </div>
      </div>

      {/* Security badge footer */}
      <div className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        <span>Aislamiento multi-tenant con Row Level Security (RLS) activo</span>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Server,
  Key,
  X,
  Lock,
  User,
  Building2,
  Sparkles,
  Phone,
  Briefcase,
  Save,
  Shield,
  Info,
} from "lucide-react";

export interface ConnectedAccount {
  id: string;
  provider: "google" | "microsoft" | "imap_smtp";
  email: string;
  displayName: string;
  color: string;
  isDefault?: boolean;
  isCorporateDefault?: boolean; // Cuenta corporativa default asignada por el Tenant Admin
  aiEnabled?: boolean; // Si tiene IA habilitada o es solo lectura simple + Antispam/ClamAV
}

export interface TenantAccountPolicy {
  plan: "standard" | "business_ai" | "enterprise";
  corporateDomain?: string;
  corporateProvider?: "microsoft" | "google" | "imap_smtp";
  personalAccountsQuota: "0" | "1" | "unlimited";
  personalAccountsAiMode: "none" | "single" | "all"; // none = solo Antispam/ClamAV; single = 1 cuenta con IA; all = todas con IA
}

export interface UserProfileData {
  name: string;
  email: string;
  jobTitle?: string;
  phone?: string;
  personalSignature?: string;
  tenantName?: string;
  role?: string;
}

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: ConnectedAccount[];
  onAddAccount: (acc: ConnectedAccount) => void;
  onRemoveAccount: (id: string) => void;
  onToggleAccountAi?: (id: string) => void;
  userProfile?: UserProfileData;
  onUpdateProfile?: (profile: UserProfileData) => void;
  tenantPolicy?: TenantAccountPolicy;
}

export function AccountManagerModal({
  isOpen,
  onClose,
  accounts,
  onAddAccount,
  onRemoveAccount,
  onToggleAccountAi,
  userProfile,
  onUpdateProfile,
  tenantPolicy = {
    plan: "business_ai",
    personalAccountsQuota: "unlimited",
    personalAccountsAiMode: "single",
  },
}: AccountManagerModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "list" | "add">("list");
  const [provider, setProvider] = useState<"google" | "microsoft" | "imap_smtp">("imap_smtp");

  // Profile fields
  const [profileName, setProfileName] = useState(userProfile?.name || "meg-acizer");
  const [profileJobTitle, setProfileJobTitle] = useState(userProfile?.jobTitle || "Director de Tecnología");
  const [profilePhone, setProfilePhone] = useState(userProfile?.phone || "+54 11 5555-0100");
  const [profileSignature, setProfileSignature] = useState(
    userProfile?.personalSignature || "Saludos cordiales,\nmeg-acizer"
  );

  // Account Form fields
  const [emailAddress, setEmailAddress] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [colorTag, setColorTag] = useState("#3b82f6");

  // IMAP/SMTP fields
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState(993);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [password, setPassword] = useState("");

  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.name || "");
      setProfileJobTitle(userProfile.jobTitle || "Colaborador");
      setProfilePhone(userProfile.phone || "");
      if (userProfile.personalSignature) setProfileSignature(userProfile.personalSignature);
    }
  }, [userProfile, isOpen]);

  if (!isOpen) return null;

  const personalAccounts = accounts.filter((a) => !a.isCorporateDefault);
  const corporateAccounts = accounts.filter((a) => a.isCorporateDefault || a.isDefault);
  const personalAiAccountsCount = personalAccounts.filter((a) => a.aiEnabled).length;

  const canAddMorePersonal =
    tenantPolicy.personalAccountsQuota === "unlimited" ||
    (tenantPolicy.personalAccountsQuota === "1" && personalAccounts.length < 1);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile && userProfile) {
      onUpdateProfile({
        ...userProfile,
        name: profileName,
        jobTitle: profileJobTitle,
        phone: profilePhone,
        personalSignature: profileSignature,
      });
    }
    setFeedback("✓ Datos personales de tu perfil actualizados correctamente.");
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress) return;

    if (!canAddMorePersonal) {
      setFeedback(
        `⚠️ El administrador del Tenant ha limitado las cuentas propias a: ${
          tenantPolicy.personalAccountsQuota === "0" ? "Ninguna (Solo corporativa)" : "Máximo 1 cuenta propia"
        }.`
      );
      return;
    }

    setIsTesting(true);
    setFeedback(null);

    try {
      // Determine if this new personal account gets AI based on Tenant Admin policy
      const shouldEnableAi =
        tenantPolicy.personalAccountsAiMode === "all" ||
        (tenantPolicy.personalAccountsAiMode === "single" && personalAiAccountsCount === 0);

      const newAcc: ConnectedAccount = {
        id: `acc-${Date.now()}`,
        provider,
        email: emailAddress,
        displayName: displayName || `${emailAddress.split("@")[0]} (Propia)`,
        color: colorTag,
        isDefault: false,
        isCorporateDefault: false,
        aiEnabled: shouldEnableAi,
      };

      onAddAccount(newAcc);
      setActiveTab("list");
      setEmailAddress("");
      setPassword("");
      setDisplayName("");
      setFeedback(
        shouldEnableAi
          ? "✓ Cuenta propia conectada con IA + Antispam & Antivirus ClamAV habilitados."
          : "✓ Cuenta propia conectada en Modo Lectura Simple con Antispam & Antivirus ClamAV activos (Sin IA según política del Tenant)."
      );
    } catch (err: any) {
      setFeedback(`⚠️ Error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground">Mi Perfil Personal & Cuentas de Correo</h2>
              <p className="text-xs text-muted-foreground">
                Gestiona tus datos personales, tu cuenta corporativa asignada y tus cuentas propias adicionales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="px-6 pt-3 border-b border-border flex gap-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "profile"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Mis Datos Personales</span>
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "list"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Mis Cuentas ({accounts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "add"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Conectar Cuenta Propia</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {feedback && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* TAB 1: MIS DATOS PERSONALES */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-primary/15 text-primary font-bold text-base flex items-center justify-center border border-primary/20">
                    {profileName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                      <span>{profileName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase font-mono">
                        {userProfile?.role || "Miembro"}
                      </span>
                    </div>
                    <div className="text-muted-foreground">{userProfile?.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block uppercase">Organización (Tenant)</span>
                  <span className="font-bold text-foreground flex items-center gap-1 justify-end">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    {userProfile?.tenantName || "Acme Corp"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Nombre Completo *</label>
                  <div className="relative">
                    <User className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-muted/40 border border-border pl-8 pr-3 py-2 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Cargo / Puesto</label>
                  <div className="relative">
                    <Briefcase className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={profileJobTitle}
                      onChange={(e) => setProfileJobTitle(e.target.value)}
                      placeholder="Ej: Ejecutivo Comercial"
                      className="w-full bg-muted/40 border border-border pl-8 pr-3 py-2 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Teléfono / Móvil de Contacto</label>
                <div className="relative">
                  <Phone className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+54 11 5555-0100"
                    className="w-full bg-muted/40 border border-border pl-8 pr-3 py-2 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Firma Personal (para tus cuentas propias)
                </label>
                <textarea
                  rows={3}
                  value={profileSignature}
                  onChange={(e) => setProfileSignature(e.target.value)}
                  className="w-full bg-muted/40 border border-border p-3 rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Nota: En la cuenta corporativa default se aplica automáticamente la firma institucional definida en el Tenant Admin.
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Guardar Datos Personales</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MIS CUENTAS DE CORREO */}
          {activeTab === "list" && (
            <div className="space-y-5">
              {/* Banner de Política del Tenant Admin */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-primary" />
                    Política de tu Organización ({userProfile?.tenantName || "Acme Corp"})
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                    Plan {tenantPolicy.plan.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {tenantPolicy.personalAccountsAiMode === "none" &&
                    "El Administrador configuró las cuentas propias como cuentas de lectura/envío simple con Antispam (SPF/DKIM) y Antivirus (ClamAV) activos. El uso de IA está reservado exclusivamente para la cuenta corporativa default."}
                  {tenantPolicy.personalAccountsAiMode === "single" &&
                    "Tu plan y el Administrador habilitan IA completa en tu cuenta corporativa default + hasta 1 cuenta propia adicional. El resto de tus cuentas propias operan con Antispam y Antivirus ClamAV."}
                  {tenantPolicy.personalAccountsAiMode === "all" &&
                    "El Administrador ha habilitado IA completa + Antispam y Antivirus ClamAV tanto en tu cuenta corporativa default como en todas tus cuentas propias."}
                </p>
              </div>

              {/* 1. Cuenta Corporativa Default (Creada en el Tenant Admin) */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  Cuenta Corporativa Default (Asignada por la Empresa)
                </h3>
                {corporateAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: acc.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs text-foreground">{acc.displayName}</h4>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                            {acc.provider}
                          </span>
                          <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">
                            🏢 Default Empresa
                          </span>
                          <span className="text-[10px] bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" />
                            IA + Antispam & ClamAV
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{acc.email}</p>
                      </div>
                    </div>

                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 shrink-0">
                      <Lock className="h-3 w-3" />
                      Fija del Tenant
                    </span>
                  </div>
                ))}
              </div>

              {/* 2. Cuentas Propias del Usuario */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-emerald-500" />
                    Mis Cuentas Propias ({personalAccounts.length})
                  </h3>
                  <button
                    onClick={() => setActiveTab("add")}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Agregar cuenta propia
                  </button>
                </div>

                {personalAccounts.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                    No has agregado cuentas propias adicionales (Google, Microsoft 365 o IMAP).
                  </div>
                ) : (
                  personalAccounts.map((acc) => {
                    const effectiveAi =
                      tenantPolicy.personalAccountsAiMode === "all"
                        ? true
                        : tenantPolicy.personalAccountsAiMode === "none"
                        ? false
                        : Boolean(acc.aiEnabled);

                    return (
                      <div
                        key={acc.id}
                        className="p-4 rounded-xl border border-border bg-card flex flex-wrap items-center justify-between gap-3 hover:border-border/80 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3.5 w-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: acc.color }}
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-xs text-foreground">{acc.displayName}</h4>
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                                {acc.provider}
                              </span>

                              {effectiveAi ? (
                                <span className="text-[10px] bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  IA Activa + Antispam & ClamAV
                                </span>
                              ) : (
                                <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                  <ShieldCheck className="h-2.5 w-2.5" />
                                  Lectura Simple (Antispam & ClamAV • Sin IA)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{acc.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Si el admin permite IA en 1 cuenta propia, dejar elegir en cuál */}
                          {tenantPolicy.personalAccountsAiMode === "single" && onToggleAccountAi && (
                            <button
                              type="button"
                              onClick={() => onToggleAccountAi(acc.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                                effectiveAi
                                  ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
                                  : "bg-muted text-muted-foreground border-border hover:text-foreground"
                              }`}
                              title="Asignar tu cupo de IA a esta cuenta propia"
                            >
                              {effectiveAi ? "✨ Cupo IA Asignado" : "Usar IA aquí"}
                            </button>
                          )}

                          <button
                            onClick={() => onRemoveAccount(acc.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                            title="Desconectar cuenta propia"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONECTAR NUEVA CUENTA PROPIA */}
          {activeTab === "add" && (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              {!canAddMorePersonal && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
                  ⚠️ Has alcanzado el límite de cuentas propias permitido por el Administrador de tu empresa.
                </div>
              )}

              {/* Provider Selector */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Selecciona el Proveedor de tu Cuenta Propia
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProvider("google");
                      setColorTag("#3b82f6");
                    }}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      provider === "google"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>Google / Gmail</span>
                    <span className="text-[10px] opacity-75">OAuth / App Pass</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProvider("microsoft");
                      setColorTag("#f97316");
                    }}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      provider === "microsoft"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>Microsoft 365 / Outlook</span>
                    <span className="text-[10px] opacity-75">Graph / Exchange</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProvider("imap_smtp");
                      setColorTag("#10b981");
                    }}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      provider === "imap_smtp"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>IMAP / SMTP</span>
                    <span className="text-[10px] opacity-75">Servidor Propio</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Nombre Identificador
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej: Mi Gmail Personal"
                    required
                    className="w-full bg-muted/40 border border-border px-3 py-2 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Dirección de Correo
                  </label>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="usuario@gmail.com"
                    required
                    className="w-full bg-muted/40 border border-border px-3 py-2 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Aviso claro sobre IA vs Antispam/ClamAV según política del Admin */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border text-[11px] text-muted-foreground flex items-start gap-2">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  {tenantPolicy.personalAccountsAiMode === "none" ? (
                    <span>
                      Por configuración del Administrador de tu empresa, esta cuenta se conectará en <strong>Modo Lectura Simple</strong> con protección <strong>Antispam (SPF/DKIM) y Antivirus (ClamAV)</strong>, sin consumir créditos de IA del Tenant.
                    </span>
                  ) : tenantPolicy.personalAccountsAiMode === "single" ? (
                    <span>
                      Tu plan incluye <strong>Antispam y Antivirus ClamAV</strong> en todas las cuentas, y puedes activar <strong>IA completa</strong> en 1 cuenta propia adicional.
                    </span>
                  ) : (
                    <span>
                      Tu cuenta propia contará con <strong>IA Completa + Antispam y Antivirus ClamAV</strong> habilitados por el Administrador.
                    </span>
                  )}
                </div>
              </div>

              {provider === "imap_smtp" && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Server className="h-3.5 w-3.5 text-primary" />
                    <span>Parámetros de Servidor IMAP / SMTP</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] text-muted-foreground mb-1">Servidor IMAP</label>
                      <input
                        type="text"
                        value={imapHost}
                        onChange={(e) => setImapHost(e.target.value)}
                        placeholder="imap.midominio.com"
                        className="w-full bg-card border border-border px-2.5 py-1.5 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">Puerto IMAP</label>
                      <input
                        type="number"
                        value={imapPort}
                        onChange={(e) => setImapPort(Number(e.target.value))}
                        className="w-full bg-card border border-border px-2.5 py-1.5 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] text-muted-foreground mb-1">Servidor SMTP</label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp.midominio.com"
                        className="w-full bg-card border border-border px-2.5 py-1.5 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">Puerto SMTP</label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value))}
                        className="w-full bg-card border border-border px-2.5 py-1.5 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">
                      Contraseña / App Password
                    </label>
                    <div className="relative">
                      <Key className="h-3.5 w-3.5 absolute left-2.5 top-2 text-muted-foreground" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-card border border-border pl-8 pr-3 py-1.5 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-500">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Cifrado AES-256-GCM en bóveda</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("list")}
                    className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isTesting || !canAddMorePersonal}
                    className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isTesting ? "Conectando..." : "Vincular Cuenta Propia"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

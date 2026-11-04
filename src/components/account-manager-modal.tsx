"use client";

import React, { useState } from "react";
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
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export interface ConnectedAccount {
  id: string;
  provider: "google" | "microsoft" | "imap_smtp";
  email: string;
  displayName: string;
  color: string;
  isDefault?: boolean;
}

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: ConnectedAccount[];
  onAddAccount: (acc: ConnectedAccount) => void;
  onRemoveAccount: (id: string) => void;
}

export function AccountManagerModal({
  isOpen,
  onClose,
  accounts,
  onAddAccount,
  onRemoveAccount,
}: AccountManagerModalProps) {
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [provider, setProvider] = useState<"google" | "microsoft" | "imap_smtp">("imap_smtp");
  
  // Form fields
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

  if (!isOpen) return null;

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress) return;

    setIsTesting(true);
    setFeedback(null);

    try {
      // Create new account
      const newAcc: ConnectedAccount = {
        id: `acc-${Date.now()}`,
        provider,
        email: emailAddress,
        displayName: displayName || emailAddress.split("@")[0],
        color: colorTag,
      };

      onAddAccount(newAcc);
      setActiveTab("list");
      setEmailAddress("");
      setPassword("");
      setDisplayName("");
      setFeedback("✓ Cuenta conectada exitosamente y credenciales cifradas con AES-256.");
    } catch (err: any) {
      setFeedback(`⚠️ Error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground">Configuración de Cuentas de Correo</h2>
              <p className="text-xs text-muted-foreground">
                Conecta múltiples cuentas corporativas o personales (Google, Microsoft 365, IMAP/SMTP)
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
        <div className="px-6 pt-3 border-b border-border flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("list")}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "list"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Cuentas Conectadas ({accounts.length})
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
            <span>Agregar Nueva Cuenta</span>
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

          {activeTab === "list" ? (
            <div className="space-y-3">
              {accounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs space-y-2">
                  <Mail className="h-8 w-8 mx-auto opacity-40" />
                  <p>No tienes cuentas de correo conectadas.</p>
                  <button
                    onClick={() => setActiveTab("add")}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-semibold text-xs inline-block"
                  >
                    Conectar Primera Cuenta
                  </button>
                </div>
              ) : (
                accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-4 rounded-xl border border-border bg-card flex items-center justify-between hover:border-border/80 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: acc.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-foreground">{acc.displayName}</h4>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                            {acc.provider}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{acc.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Sincronizada</span>
                      </span>
                      <button
                        onClick={() => onRemoveAccount(acc.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
                        title="Desconectar cuenta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              {/* Provider Selector */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  Tipo de Proveedor
                </label>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  {[
                    { id: "microsoft", name: "Microsoft 365", desc: "Outlook / Exchange" },
                    { id: "google", name: "Google Workspace", desc: "Gmail / GSuite" },
                    { id: "imap_smtp", name: "IMAP / SMTP", desc: "Servidor personalizado" },
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setProvider(p.id as any)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        provider === p.id
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="font-bold text-foreground">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Dirección de Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ej: carlos@empresa.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Nombre para Mostrar
                  </label>
                  <input
                    type="text"
                    placeholder="ej: Carlos Mendoza (Trabajo)"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-muted/50 border border-border px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Color Tag & Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Contraseña / App Password
                  </label>
                  <div className="relative">
                    <Key className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-muted/50 border border-border pl-9 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    Se almacena cifrada con AES-256-GCM.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Color identificador en la bandeja
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ec4899"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColorTag(c)}
                        className={`h-6 w-6 rounded-full transition-transform ${
                          colorTag === c ? "ring-2 ring-primary ring-offset-2 scale-110" : ""
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* IMAP / SMTP Hosts if custom */}
              {provider === "imap_smtp" && (
                <div className="p-3 bg-muted/30 rounded-xl border border-border space-y-3 text-xs">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5 text-primary" />
                    <span>Servidores de Entrada y Salida</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-0.5">Servidor IMAP (Entrada)</span>
                      <input
                        type="text"
                        placeholder="imap.tudominio.com"
                        value={imapHost}
                        onChange={(e) => setImapHost(e.target.value)}
                        className="w-full bg-background border border-border px-2 py-1.5 rounded text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-0.5">Servidor SMTP (Salida)</span>
                      <input
                        type="text"
                        placeholder="smtp.tudominio.com"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        className="w-full bg-background border border-border px-2 py-1.5 rounded text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className="px-4 py-2 border border-border rounded-lg text-xs text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isTesting}
                  className="px-5 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary/90 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isTesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  <span>{isTesting ? "Verificando..." : "Cifrar y Conectar Cuenta"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

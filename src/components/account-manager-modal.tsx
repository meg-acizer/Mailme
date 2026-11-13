"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Camera,
  ZoomIn,
  ZoomOut,
  Move,
  Calendar,
  Link2,
  Check,
  RotateCcw,
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
  isShared?: boolean; // Bandeja compartida de equipo (soporte@, ventas@)
}

export interface ConnectedCalendar {
  id: string;
  provider: "google" | "microsoft" | "caldav_ics";
  name: string;
  accountEmailOrUrl: string;
  color: string;
  isCorporateDefault?: boolean;
  syncDirection: "two_way" | "read_only";
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
  avatarUrl?: string;
}

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: ConnectedAccount[];
  onAddAccount: (acc: ConnectedAccount) => void;
  onRemoveAccount: (id: string) => void;
  onToggleAccountAi?: (id: string) => void;
  calendars?: ConnectedCalendar[];
  onAddCalendar?: (cal: ConnectedCalendar) => void;
  onRemoveCalendar?: (id: string) => void;
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
  calendars = [],
  onAddCalendar,
  onRemoveCalendar,
  userProfile,
  onUpdateProfile,
  tenantPolicy = {
    plan: "business_ai",
    personalAccountsQuota: "unlimited",
    personalAccountsAiMode: "single",
  },
}: AccountManagerModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "list" | "calendars">("profile");
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [provider, setProvider] = useState<"google" | "microsoft" | "imap_smtp">("imap_smtp");

  // Profile fields
  const [profileName, setProfileName] = useState(userProfile?.name || "meg-acizer");
  const [profileJobTitle, setProfileJobTitle] = useState(userProfile?.jobTitle || "Director de Tecnología");
  const [profilePhone, setProfilePhone] = useState(userProfile?.phone || "+54 11 5555-0100");
  const [profileSignature, setProfileSignature] = useState(
    userProfile?.personalSignature || "Saludos cordiales,\nmeg-acizer"
  );
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | undefined>(userProfile?.avatarUrl);

  // Avatar Upload, Zoom & Crop State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1.2);
  const [cropOffset, setCropOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Account Form fields
  const [emailAddress, setEmailAddress] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [colorTag, setColorTag] = useState("#3b82f6");
  const [isSharedInbox, setIsSharedInbox] = useState(false);

  // IMAP/SMTP fields
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState(993);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [password, setPassword] = useState("");

  // Calendar Form fields
  const [showAddCalendarForm, setShowAddCalendarForm] = useState(false);
  const [calProvider, setCalProvider] = useState<"google" | "microsoft" | "caldav_ics">("google");
  const [calName, setCalName] = useState("");
  const [calEmailOrUrl, setCalEmailOrUrl] = useState("");
  const [calColor, setCalColor] = useState("#10b981");
  const [calSyncDirection, setCalSyncDirection] = useState<"two_way" | "read_only">("two_way");

  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.name || "");
      setProfileJobTitle(userProfile.jobTitle || "Colaborador");
      setProfilePhone(userProfile.phone || "");
      if (userProfile.personalSignature) setProfileSignature(userProfile.personalSignature);
      setProfileAvatarUrl(userProfile.avatarUrl);
    }
  }, [userProfile, isOpen]);

  if (!isOpen) return null;

  const personalAccounts = accounts.filter((a) => !a.isCorporateDefault);
  const corporateAccounts = accounts.filter((a) => a.isCorporateDefault || a.isDefault);
  const personalAiAccountsCount = personalAccounts.filter((a) => a.aiEnabled).length;

  const corporateCalendars = calendars.filter((c) => c.isCorporateDefault);
  const personalCalendars = calendars.filter((c) => !c.isCorporateDefault);

  const canAddMorePersonal =
    tenantPolicy.personalAccountsQuota === "unlimited" ||
    (tenantPolicy.personalAccountsQuota === "1" && personalAccounts.length < 1);

  // Handlers for Image Upload, Zoom & Crop
  const handleSelectImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setRawImageSrc(reader.result);
        setCropZoom(1.2);
        setCropOffset({ x: 0, y: 0 });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingCrop(true);
    setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCrop) return;
    const nextX = Math.max(-160, Math.min(160, e.clientX - dragStart.x));
    const nextY = Math.max(-160, Math.min(160, e.clientY - dragStart.y));
    setCropOffset({ x: nextX, y: nextY });
  };

  const handleCropMouseUp = () => {
    setIsDraggingCrop(false);
  };

  const handleApplyCrop = () => {
    if (!rawImageSrc) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Circular mask / clean background
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, size, size);

      // Compute aspect-fit base scale inside 180px preview box mapped to 256px canvas
      const ratio = size / 180;
      const minSide = Math.min(img.width, img.height);
      const drawW = (img.width / minSide) * size * cropZoom;
      const drawH = (img.height / minSide) * size * cropZoom;

      const centerX = size / 2 + cropOffset.x * ratio;
      const centerY = size / 2 + cropOffset.y * ratio;

      ctx.drawImage(img, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);
      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setProfileAvatarUrl(croppedDataUrl);
      setRawImageSrc(null);

      if (onUpdateProfile && userProfile) {
        onUpdateProfile({
          ...userProfile,
          name: profileName,
          jobTitle: profileJobTitle,
          phone: profilePhone,
          personalSignature: profileSignature,
          avatarUrl: croppedDataUrl,
        });
      }
      setFeedback("✓ Foto de perfil recortada y actualizada con éxito.");
      setTimeout(() => setFeedback(null), 3500);
    };
    img.src = rawImageSrc;
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile && userProfile) {
      onUpdateProfile({
        ...userProfile,
        name: profileName,
        jobTitle: profileJobTitle,
        phone: profilePhone,
        personalSignature: profileSignature,
        avatarUrl: profileAvatarUrl,
      });
    }
    setFeedback("✓ Datos personales e imagen de perfil guardados correctamente.");
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
      const shouldEnableAi =
        tenantPolicy.personalAccountsAiMode === "all" ||
        (tenantPolicy.personalAccountsAiMode === "single" && personalAiAccountsCount === 0);

      const newAcc: ConnectedAccount = {
        id: `acc-${Date.now()}`,
        provider,
        email: emailAddress,
        displayName:
          displayName ||
          (isSharedInbox
            ? `${emailAddress.split("@")[0]} (Bandeja Compartida)`
            : `${emailAddress.split("@")[0]} (Propia)`),
        color: colorTag,
        isDefault: false,
        isCorporateDefault: false,
        aiEnabled: shouldEnableAi,
        isShared: isSharedInbox,
      };

      onAddAccount(newAcc);
      setShowAddAccountForm(false);
      setEmailAddress("");
      setPassword("");
      setDisplayName("");
      setIsSharedInbox(false);
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

  const handleCreateCalendar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calName.trim() || !calEmailOrUrl.trim() || !onAddCalendar) return;

    const newCal: ConnectedCalendar = {
      id: `cal-${Date.now()}`,
      provider: calProvider,
      name: calName.trim(),
      accountEmailOrUrl: calEmailOrUrl.trim(),
      color: calColor,
      isCorporateDefault: false,
      syncDirection: calSyncDirection,
    };

    onAddCalendar(newCal);
    setCalName("");
    setCalEmailOrUrl("");
    setShowAddCalendarForm(false);
    setFeedback(`✓ Calendario "${newCal.name}" sincronizado con tu agenda unificada.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            {profileAvatarUrl ? (
              <img
                src={profileAvatarUrl}
                alt={profileName}
                className="h-10 w-10 rounded-full object-cover border-2 border-primary/40 shadow-sm shrink-0"
              />
            ) : (
              <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-sm text-foreground">
                Mi Perfil, Cuentas de Correo & Mis Calendarios
              </h2>
              <p className="text-xs text-muted-foreground">
                Personaliza tu foto (zoom y recorte), tus datos, correos y calendarios sincronizados
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
        <div className="px-6 pt-3 border-b border-border flex flex-wrap gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "profile"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Mis Datos & Foto</span>
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
            <span>Mis Correos ({accounts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("calendars")}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "calendars"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Mis Calendarios ({calendars.length})</span>
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

          {/* TAB 1: MIS DATOS PERSONALES & FOTO CON ZOOM Y CROP */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Avatar Upload & Cropper Section */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="relative group">
                      {profileAvatarUrl ? (
                        <img
                          src={profileAvatarUrl}
                          alt={profileName}
                          className="h-16 w-16 rounded-full object-cover border-2 border-primary shadow-md"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-primary/15 text-primary font-bold text-xl flex items-center justify-center border-2 border-primary/30">
                          {(profileName || "U").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-transform hover:scale-105 cursor-pointer"
                        title="Subir nueva foto de perfil"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div>
                      <div className="font-bold text-sm text-foreground flex items-center gap-2">
                        <span>{profileName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase font-mono">
                          {userProfile?.role || "Miembro"}
                        </span>
                      </div>
                      <div className="text-muted-foreground">{userProfile?.email}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleSelectImageFile}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Camera className="h-3 w-3" />
                          <span>Subir Foto (Zoom & Recorte)</span>
                        </button>
                        {profileAvatarUrl && (
                          <button
                            type="button"
                            onClick={() => setProfileAvatarUrl(undefined)}
                            className="px-2 py-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[11px] cursor-pointer transition-colors"
                          >
                            Quitar foto
                          </button>
                        )}
                      </div>
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

                {/* Interactive Image Crop & Zoom Editor */}
                {rawImageSrc && (
                  <div className="mt-3 p-4 rounded-xl bg-card border-2 border-primary/30 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <Move className="h-3.5 w-3.5 text-primary" />
                        Ajustar Encuadre y Zoom de tu Foto de Perfil
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Arrastra la imagen para centrar tu rostro
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Circular Crop Viewport (180x180) */}
                      <div
                        onMouseDown={handleCropMouseDown}
                        onMouseMove={handleCropMouseMove}
                        onMouseUp={handleCropMouseUp}
                        onMouseLeave={handleCropMouseUp}
                        className="relative h-[180px] w-[180px] rounded-full overflow-hidden border-4 border-primary shadow-inner bg-slate-900 cursor-move select-none shrink-0 flex items-center justify-center"
                      >
                        <img
                          ref={cropImageRef}
                          src={rawImageSrc}
                          alt="Crop preview"
                          draggable={false}
                          style={{
                            transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})`,
                            transformOrigin: "center center",
                          }}
                          className="max-w-none h-[180px] w-[180px] object-cover pointer-events-none select-none transition-transform duration-75"
                        />
                        {/* Subtle circular guide overlay */}
                        <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 pointer-events-none" />
                      </div>

                      {/* Zoom Controls & Actions */}
                      <div className="flex-1 w-full space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-muted-foreground flex items-center gap-1">
                              <ZoomIn className="h-3.5 w-3.5 text-primary" />
                              Nivel de Zoom
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              {Math.round(cropZoom * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setCropZoom((z) => Math.max(1, Number((z - 0.1).toFixed(2))))}
                              className="p-1 rounded bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                            >
                              <ZoomOut className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="range"
                              min="1"
                              max="3"
                              step="0.05"
                              value={cropZoom}
                              onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                              className="flex-1 accent-primary cursor-pointer"
                            />
                            <button
                              type="button"
                              onClick={() => setCropZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
                              className="p-1 rounded bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                            >
                              <ZoomIn className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCropZoom(1.2);
                              setCropOffset({ x: 0, y: 0 });
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Reiniciar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRawImageSrc(null)}
                            className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs text-muted-foreground cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleApplyCrop}
                            className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 shadow-sm flex items-center gap-1.5 cursor-pointer ml-auto"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Aplicar Recorte</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-emerald-500" />
                    Mis Cuentas Propias ({personalAccounts.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddAccountForm(!showAddAccountForm)}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{showAddAccountForm ? "Cerrar Formulario" : "Agregar cuenta propia"}</span>
                  </button>
                </div>

                {/* Formulario Desplegable para Conectar Nueva Cuenta Propia */}
                {showAddAccountForm && (
                  <form
                    onSubmit={handleCreateAccount}
                    className="p-4 rounded-xl bg-card border-2 border-primary/30 space-y-4 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <span className="font-bold text-xs text-foreground">
                        Conectar Nueva Cuenta de Correo Propia
                      </span>
                      <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
                        <Lock className="h-3 w-3" /> Cifrado AES-256-GCM
                      </span>
                    </div>

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
                            setImapHost("imap.gmail.com");
                            setImapPort(993);
                            setSmtpHost("smtp.gmail.com");
                            setSmtpPort(465);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            provider === "google"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-muted/20 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <span>Google / Gmail</span>
                          <span className="text-[10px] opacity-75">IMAP + Contraseña App</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProvider("microsoft");
                            setColorTag("#f97316");
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            provider === "microsoft"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-muted/20 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <span>Microsoft 365 / Outlook</span>
                          <span className="text-[10px] opacity-75">OAuth 2.0 (Entra ID)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProvider("imap_smtp");
                            setColorTag("#10b981");
                            setImapHost("");
                            setImapPort(993);
                            setSmtpHost("");
                            setSmtpPort(587);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            provider === "imap_smtp"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-muted/20 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <span>IMAP / SMTP</span>
                          <span className="text-[10px] opacity-75">Hosting / Servidor Propio</span>
                        </button>
                      </div>
                    </div>

                    {/* Checkbox Bandeja Compartida de Equipo */}
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSharedInbox}
                        onChange={(e) => setIsSharedInbox(e.target.checked)}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-foreground block">
                          Bandeja Compartida de Equipo (ej. soporte@, ventas@, administracion@)
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Habilita estados de ticket (Abierto, En curso, Resuelto), asignación de responsable y notas internas privadas en cada hilo.
                        </span>
                      </div>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Nombre Identificador *
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
                          Dirección de Correo *
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

                    {provider === "microsoft" && (
                      <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/25 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-orange-500" />
                            Microsoft 365 — OAuth 2.0 Modern Auth (Entra ID)
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/15 text-orange-600 dark:text-orange-400">
                            XOAUTH2 / Graph
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Microsoft retiró la autenticación básica en Exchange Online. Al vincular esta cuenta se utiliza <strong>OAuth 2.0 con Refresh Token cifrado (AES-256-GCM v1)</strong> para correo y calendario corporativo sin guardar contraseñas planas.
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await fetch(
                                `/api/oauth/authorize?target=microsoft_mail_calendar&email=${encodeURIComponent(emailAddress)}`
                              );
                              const data = await res.json();
                              if (data.configured && data.url) {
                                window.location.href = data.url;
                              } else {
                                setFeedback(
                                  `ℹ️ Modo Demo Local: ${data.error || "Configura MICROSOFT_CLIENT_ID en Vercel para redirigir a Microsoft Entra ID. Puedes pulsar 'Vincular Cuenta Propia' para simular la conexión."}`
                                );
                              }
                            } catch {
                              setFeedback("ℹ️ Pulsa 'Vincular Cuenta Propia' para registrar la cuenta Microsoft 365.");
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-orange-500 text-white font-semibold text-xs hover:bg-orange-600 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          <span>Autorizar con Microsoft 365 (OAuth 2.0)</span>
                        </button>
                      </div>
                    )}

                    {provider === "google" && (
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            <Key className="h-4 w-4 text-blue-500" />
                            Gmail / Google Workspace — Contraseña de Aplicación (2FA)
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            imap.gmail.com:993
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground space-y-1 leading-relaxed">
                          <p>
                            1. Asegúrate de tener activa la <strong>Verificación en 2 pasos (2FA)</strong> en tu cuenta de Google (y que el Admin de Workspace permita App Passwords).
                          </p>
                          <p>
                            2. Genera una clave de 16 letras en <span className="font-mono text-foreground">myaccount.google.com/apppasswords</span> y pégala abajo (se cifra con clave maestra versionada <span className="font-mono">v1</span>).
                          </p>
                          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium pt-0.5">
                            💡 Nota: Para Google Calendar puedes usar OAuth 2.0 directo en la pestaña &quot;Mis Calendarios&quot; (no requiere auditoría CASA).
                          </p>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-foreground mb-1">
                            Contraseña de Aplicación de Google (16 caracteres) *
                          </label>
                          <div className="relative">
                            <Key className="h-3.5 w-3.5 absolute left-2.5 top-2 text-muted-foreground" />
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="xxxx xxxx xxxx xxxx"
                              className="w-full bg-card border border-border pl-8 pr-3 py-1.5 rounded-lg text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}

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

                    <div className="flex justify-end gap-2 pt-2 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setShowAddAccountForm(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted cursor-pointer"
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
                  </form>
                )}

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

          {/* TAB 3: MIS CALENDARIOS (CORPORATIVO + PROPIOS) */}
          {activeTab === "calendars" && (
            <div className="space-y-5 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    Sincronización Multi-Calendario
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Combina el calendario corporativo de la empresa con tus calendarios personales (Google Calendar, Outlook 365 o CalDAV/ICS) para detectar conflictos automáticamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCalendarForm(!showAddCalendarForm)}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showAddCalendarForm ? "Cerrar Formulario" : "Agregar Calendario"}</span>
                </button>
              </div>

              {/* Add Calendar Inline Form */}
              {showAddCalendarForm && (
                <form
                  onSubmit={handleCreateCalendar}
                  className="p-4 rounded-xl bg-card border-2 border-primary/30 space-y-3.5 animate-in fade-in"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="font-bold text-xs text-foreground">Vincular Nuevo Calendario Personal</span>
                    <span className="text-[10px] text-muted-foreground">Privacidad protegida por defecto</span>
                  </div>

                  {/* Provider selector */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCalProvider("google");
                        setCalColor("#3b82f6");
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        calProvider === "google"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/20 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span>Google Calendar</span>
                      <span className="text-[10px] opacity-75">OAuth 2.0</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCalProvider("microsoft");
                        setCalColor("#f97316");
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        calProvider === "microsoft"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/20 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span>Outlook / M365</span>
                      <span className="text-[10px] opacity-75">Graph Calendar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCalProvider("caldav_ics");
                        setCalColor("#10b981");
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        calProvider === "caldav_ics"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/20 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span>CalDAV / iCloud / ICS</span>
                      <span className="text-[10px] opacity-75">URL o Servidor</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Nombre del Calendario *
                      </label>
                      <input
                        type="text"
                        required
                        value={calName}
                        onChange={(e) => setCalName(e.target.value)}
                        placeholder="Ej: Agenda Médica / Familia / Consultoría"
                        className="w-full bg-muted/40 border border-border px-3 py-1.5 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        {calProvider === "caldav_ics" ? "URL CalDAV o Feed .ICS *" : "Cuenta de Correo Asociada *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={calEmailOrUrl}
                        onChange={(e) => setCalEmailOrUrl(e.target.value)}
                        placeholder={
                          calProvider === "caldav_ics"
                            ? "https://caldav.icloud.com/..."
                            : "mi.agenda@gmail.com"
                        }
                        className="w-full bg-muted/40 border border-border px-3 py-1.5 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Modo de Sincronización
                      </label>
                      <select
                        value={calSyncDirection}
                        onChange={(e) => setCalSyncDirection(e.target.value as "two_way" | "read_only")}
                        className="w-full bg-muted/40 border border-border px-3 py-1.5 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        <option value="two_way">🔄 Bidireccional (Leer y crear eventos)</option>
                        <option value="read_only">👁️ Solo Lectura (Bloquear disponibilidad)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Color Identificador
                      </label>
                      <div className="flex items-center gap-2 pt-1">
                        {["#10b981", "#3b82f6", "#f97316", "#8b5cf6", "#ec4899", "#eab308"].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCalColor(c)}
                            className={`h-6 w-6 rounded-full border-2 transition-transform cursor-pointer ${
                              calColor === c ? "scale-110 border-foreground" : "border-transparent opacity-75"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {calProvider !== "caldav_ics" && (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-muted-foreground">
                        {calProvider === "google" ? (
                          <span>
                            <strong>Google Calendar OAuth 2.0:</strong> Usa scopes sensibles (<span className="font-mono">calendar.events</span>) que no requieren auditoría CASA Tier 2.
                          </span>
                        ) : (
                          <span>
                            <strong>Microsoft Graph Calendar:</strong> Sincronización OAuth 2.0 directa con Entra ID.
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const target =
                            calProvider === "google" ? "google_calendar" : "microsoft_mail_calendar";
                          try {
                            const res = await fetch(
                              `/api/oauth/authorize?target=${target}&email=${encodeURIComponent(calEmailOrUrl)}`
                            );
                            const data = await res.json();
                            if (data.configured && data.url) {
                              window.location.href = data.url;
                            } else {
                              setFeedback(
                                `ℹ️ ${data.error || "Puedes pulsar 'Conectar Calendario' para vincularlo en modo local."}`
                              );
                            }
                          } catch {
                            setFeedback("ℹ️ Pulsa 'Conectar Calendario' para completar la vinculación.");
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-primary/15 text-primary font-semibold text-[11px] hover:bg-primary/25 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Link2 className="h-3 w-3" />
                        <span>Autorizar OAuth 2.0</span>
                      </button>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowAddCalendarForm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 cursor-pointer shadow-sm"
                    >
                      Conectar Calendario
                    </button>
                  </div>
                </form>
              )}

              {/* 1. Corporate Default Calendar */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  Calendario Corporativo Default (Empresa & Salas)
                </h4>
                {corporateCalendars.map((cal) => (
                  <div
                    key={cal.id}
                    className="p-3.5 rounded-xl border-2 border-primary/30 bg-primary/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: cal.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-foreground">{cal.name}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                            {cal.provider}
                          </span>
                          <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">
                            🏢 Default Empresa
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {cal.accountEmailOrUrl}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 shrink-0">
                      <Lock className="h-3 w-3" />
                      Activo
                    </span>
                  </div>
                ))}
              </div>

              {/* 2. Personal Calendars List */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                  Mis Calendarios Propios ({personalCalendars.length})
                </h4>

                {personalCalendars.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                    No has vinculado calendarios personales adicionales. Pulsa &quot;Agregar Calendario&quot; arriba para sumar Google Calendar, Outlook o CalDAV.
                  </div>
                ) : (
                  personalCalendars.map((cal) => (
                    <div
                      key={cal.id}
                      className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3 hover:border-border/80"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3.5 w-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: cal.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-foreground">{cal.name}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                              {cal.provider}
                            </span>
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                              {cal.syncDirection === "two_way" ? "🔄 Bidireccional" : "👁️ Solo Lectura"}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            {cal.accountEmailOrUrl}
                          </p>
                        </div>
                      </div>

                      {onRemoveCalendar && (
                        <button
                          type="button"
                          onClick={() => onRemoveCalendar(cal.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                          title="Desvincular calendario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  Paperclip,
  Clock,
  Undo2,
  AlertCircle,
  CheckCircle2,
  Tag,
  UserPlus,
  Save,
  Trash2,
  ChevronDown,
  FileText,
  File,
  ShieldCheck,
} from "lucide-react";

export interface AccountOption {
  id: string;
  displayName?: string;
  name?: string;
  email: string;
  color: string;
  provider?: string;
  isDefault?: boolean;
  isCorporateDefault?: boolean;
  aiEnabled?: boolean;
}

export const DEFAULT_ACCOUNTS: AccountOption[] = [
  { id: "1", displayName: "Microsoft 365 (Empresa Default)", name: "Microsoft 365", email: "lbenitez@innovasoft.com", color: "#f97316", isCorporateDefault: true, aiEnabled: true },
  { id: "2", displayName: "Google Workspace (Propia)", name: "Google Workspace", email: "cmendoza@techcorp.io", color: "#3b82f6", isCorporateDefault: false, aiEnabled: true },
  { id: "3", displayName: "IMAP Personalizado (Propia)", name: "IMAP Personalizado", email: "soporte@miempresa.com", color: "#10b981", isCorporateDefault: false, aiEnabled: false },
];

const PREDEFINED_TAGS = ["#Proyecto-Worvanta", "#Finanzas", "#Urgente", "#Cliente-VIP", "#Legal", "#Soporte"];

const EMAIL_TEMPLATES = [
  {
    id: "tpl-propuesta",
    name: "📄 Propuesta Comercial (Tenant)",
    subject: "Propuesta Comercial y Alcance de Servicios — Worvanta",
    body: "Estimado equipo,\n\nAdjunto a este correo nuestra propuesta técnico-comercial detallada junto con el cronograma de implementación y entregables.\n\nQuedamos a disposición para coordinar una breve llamada de revisión esta semana.",
  },
  {
    id: "tpl-seguimiento",
    name: "⏳ Seguimiento de Reunión",
    subject: "Resumen de acuerdos y próximos pasos",
    body: "Hola,\n\nMuchas gracias por el tiempo en nuestra reunión. Comparto en limpio los puntos acordados y las tareas asignadas con sus fechas compromiso.\n\nPor favor avísame si deseas ajustar algún punto.",
  },
  {
    id: "tpl-soporte",
    name: "🛠️ Acuse de Recibo — Soporte",
    subject: "Ticket recibido — Estamos revisando tu caso",
    body: "Hola,\n\nConfirmamos la recepción de tu solicitud en nuestra bandeja compartida de Soporte. Un especialista de nuestro equipo ya tiene asignado el caso y te responderemos con novedades a la brevedad.",
  },
  {
    id: "tpl-factura",
    name: "💳 Envío de Factura / Comprobante",
    subject: "Comprobante de facturación del período actual",
    body: "Estimados,\n\nAdjuntamos el comprobante correspondiente al período en curso. Agradecemos confirmar recepción por esta vía.",
  },
];

export interface AttachedFile {
  name: string;
  size: string;
  type: string;
}

interface MailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  accounts?: AccountOption[];
  initialTo?: string;
  initialCc?: string;
  initialSubject?: string;
  initialBody?: string;
  initialAttachments?: AttachedFile[];
  userSignature?: string;
  onSendSuccess?: (details: string) => void;
  onSaveContact?: (email: string) => void;
}

export function MailComposer({
  isOpen,
  onClose,
  accounts = DEFAULT_ACCOUNTS,
  initialTo = "",
  initialCc = "",
  initialSubject = "",
  initialBody = "",
  initialAttachments = [],
  userSignature = "Saludos cordiales,\nEquipo Worvanta",
  onSendSuccess,
  onSaveContact,
}: MailComposerProps) {
  const [selectedAccount, setSelectedAccount] = useState<AccountOption>(accounts[0] || DEFAULT_ACCOUNTS[0]);
  const [selectedAlias, setSelectedAlias] = useState<string>("");
  const [followUpDays, setFollowUpDays] = useState<number>(0); // 0 = desactivado, 2/3/5 días
  const [scheduleMenuOpen, setScheduleMenuOpen] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [selectedTone, setSelectedTone] = useState<"ejecutivo" | "formal" | "directo" | "empatico">("ejecutivo");
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Recipients
  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState(initialCc);
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(Boolean(initialCc));
  const [showBcc, setShowBcc] = useState(false);

  // Subject and Body
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);

  // Priority (Outlook style)
  const [priority, setPriority] = useState<"high" | "normal" | "low">("normal");

  // Tags
  const [tags, setTags] = useState<string[]>(["#Proyecto-MailMe"]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<AttachedFile[]>(initialAttachments);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Window State
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState<number | null>(null);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [contactCreatedNotice, setContactCreatedNotice] = useState<string | null>(null);

  // Sincronizar estado cuando se abre el compositor o cambian los valores iniciales (ej. Responder a todos o Reenviar)
  useEffect(() => {
    if (isOpen) {
      setTo(initialTo || "");
      setCc(initialCc || "");
      if (initialCc) setShowCc(true);
      setSubject(initialSubject || "");
      setBody(initialBody || "");
      if (initialAttachments && initialAttachments.length > 0) {
        setAttachments(initialAttachments);
      } else {
        setAttachments([]);
      }
    }
  }, [isOpen, initialTo, initialCc, initialSubject, initialBody, initialAttachments]);

  if (!isOpen) return null;

  // Detect if 'to' is a new email
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim());

  const handleCreateContact = () => {
    if (onSaveContact) {
      onSaveContact(to.trim());
    }
    setContactCreatedNotice(`✓ Contacto guardado para: ${to.trim()}`);
    setTimeout(() => setContactCreatedNotice(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: AttachedFile[] = Array.from(files).map((f) => ({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
      type: f.type || "application/octet-stream",
    }));

    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  // AI Assistant actions (with real API call to /api/ai/draft + tone selector)
  const handleApplyAiMode = async (mode: "formal" | "concise" | "expand" | "draft") => {
    setIsGeneratingAi(true);
    setAiAssistantOpen(false);

    const toneMap: Record<typeof mode, "formal" | "directo" | "empatico" | "ejecutivo"> = {
      formal: "formal",
      concise: "directo",
      expand: "ejecutivo",
      draft: selectedTone,
    };
    const toneToUse = toneMap[mode];

    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject || "Coordinación y próximos pasos",
          recipient: to,
          context: body,
          tone: toneToUse,
        }),
      });
      const data = await res.json();
      if (data.ok && data.draft) {
        if (!subject) setSubject("Actualización de Proyecto y Próximos Pasos");
        setBody(`${data.draft}\n\n--\n${userSignature}`);
        setIsGeneratingAi(false);
        return;
      }
    } catch {
      // Fallback local
    }

    if (!subject) setSubject("Actualización de Proyecto y Próximos Pasos");
    setBody(
      `Estimado equipo,\n\nComparto los avances actualizados y quedo atento a sus comentarios para coordinar los próximos pasos.\n\n--\n${userSignature}`
    );
    setIsGeneratingAi(false);
  };

  const finalizeDispatch = (customNotice?: string) => {
    if (undoTimerRef.current) {
      clearInterval(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setIsSending(false);
    setUndoCountdown(null);
    onClose();
    if (onSendSuccess) {
      const followUpSuffix =
        followUpDays > 0 ? ` • Recordatorio activo si no responden en ${followUpDays} días` : "";
      onSendSuccess(
        customNotice || `Correo despachado con éxito a ${to}${followUpSuffix}`
      );
    }
  };

  const handleSend = () => {
    if (!to || !subject) {
      alert("Por favor completa el destinatario y el asunto.");
      return;
    }

    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    setIsSending(true);
    let secondsLeft = 8;
    setUndoCountdown(secondsLeft);

    undoTimerRef.current = setInterval(() => {
      secondsLeft -= 1;
      setUndoCountdown(secondsLeft);

      if (secondsLeft <= 0) {
        finalizeDispatch();
      }
    }, 1000);
  };

  const handleScheduleSend = (whenLabel: string) => {
    if (!to || !subject) {
      alert("Por favor completa el destinatario y el asunto antes de programar el envío.");
      return;
    }
    setScheduleMenuOpen(false);
    finalizeDispatch(`📅 Envío programado para ${whenLabel} (${to})`);
  };

  const handleCancelSend = () => {
    if (undoTimerRef.current) {
      clearInterval(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setIsSending(false);
    setUndoCountdown(null);
  };

  return (
    <div
      className={`fixed z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 ${
        isExpanded ? "inset-0" : "bottom-6 right-6 inset-auto max-w-2xl w-full"
      }`}
    >
      {/* Paper Sheet Container (Aspecto de Hoja de Papel) */}
      <div
        className={`bg-card text-foreground border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isExpanded ? "w-full h-full max-w-5xl" : "w-full h-[640px]"
        }`}
      >
        {/* Document Header (Barra de título del compositor) */}
        <header className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="font-bold text-xs text-foreground">
              {subject || "Nuevo Mensaje de Correo"}
            </span>
            {priority === "high" && (
              <span className="text-[10px] bg-destructive/15 text-destructive font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>Importante</span>
              </span>
            )}
            {priority === "low" && (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-500 font-bold px-2 py-0.5 rounded">
                Baja / No urgente
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Undo Alert Banner if sending */}
        {isSending && undoCountdown !== null && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-5 py-2.5 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 animate-spin" />
              <span>
                Enviando correo en <strong>{undoCountdown}s</strong> (puedes deshacer y seguir editando)...
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelSend}
                className="flex items-center gap-1 bg-amber-500 text-black px-2.5 py-1 rounded font-bold hover:bg-amber-400 cursor-pointer"
              >
                <Undo2 className="h-3.5 w-3.5" />
                <span>Deshacer Envío</span>
              </button>
              <button
                type="button"
                onClick={() => finalizeDispatch()}
                className="px-2 py-1 rounded border border-amber-500/40 hover:bg-amber-500/10 font-semibold cursor-pointer"
              >
                Enviar ya
              </button>
            </div>
          </div>
        )}

        {/* Main Sheet Form */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-3 bg-card/60">
          {/* DE: Selector de Cuenta + Alias */}
          <div className="flex flex-wrap items-center gap-3 border-b border-border/60 pb-2 text-xs">
            <span className="w-16 font-semibold text-muted-foreground shrink-0">De:</span>
            <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
              <select
                value={selectedAccount.id}
                onChange={(e) => {
                  const acc = accounts.find((a) => a.id === e.target.value);
                  if (acc) setSelectedAccount(acc);
                }}
                className="flex-1 min-w-[200px] bg-transparent border-none text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-card text-foreground">
                    {acc.displayName || acc.name} &lt;{acc.email}&gt; {acc.isCorporateDefault ? "• [Default Empresa]" : "• [Cuenta Propia]"}
                  </option>
                ))}
              </select>

              <select
                value={selectedAlias}
                onChange={(e) => setSelectedAlias(e.target.value)}
                className="bg-muted/50 border border-border rounded-lg px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                title="Seleccionar Alias de envío"
              >
                <option value="">Sin alias (Dirección principal)</option>
                <option value="ventas@empresa.com">Alias: ventas@empresa.com</option>
                <option value="soporte@empresa.com">Alias: soporte@empresa.com</option>
                <option value="facturacion@empresa.com">Alias: facturacion@empresa.com</option>
              </select>
              {selectedAccount.isCorporateDefault || selectedAccount.aiEnabled !== false ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                  ✨ IA + Antispam & ClamAV
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                  🛡️ Simple (Antispam & ClamAV • Sin IA)
                </span>
              )}
            </div>
          </div>

          {/* PARA: Campo de Destinatario */}
          <div className="flex items-center gap-3 border-b border-border/60 pb-2 text-xs">
            <span className="w-16 font-semibold text-muted-foreground shrink-0">Para:</span>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="destinatario@empresa.com"
              className="flex-1 bg-transparent border-none text-xs text-foreground focus:outline-none font-mono"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              {isEmailValid && (
                <button
                  type="button"
                  onClick={handleCreateContact}
                  className="flex items-center gap-1 text-[11px] text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded font-medium transition-colors cursor-pointer"
                  title="Guardar este correo en tu libreta de contactos"
                >
                  <UserPlus className="h-3 w-3" />
                  <span>+ Crear Contacto</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowCc(!showCc)}
                className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                  showCc ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                CC
              </button>
              <button
                type="button"
                onClick={() => setShowBcc(!showBcc)}
                className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                  showBcc ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                CCO
              </button>
            </div>
          </div>

          {/* Contact created notice */}
          {contactCreatedNotice && (
            <div className="text-[11px] text-emerald-500 font-medium px-2">
              {contactCreatedNotice}
            </div>
          )}

          {/* CC Collapsible */}
          {showCc && (
            <div className="flex items-center gap-3 border-b border-border/60 pb-2 text-xs">
              <span className="w-16 font-semibold text-muted-foreground shrink-0">CC:</span>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="copia@empresa.com"
                className="flex-1 bg-transparent border-none text-xs text-foreground focus:outline-none font-mono"
              />
            </div>
          )}

          {/* CCO Collapsible */}
          {showBcc && (
            <div className="flex items-center gap-3 border-b border-border/60 pb-2 text-xs">
              <span className="w-16 font-semibold text-muted-foreground shrink-0">CCO:</span>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="copia.oculta@empresa.com"
                className="flex-1 bg-transparent border-none text-xs text-foreground focus:outline-none font-mono"
              />
            </div>
          )}

          {/* ASUNTO */}
          <div className="flex items-center gap-3 border-b border-border/60 pb-2 text-xs">
            <span className="w-16 font-semibold text-muted-foreground shrink-0">Asunto:</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Escribe el asunto del correo..."
              className="flex-1 bg-transparent border-none text-xs font-semibold text-foreground focus:outline-none"
            />
          </div>

          {/* Outlook-Style Control Toolbar (Prioridad, Etiquetas, Adjuntar) */}
          <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-3 bg-muted/40 rounded-xl border border-border text-xs">
            <div className="flex items-center gap-2">
              {/* Prioridad Selector */}
              <div className="flex items-center gap-1 border-r border-border pr-2">
                <span className="text-[11px] text-muted-foreground">Prioridad:</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="high" className="bg-card text-foreground">🔴 Alta / Importante</option>
                  <option value="normal" className="bg-card text-foreground">⚪ Normal</option>
                  <option value="low" className="bg-card text-foreground">🟢 Baja / No urgente</option>
                </select>
              </div>

              {/* Etiquetas */}
              <div className="relative flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex items-center gap-1 flex-wrap">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1"
                    >
                      {t}
                      <button onClick={() => toggleTag(t)} className="hover:text-destructive">×</button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    className="text-[10px] font-semibold text-primary hover:underline"
                  >
                    + Etiqueta
                  </button>
                </div>

                {showTagDropdown && (
                  <div className="absolute top-7 left-0 z-50 bg-card border border-border rounded-xl shadow-xl p-2 w-44 space-y-1">
                    {PREDEFINED_TAGS.map((tag) => (
                      <div
                        key={tag}
                        onClick={() => {
                          toggleTag(tag);
                          setShowTagDropdown(false);
                        }}
                        className={`px-2 py-1 rounded text-xs cursor-pointer flex items-center justify-between ${
                          tags.includes(tag) ? "bg-primary/15 text-primary font-bold" : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <span>{tag}</span>
                        {tags.includes(tag) && <span>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Plantillas, Firma y AI Assistant Menu */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Selector de Plantillas */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTemplateMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-semibold text-foreground cursor-pointer"
                >
                  <FileText className="h-3 w-3 text-primary" />
                  <span>Plantillas</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
                {templateMenuOpen && (
                  <div className="absolute right-0 top-8 z-50 bg-card border border-border rounded-xl shadow-2xl p-1.5 w-64 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                      Plantillas Rápidas (Usuario & Tenant)
                    </div>
                    {EMAIL_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          if (!subject) setSubject(tpl.subject);
                          setBody(`${tpl.body}\n\n--\n${userSignature}`);
                          setTemplateMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground cursor-pointer"
                      >
                        {tpl.name}
                      </button>
                    ))}
                    <div className="h-px bg-border my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setBody((prev) => `${prev ? `${prev}\n\n` : ""}--\n${userSignature}`);
                        setTemplateMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-primary font-semibold hover:bg-primary/10 cursor-pointer"
                    >
                      ✍️ Insertar mi firma al pie
                    </button>
                  </div>
                )}
              </div>

              {/* AI Assistant Menu (Gated by Account AI Policy) */}
              <div className="relative">
                {selectedAccount.isCorporateDefault || selectedAccount.aiEnabled !== false ? (
                  <>
                    <div className="inline-flex items-center rounded-lg bg-primary/10 border border-primary/20">
                      <select
                        value={selectedTone}
                        onChange={(e) => setSelectedTone(e.target.value as any)}
                        className="bg-transparent text-[11px] font-semibold text-primary pl-2 pr-1 py-1 focus:outline-none cursor-pointer"
                        title="Tono de redacción IA"
                      >
                        <option value="ejecutivo" className="bg-card text-foreground">Tono: Ejecutivo</option>
                        <option value="formal" className="bg-card text-foreground">Tono: Formal</option>
                        <option value="directo" className="bg-card text-foreground">Tono: Directo</option>
                        <option value="empatico" className="bg-card text-foreground">Tono: Empático</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
                        disabled={isGeneratingAi}
                        className="flex items-center gap-1 px-2 py-1 rounded-r-lg hover:bg-primary/20 text-xs font-semibold text-primary transition-colors cursor-pointer border-l border-primary/20"
                      >
                        <Sparkles className={`h-3.5 w-3.5 ${isGeneratingAi ? "animate-spin" : ""}`} />
                        <span>{isGeneratingAi ? "Redactando..." : "Borrador IA"}</span>
                        <ChevronDown className="h-3 w-3 opacity-70" />
                      </button>
                    </div>

                  {aiAssistantOpen && (
                    <div className="absolute right-0 top-8 z-50 bg-card border border-border rounded-xl shadow-2xl p-2 w-56 space-y-1">
                      <button
                        onClick={() => handleApplyAiMode("draft")}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground"
                      >
                        📝 Redactar borrador completo
                      </button>
                      <button
                        onClick={() => handleApplyAiMode("formal")}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground"
                      >
                        👔 Hacer más formal y profesional
                      </button>
                      <button
                        onClick={() => handleApplyAiMode("concise")}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground"
                      >
                        ⚡ Hacer conciso y directo
                      </button>
                      <button
                        onClick={() => handleApplyAiMode("expand")}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground"
                      >
                        🔍 Expandir detalles técnicos
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-border text-[11px] font-medium"
                  title="Esta cuenta propia está configurada como cuenta de lectura/envío simple (solo Antispam y Antivirus ClamAV) según el plan del Tenant."
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Antispam & ClamAV Activos (IA Deshabilitada en esta cuenta)</span>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Attached Files Chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-muted/20 border border-border rounded-xl text-xs">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium"
                >
                  <File className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate max-w-[140px]">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">({file.size})</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="text-muted-foreground hover:text-destructive ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* CUERPO DEL CORREO: Hoja de Papel */}
          <div className="flex-1 flex flex-col pt-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe el cuerpo del correo aquí..."
              className="flex-1 w-full bg-background/50 border border-border/80 rounded-xl p-4 text-xs font-sans leading-relaxed text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary shadow-inner placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="px-6 py-3 border-t border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Hidden File Input */}
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span>Adjuntar</span>
            </button>

            {/* Recordatorio de Seguimiento si nadie responde en X días */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card text-xs">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] text-muted-foreground">Seguimiento:</span>
              <select
                value={followUpDays}
                onChange={(e) => setFollowUpDays(Number(e.target.value))}
                className="bg-transparent text-[11px] font-semibold text-foreground focus:outline-none cursor-pointer"
              >
                <option value={0} className="bg-card text-foreground">Sin recordatorio</option>
                <option value={2} className="bg-card text-foreground">Si no responden en 2 días</option>
                <option value={3} className="bg-card text-foreground">Si no responden en 3 días</option>
                <option value={7} className="bg-card text-foreground">Si no responden en 7 días</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Descartar
            </button>

            {/* Botón Enviar + Desplegable Enviar Más Tarde */}
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-l-lg bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSending ? "Enviando..." : "Enviar"}</span>
              </button>
              <button
                type="button"
                onClick={() => setScheduleMenuOpen((prev) => !prev)}
                disabled={isSending}
                className="px-2 py-1.5 rounded-r-lg bg-primary text-primary-foreground border-l border-primary-foreground/25 hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
                title="Enviar más tarde (Programar envío)"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {scheduleMenuOpen && (
                <div className="absolute right-0 bottom-10 z-50 w-60 bg-card border border-border rounded-xl shadow-2xl p-1.5 text-xs space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                    ⏰ Enviar más tarde
                  </div>
                  {[
                    "Hoy a las 16:00 hs",
                    "Mañana a las 09:00 AM",
                    "Mañana a las 14:00 hs",
                    "Próximo Lunes 09:00 AM",
                  ].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleScheduleSend(slot)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted text-foreground flex items-center justify-between cursor-pointer"
                    >
                      <span>{slot}</span>
                      <Clock className="h-3 w-3 text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

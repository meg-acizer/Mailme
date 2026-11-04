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
} from "lucide-react";

export interface AccountOption {
  id: string;
  displayName?: string;
  name?: string;
  email: string;
  color: string;
  provider?: string;
  isDefault?: boolean;
}

export const DEFAULT_ACCOUNTS: AccountOption[] = [
  { id: "1", displayName: "Microsoft 365", name: "Microsoft 365", email: "lbenitez@innovasoft.com", color: "#f97316" },
  { id: "2", displayName: "Google Workspace", name: "Google Workspace", email: "cmendoza@techcorp.io", color: "#3b82f6" },
  { id: "3", displayName: "IMAP Personalizado", name: "IMAP Personalizado", email: "soporte@miempresa.com", color: "#10b981" },
];

const PREDEFINED_TAGS = ["#Proyecto-MailMe", "#Finanzas", "#Urgente", "#Cliente-VIP", "#Legal", "#Soporte"];

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
  onSendSuccess,
  onSaveContact,
}: MailComposerProps) {
  const [selectedAccount, setSelectedAccount] = useState<AccountOption>(accounts[0] || DEFAULT_ACCOUNTS[0]);
  
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

  // AI Assistant actions
  const handleApplyAiMode = (mode: "formal" | "concise" | "expand" | "draft") => {
    setIsGeneratingAi(true);
    setAiAssistantOpen(false);

    setTimeout(() => {
      if (mode === "formal") {
        setBody((prev) => `Estimado/a,\n\nEspero que este mensaje le encuentre bien. En relación a lo conversado, procedo a formalizar los detalles correspondientes:\n\n${prev || "Detalles de la propuesta adjunta."}\n\nQuedo a su entera disposición ante cualquier consulta.\n\nAtentamente,\nEquipo MailMe`);
      } else if (mode === "concise") {
        setBody((prev) => `Hola,\n\nComparto resumen puntual de avance:\n• Confirmación de términos acordados.\n• Próxima revisión agendada para esta semana.\n\nAvísame si tienes comentarios.\nSaludos.`);
      } else if (mode === "expand") {
        setBody((prev) => `${prev}\n\nAdicionalmente, hemos verificado las condiciones técnicas y financieras requeridas por su equipo, asegurando cumplimiento total de los estándares estipulados.`);
      } else if (mode === "draft") {
        if (!subject) setSubject("Actualización de Proyecto y Próximos Pasos");
        setBody(`Estimado equipo,\n\nAdjunto los detalles acordados para la etapa de cierre de año. En el archivo se detalla el desglose por rubro y los plazos de entrega estimados para cada entregable.\n\n¿Tendrán disponibilidad el jueves a las 15:00 hs para revisar estos puntos en una llamada de 45 minutos?\n\nSaludos cordiales,\n${selectedAccount.displayName || "MailMe"}`);
      }
      setIsGeneratingAi(false);
    }, 600);
  };

  const handleSend = () => {
    if (!to || !subject) {
      alert("Por favor completa el destinatario y el asunto.");
      return;
    }

    setIsSending(true);
    let secondsLeft = 10;
    setUndoCountdown(secondsLeft);

    const timer = setInterval(() => {
      secondsLeft -= 1;
      setUndoCountdown(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(timer);
        setIsSending(false);
        setUndoCountdown(null);
        onClose();
        if (onSendSuccess) {
          onSendSuccess(`Correo despachado con éxito a ${to}`);
        }
      }
    }, 1000);
  };

  const handleCancelSend = () => {
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
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-5 py-2.5 flex items-center justify-between text-xs text-amber-500">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 animate-spin" />
              <span>
                Enviando correo en <strong>{undoCountdown}s</strong>...
              </span>
            </div>
            <button
              onClick={handleCancelSend}
              className="flex items-center gap-1 bg-amber-500 text-black px-2.5 py-1 rounded font-bold hover:bg-amber-400 cursor-pointer"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Deshacer Envío</span>
            </button>
          </div>
        )}

        {/* Main Sheet Form */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-3 bg-card/60">
          {/* DE: Selector de Cuenta */}
          <div className="flex items-center gap-3 border-b border-border/60 pb-2 text-xs">
            <span className="w-16 font-semibold text-muted-foreground shrink-0">De:</span>
            <div className="flex-1 relative">
              <select
                value={selectedAccount.id}
                onChange={(e) => {
                  const acc = accounts.find((a) => a.id === e.target.value);
                  if (acc) setSelectedAccount(acc);
                }}
                className="w-full bg-transparent border-none text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-card text-foreground">
                    {acc.displayName || acc.name} &lt;{acc.email}&gt;
                  </option>
                ))}
              </select>
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

            {/* AI Assistant Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
                disabled={isGeneratingAi}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className={`h-3.5 w-3.5 ${isGeneratingAi ? "animate-spin" : ""}`} />
                <span>{isGeneratingAi ? "Generando con IA..." : "Ayuda IA"}</span>
                <ChevronDown className="h-3 w-3 opacity-70" />
              </button>

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
        <footer className="px-6 py-3 border-t border-border bg-muted/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span>Adjuntar archivo</span>
            </button>

            <button
              type="button"
              onClick={() => alert("Borrador guardado localmente.")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Guardar Borrador</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="flex items-center gap-1.5 px-5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSending ? "Enviando..." : "Enviar Correo"}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

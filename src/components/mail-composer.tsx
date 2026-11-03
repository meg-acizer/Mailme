"use client";

import React, { useState } from "react";
import { X, Maximize2, Minimize2, Send, Sparkles, Paperclip, Clock, Undo2 } from "lucide-react";

interface AccountOption {
  id: string;
  name: string;
  email: string;
  color: string;
}

const mockAccounts: AccountOption[] = [
  { id: "1", name: "Google Workspace", email: "cmendoza@techcorp.io", color: "#3b82f6" },
  { id: "2", name: "Microsoft 365", email: "lbenitez@innovasoft.com", color: "#f97316" },
  { id: "3", name: "IMAP Servidor", email: "soporte@miempresa.com", color: "#10b981" },
];

interface MailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  onSendSuccess?: (details: string) => void;
}

export function MailComposer({
  isOpen,
  onClose,
  initialTo = "",
  initialSubject = "",
  initialBody = "",
  onSendSuccess,
}: MailComposerProps) {
  const [selectedAccount, setSelectedAccount] = useState<AccountOption>(mockAccounts[0]);
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleImproveWithAI = () => {
    if (!body) return;
    setBody((prev) => `${prev}\n\n[Texto pulido y formalizado automáticamente por la IA de MailMe]`);
  };

  const handleSend = () => {
    if (!to || !subject) {
      alert("Por favor completa el destinatario y el asunto.");
      return;
    }

    // Start 10-second undo window
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
          onSendSuccess(`Correo enviado exitosamente a ${to}`);
        }
      }
    }, 1000);

    (window as unknown as { _undoTimer?: NodeJS.Timeout })._undoTimer = timer;
  };

  const handleCancelSend = () => {
    const timer = (window as unknown as { _undoTimer?: NodeJS.Timeout })._undoTimer;
    if (timer) {
      clearInterval(timer);
    }
    setIsSending(false);
    setUndoCountdown(null);
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-200 bg-card border border-border shadow-2xl flex flex-col ${
        isExpanded
          ? "inset-6 rounded-xl"
          : "bottom-4 right-6 w-[560px] h-[520px] rounded-xl"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-foreground">Mensaje Nuevo</span>
          {undoCountdown !== null && (
            <span className="text-[11px] bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-full font-medium animate-pulse">
              Enviando en {undoCountdown}s...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-muted hover:text-foreground"
            title={isExpanded ? "Minimizar" : "Pantalla completa"}
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted hover:text-foreground"
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Account Selector */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 text-xs">
        <span className="text-muted-foreground w-12">De:</span>
        <div className="flex items-center gap-2 flex-1">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: selectedAccount.color }}
          />
          <select
            value={selectedAccount.id}
            onChange={(e) => {
              const acc = mockAccounts.find((a) => a.id === e.target.value);
              if (acc) setSelectedAccount(acc);
            }}
            className="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer flex-1"
          >
            {mockAccounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-card text-foreground">
                {acc.name} &lt;{acc.email}&gt;
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recipient */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 text-xs">
        <span className="text-muted-foreground w-12">Para:</span>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="destinatario@empresa.com"
          className="flex-1 bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Subject */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 text-xs">
        <span className="text-muted-foreground w-12">Asunto:</span>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Asunto del correo..."
          className="flex-1 bg-transparent font-medium focus:outline-none text-foreground placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Body Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribe tu mensaje aquí..."
          className="w-full h-full bg-transparent resize-none focus:outline-none text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Footer / Actions */}
      <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between rounded-b-xl">
        <div className="flex items-center gap-2">
          {undoCountdown !== null ? (
            <button
              onClick={handleCancelSend}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 shadow-sm transition-all"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Deshacer Envío ({undoCountdown}s)</span>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Enviar</span>
            </button>
          )}

          <button
            onClick={handleImproveWithAI}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-primary bg-primary/10 hover:bg-primary/20 text-xs font-medium transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Mejorar con IA</span>
          </button>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          <button className="p-1.5 rounded hover:bg-muted" title="Adjuntar archivo">
            <Paperclip className="h-4 w-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-muted" title="Programar envío">
            <Clock className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

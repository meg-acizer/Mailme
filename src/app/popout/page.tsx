"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { WorvantaLogo } from "@/components/ui/worvanta-logo";
import {
  ShieldCheck,
  Sparkles,
  Paperclip,
  Download,
  Printer,
  X,
  Reply,
  ReplyAll,
  Forward,
  Sun,
  Moon,
  Clock,
  ExternalLink,
  MessageSquare,
  CheckCircle,
} from "lucide-react";

interface EmailItem {
  id: string;
  senderName: string;
  senderEmail: string;
  account: { name: string; color: string };
  subject: string;
  preview?: string;
  aiSummary: string;
  time: string;
  priority?: "high" | "normal" | "low";
  tags?: string[];
  to?: string[];
  cc?: string[];
  attachments?: Array<{ name: string; size: string; type: string }>;
  extractedData?: {
    meeting?: string;
    invoice?: string;
  };
}

export default function PopoutEmailPage() {
  const [email, setEmail] = useState<EmailItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("worvanta_floating_email");
      if (stored) {
        setEmail(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error reading stored floating email", e);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    window.close();
  };

  const handleDownloadAttachment = (fileName: string) => {
    const blob = new Blob([`Contenido del archivo: ${fileName}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setActionNotice(`Descargando archivo: ${fileName}`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  if (!mounted) return null;

  if (!email) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <WorvantaLogo size={36} showWordmark={true} />
        <p className="mt-4 text-sm text-muted-foreground">
          No se encontró información del correo. Abre un correo desde la aplicación de Worvanta para visualizarlo aquí.
        </p>
        <button
          onClick={handleClose}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 cursor-pointer"
        >
          Cerrar Ventana
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 text-foreground flex flex-col selection:bg-primary/20">
      {/* Top Floating Window Control Bar */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <WorvantaLogo size={24} showWordmark={true} wordmarkClassName="font-bold text-sm tracking-tight text-foreground" />
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
            Ventana Flotante
          </span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: email.account.color }}
          >
            {email.account.name}
          </span>
        </div>

        {/* Window Actions */}
        <div className="flex items-center gap-2">
          {actionNotice && (
            <span className="text-xs text-emerald-500 font-medium animate-fadeIn">
              {actionNotice}
            </span>
          )}

          <button
            onClick={handlePrint}
            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            title="Imprimir correo"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer"
            title="Cambiar tema"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs transition-colors cursor-pointer flex items-center gap-1 font-semibold"
            title="Cerrar ventana flotante"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cerrar</span>
          </button>
        </div>
      </header>

      {/* Main Mail Paper Canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8">
        <article className="bg-card text-foreground border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col">
          {/* 1. Slim Capsule Header */}
          <div className="px-6 py-2.5 bg-muted/30 border-b border-border/60 flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase">Prioridad:</span>
              <span className="font-semibold text-foreground">
                {email.priority === "high"
                  ? "🔴 Alta / Importante"
                  : email.priority === "low"
                  ? "🟢 Baja / No urgente"
                  : "⚪ Normal"}
              </span>

              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-emerald-500/20 ml-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>SPF/DKIM Verificado</span>
              </div>
            </div>

            {/* AI Summary in Capsule */}
            <div className="flex items-center gap-1.5 text-primary text-[11px] truncate max-w-md">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="font-bold shrink-0">IA:</span>
              <span className="text-muted-foreground truncate">{email.aiSummary}</span>
            </div>
          </div>

          {/* 2. Document Header: Subject, De, Para, CC, Tags */}
          <div className="px-8 pt-6 pb-4 border-b border-border/60 space-y-3.5 bg-card">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-foreground tracking-tight leading-snug">
                {email.subject}
              </h1>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setActionNotice("Respondiendo en ventana principal...");
                    setTimeout(() => setActionNotice(null), 3000);
                  }}
                  className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 cursor-pointer transition-colors"
                >
                  <Reply className="h-3.5 w-3.5" />
                  <span>Responder</span>
                </button>
              </div>
            </div>

            {/* Sender & Recipients */}
            <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground w-12 shrink-0">DE:</span>
                <span className="font-bold text-foreground text-sm">{email.senderName}</span>
                <span className="text-muted-foreground">&lt;{email.senderEmail}&gt;</span>
                <span className="ml-auto text-muted-foreground font-mono text-[11px] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {email.time}
                </span>
              </div>

              {email.to && email.to.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground w-12 shrink-0">PARA:</span>
                  <span className="truncate">{email.to.join(", ")}</span>
                </div>
              )}

              {email.cc && email.cc.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground w-12 shrink-0">CC:</span>
                  <span className="truncate">{email.cc.join(", ")}</span>
                </div>
              )}

              {email.tags && email.tags.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="font-semibold text-foreground w-12 shrink-0">TAGS:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {email.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Paper Sheet Body */}
          <div className="p-8 sm:p-10 space-y-6 text-foreground text-sm leading-relaxed min-h-[280px]">
            <p>Estimado equipo,</p>
            <p>
              Adjunto los detalles acordados para la etapa de cierre de año. En el archivo se detalla el desglose por rubro y los plazos de entrega estimados para cada entregable.
            </p>
            <p>
              ¿Tendrán disponibilidad el <strong>jueves a las 15:00 hs</strong> para revisar estos puntos en una llamada de 45 minutos?
            </p>
            <p className="pt-4">
              Saludos cordiales,<br />
              <strong>{email.senderName}</strong>
            </p>
          </div>

          {/* 4. Attachments Section */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="px-8 py-5 border-t border-border/60 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                  Archivos Adjuntos ({email.attachments.length})
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Escaneado por ClamAV: Limpio
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {email.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-card border border-border rounded-xl flex items-center justify-between shadow-xs hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                        <Paperclip className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-xs text-foreground truncate">{att.name}</p>
                        <p className="text-[10px] text-muted-foreground">{att.size} • Verificado</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadAttachment(att.name)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Descargar archivo"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Footer Suggested Replies */}
          <div className="px-8 py-4 border-t border-border/60 bg-muted/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Respuestas sugeridas por IA:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActionNotice("Respuesta seleccionada: Aceptar reunión")}
                className="px-3 py-1 rounded-full border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer font-medium"
              >
                ✓ Aceptar reunión
              </button>
              <button
                onClick={() => setActionNotice("Respuesta seleccionada: Pedir más detalles")}
                className="px-3 py-1 rounded-full border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer font-medium"
              >
                ℹ Pedir más detalles
              </button>
              <button
                onClick={() => setActionNotice("Respuesta seleccionada: Proponer alternativa")}
                className="px-3 py-1 rounded-full border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer font-medium"
              >
                ⏱ Proponer alternativa
              </button>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}

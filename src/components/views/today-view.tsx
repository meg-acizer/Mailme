"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Calendar,
  CheckSquare,
  Inbox,
  ArrowRight,
  Clock,
  ShieldCheck,
  Zap,
  Target,
  RefreshCw,
} from "lucide-react";

interface TodayViewProps {
  userName: string;
  onNavigateToMail: () => void;
  onNavigateToCalendar: () => void;
  onOpenComposer: (to?: string, subject?: string) => void;
}

export function TodayView({
  userName,
  onNavigateToMail,
  onNavigateToCalendar,
  onOpenComposer,
}: TodayViewProps) {
  const [focusMode, setFocusMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [briefingText, setBriefingText] = useState(
    "Tienes 2 reuniones programadas hoy (la más próxima a las 15:00 hs con Carlos Mendoza) y 1 correo de alta prioridad esperando tu respuesta sobre el presupuesto de Q4. Dispones de un bloque libre de 2 horas entre las 11:30 y 13:30 para concentrarte en tus tareas prioritarias."
  );

  const handleRefreshBriefing = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setBriefingText(
        "Agenda al día: Se verificó la disponibilidad en tus 3 calendarios (Google y Microsoft). No hay conflictos de horario para hoy. Te sugerimos responder a Laura Benítez antes del mediodía."
      );
      setIsRefreshing(false);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto p-8 select-none">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Welcome Greeting & Focus Mode Switch */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Buenos días, {userName}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aquí tienes tu resumen inteligente consolidado de hoy.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                focusMode
                  ? "bg-amber-500 text-white border-amber-600 shadow-md"
                  : "bg-card border-border hover:bg-muted text-foreground"
              }`}
            >
              <Target className="h-4 w-4" />
              <span>{focusMode ? "Modo Foco Activo" : "Activar Modo Foco"}</span>
            </button>
          </div>
        </div>

        {/* AI Morning Briefing Card */}
        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-card border border-primary/25 rounded-2xl p-6 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>Morning Briefing • Asistente MailMe IA</span>
            </div>
            <button
              onClick={handleRefreshBriefing}
              disabled={isRefreshing}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              <span>Actualizar</span>
            </button>
          </div>

          <p className="text-sm leading-relaxed text-foreground/90 font-medium">
            {briefingText}
          </p>

          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              0 Conflictos de agenda detectados
            </span>
            <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Próximo evento: 15:00 hs (en 4 horas)
            </span>
          </div>
        </div>

        {/* 2-Column Grid: Today's Schedule + Priority Emails */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column A: Agenda de Hoy */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Calendar className="h-4 w-4 text-emerald-500" />
                <span>Agenda de Hoy</span>
              </div>
              <button
                onClick={onNavigateToCalendar}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver calendario</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">Revisión Técnica Q4</div>
                  <div className="text-[11px] text-muted-foreground">Con Carlos Mendoza (Google Meet)</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-500">15:00 - 15:45</span>
                  <div className="text-[10px] text-muted-foreground">Google Calendar</div>
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl border border-border/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">All-Hands de Equipo</div>
                  <div className="text-[11px] text-muted-foreground">Toda la organización (Acme Corp)</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-purple-500">18:00 - 19:00</span>
                  <div className="text-[10px] text-muted-foreground">Outlook Trabajo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Column B: Correos con Acción Requerida (Triage) */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Inbox className="h-4 w-4 text-blue-500" />
                <span>Acción Requerida (Triage IA)</span>
              </div>
              <button
                onClick={onNavigateToMail}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver bandeja</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Carlos Mendoza</span>
                  <span className="text-[10px] bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded font-bold">
                    Acción Urgente
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  Propuesta comercial Q4 y coordinación de reunión técnica
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() =>
                      onOpenComposer("cmendoza@techcorp.io", "Re: Propuesta comercial Q4")
                    }
                    className="px-2.5 py-1 bg-primary text-primary-foreground rounded-lg text-[11px] font-semibold hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    Responder ahora
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Tasks & Time Blocking Row */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2 font-bold text-xs">
              <CheckSquare className="h-4 w-4 text-purple-500" />
              <span>Tareas Clave de Hoy (Time-Blocking)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-muted/30 rounded-xl border border-border/60 flex items-start gap-2.5">
              <input type="checkbox" className="mt-0.5 accent-primary cursor-pointer" />
              <div>
                <div className="font-semibold text-foreground">Revisar presupuesto Q4</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Asignado a bloque 11:30 - 12:30</div>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-xl border border-border/60 flex items-start gap-2.5">
              <input type="checkbox" className="mt-0.5 accent-primary cursor-pointer" />
              <div>
                <div className="font-semibold text-foreground">Enviar minutas de reunión</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Generado por IA listo para revisión</div>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-xl border border-border/60 flex items-start gap-2.5">
              <input type="checkbox" className="mt-0.5 accent-primary cursor-pointer" />
              <div>
                <div className="font-semibold text-foreground">Configurar Bot de Telegram</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Pendiente de verificación de token</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

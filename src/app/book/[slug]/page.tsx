"use client";

import React, { useState, use } from "react";
import { Calendar, Clock, CheckCircle2, User, Mail, MessageSquare, ShieldCheck, Video } from "lucide-react";
import { WorvantaLogo } from "@/components/ui/worvanta-logo";

const AVAILABLE_DAYS = [
  { id: "jue-14", label: "Jueves 14 Nov", slots: ["10:00 hs", "11:30 hs", "15:00 hs", "16:30 hs"] },
  { id: "vie-15", label: "Viernes 15 Nov", slots: ["09:30 hs", "11:00 hs", "14:00 hs"] },
  { id: "lun-18", label: "Lunes 18 Nov", slots: ["10:00 hs", "12:00 hs", "15:30 hs", "17:00 hs"] },
];

export default function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [selectedDay, setSelectedDay] = useState(AVAILABLE_DAYS[0].id);
  const [selectedSlot, setSelectedSlot] = useState("15:00 hs");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const currentDayObj = AVAILABLE_DAYS.find((d) => d.id === selectedDay) || AVAILABLE_DAYS[0];

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim()) return;
    setConfirmed(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <WorvantaLogo size={24} showWordmark={true} wordmarkClassName="font-bold text-sm" />
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
              Agenda Pública Inteligente
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Disponibilidad verificada en tiempo real
          </span>
        </div>

        {confirmed ? (
          <div className="p-10 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              ¡Reunión confirmada y agendada!
            </h1>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Enviamos la invitación <span className="font-mono">.ics</span> y el enlace de videollamada a{" "}
              <strong className="text-foreground">{guestEmail}</strong> para el{" "}
              <strong className="text-foreground">
                {currentDayObj.label} a las {selectedSlot}
              </strong>.
            </p>
            <div className="pt-2">
              <a
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                Volver a Worvanta Workspace
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Columna Izquierda: Info del Anfitrión */}
            <div className="md:col-span-2 p-6 bg-muted/15 space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-primary font-bold">
                  /{slug}
                </span>
                <h1 className="text-lg font-bold text-foreground mt-1">
                  Sesión de Coordinación & Producto
                </h1>
                <p className="text-muted-foreground mt-1 leading-relaxed">
                  Elige un horario libre en la agenda unificada (sincronizada con calendario corporativo y personal sin exponer detalles privados).
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Duración: <strong>30 minutos</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-emerald-500" />
                  <span>Enlace de videollamada automático</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>Invitación .ICS inmediata por correo</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Selección de Día, Hora y Datos */}
            <form onSubmit={handleConfirm} className="md:col-span-3 p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-2">
                  1. Selecciona el Día
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AVAILABLE_DAYS.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => {
                        setSelectedDay(day.id);
                        setSelectedSlot(day.slots[0]);
                      }}
                      className={`p-2.5 rounded-xl border text-center font-semibold cursor-pointer transition-all ${
                        selectedDay === day.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-2">
                  2. Horarios Disponibles ({currentDayObj.label})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {currentDayObj.slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-3 rounded-lg border font-mono text-xs cursor-pointer transition-all ${
                        selectedSlot === slot
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                          : "bg-muted/30 border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Tu Nombre *
                  </label>
                  <div className="relative">
                    <User className="h-3.5 w-3.5 absolute left-2.5 top-2 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Nombre y Apellido"
                      className="w-full bg-muted/40 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Tu Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="h-3.5 w-3.5 absolute left-2.5 top-2 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="nombre@empresa.com"
                      className="w-full bg-muted/40 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Motivo o temas a conversar (opcional)
                </label>
                <div className="relative">
                  <MessageSquare className="h-3.5 w-3.5 absolute left-2.5 top-2 text-muted-foreground" />
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Revisión de propuesta comercial y alcance Q4"
                    className="w-full bg-muted/40 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 shadow-md cursor-pointer"
                >
                  Confirmar Reunión ({currentDayObj.label} • {selectedSlot})
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

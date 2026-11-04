"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Video,
  AlertTriangle,
  Link as LinkIcon,
  Check,
  Copy,
  CalendarCheck2,
} from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  account: string;
  accountColor: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  isConflict?: boolean;
}

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "Sincronización Semanal de Producto",
    account: "corporativo@empresa.com",
    accountColor: "bg-blue-600",
    start: new Date(new Date().setHours(9, 30, 0, 0)),
    end: new Date(new Date().setHours(10, 30, 0, 0)),
    location: "Google Meet",
    attendees: ["carlos@empresa.com", "laura@empresa.com"],
  },
  {
    id: "evt-2",
    title: "Revisión de Presupuesto Q4 con Dirección",
    account: "corporativo@empresa.com",
    accountColor: "bg-blue-600",
    start: new Date(new Date().setHours(14, 0, 0, 0)),
    end: new Date(new Date().setHours(15, 0, 0, 0)),
    location: "Sala de Conferencias B",
    attendees: ["direccion@empresa.com"],
  },
  {
    id: "evt-3",
    title: "Reunión de Consulta Médica (Personal)",
    account: "personal@gmail.com",
    accountColor: "bg-emerald-600",
    start: new Date(new Date().setHours(14, 30, 0, 0)),
    end: new Date(new Date().setHours(15, 30, 0, 0)),
    isConflict: true,
  },
  {
    id: "evt-4",
    title: "Demo Técnica con Cliente Delta",
    account: "ventas@empresa.com",
    accountColor: "bg-purple-600",
    start: new Date(new Date().setHours(16, 30, 0, 0)),
    end: new Date(new Date().setHours(17, 15, 0, 0)),
    location: "Microsoft Teams",
    attendees: ["contacto@delta.com"],
  },
];

export function CalendarView() {
  const [viewMode, setViewMode] = useState<"week" | "day" | "availability">("week");
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // New Event Form
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStart, setNewEventStart] = useState("11:00");
  const [newEventEnd, setNewEventEnd] = useState("12:00");
  const [newEventAccount, setNewEventAccount] = useState("corporativo@empresa.com");

  const handleCopyBookingLink = () => {
    navigator.clipboard.writeText("https://mailme.app/book/mi-organizacion/mgonzalez");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddEvent = () => {
    if (!newEventTitle) return;
    const [startH, startM] = newEventStart.split(":").map(Number);
    const [endH, endM] = newEventEnd.split(":").map(Number);

    const s = new Date();
    s.setHours(startH, startM, 0, 0);

    const e = new Date();
    e.setHours(endH, endM, 0, 0);

    const newEvt: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: newEventTitle,
      account: newEventAccount,
      accountColor: newEventAccount.includes("personal") ? "bg-emerald-600" : "bg-blue-600",
      start: s,
      end: e,
      location: "Google Meet",
    };

    setEvents((prev) => [...prev, newEvt]);
    setIsNewModalOpen(false);
    setNewEventTitle("");
  };

  const conflicts = events.filter((e) => e.isConflict);

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Calendario Unificado</h1>
            <p className="text-xs text-muted-foreground">
              Agregación multi-cuenta con detección nativa de disponibilidad y conflictos
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === "week"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === "day"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setViewMode("availability")}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
                viewMode === "availability"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarCheck2 className="h-3.5 w-3.5" />
              <span>Link de Reservas</span>
            </button>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nuevo Evento</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Calendar or Booking config */}
        {viewMode === "availability" ? (
          <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto space-y-6">
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Motor Nativo de Disponibilidad</h2>
                  <p className="text-sm text-muted-foreground">
                    Comparte tu enlace de reservas estilo Calendly 100% autohospedado en MailMe sin depender de servicios externos.
                  </p>
                </div>
                <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                  Activo
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/50 border border-border flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-mono text-foreground truncate">
                  <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">https://mailme.app/book/mi-organizacion/mgonzalez</span>
                </div>
                <button
                  onClick={handleCopyBookingLink}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center space-x-1.5 shrink-0"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? "Copiado" : "Copiar Enlace"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Cuentas a considerar para ocupado
                  </label>
                  <div className="space-y-1.5 text-xs text-foreground">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded accent-primary" />
                      <span>corporativo@empresa.com (Microsoft 365)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded accent-primary" />
                      <span>personal@gmail.com (Google Calendar)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded accent-primary" />
                      <span>ventas@empresa.com (IMAP / CalDAV)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Duración & Intervalos
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block mb-1">Duración estándar</span>
                      <select className="w-full bg-background border border-border rounded p-1.5 text-foreground">
                        <option>30 minutos</option>
                        <option>45 minutos</option>
                        <option>60 minutos</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Buffer entre citas</span>
                      <select className="w-full bg-background border border-border rounded p-1.5 text-foreground">
                        <option>10 minutos</option>
                        <option>15 minutos</option>
                        <option>Sin buffer</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Horario laboral disponible</h3>
              <div className="space-y-2 text-xs">
                {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map((day) => (
                  <div key={day} className="flex items-center justify-between py-1 border-b border-border/50">
                    <span className="font-medium text-foreground w-28">{day}</span>
                    <span className="text-muted-foreground font-mono">09:00 - 18:00 (GMT-3)</span>
                    <span className="text-emerald-500 font-medium">Habilitado</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Conflict Alert Banner */}
            {conflicts.length > 0 && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-amber-500">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Conflicto multi-cuenta detectado:</strong> Tienes eventos superpuestos hoy entre las 14:00 y las 15:30.
                  </span>
                </div>
                <span className="font-medium underline cursor-pointer">Resolver superposición</span>
              </div>
            )}

            {/* Time Grid Header */}
            <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center space-x-3">
                <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-foreground">
                  Hoy, {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                </span>
                <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span className="text-muted-foreground">Corporativo</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  <span className="text-muted-foreground">Personal</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-600" />
                  <span className="text-muted-foreground">Ventas</span>
                </div>
              </div>
            </div>

            {/* Daily Schedule Timeline */}
            <div className="flex-1 p-6 overflow-y-auto space-y-3">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-4 rounded-xl border transition-all ${
                    evt.isConflict
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${evt.accountColor}`} />
                        <h3 className="text-sm font-semibold text-foreground">{evt.title}</h3>
                        {evt.isConflict && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 uppercase tracking-wider">
                            Superposición
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {evt.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                            {evt.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </span>
                        {evt.location && (
                          <span className="flex items-center space-x-1 text-primary">
                            <Video className="h-3.5 w-3.5" />
                            <span>{evt.location}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
                      {evt.account}
                    </span>
                  </div>

                  {evt.attendees && evt.attendees.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center space-x-2 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{evt.attendees.join(", ")}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Event Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">Crear Nuevo Evento</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground block mb-1">Título del Evento</label>
                <input
                  type="text"
                  placeholder="ej. Revisión de Contratos"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2 text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-muted-foreground block mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={newEventStart}
                    onChange={(e) => setNewEventStart(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={newEventEnd}
                    onChange={(e) => setNewEventEnd(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted-foreground block mb-1">Cuenta</label>
                <select
                  value={newEventAccount}
                  onChange={(e) => setNewEventAccount(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2 text-foreground"
                >
                  <option value="corporativo@empresa.com">corporativo@empresa.com (M365)</option>
                  <option value="personal@gmail.com">personal@gmail.com (Google)</option>
                  <option value="ventas@empresa.com">ventas@empresa.com (IMAP/CalDAV)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddEvent}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
              >
                Guardar Evento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

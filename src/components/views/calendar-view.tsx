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
  Building2,
  Lock,
  DoorOpen,
  Monitor,
  ShieldCheck,
  Sparkles,
  Info,
  Layers,
  Trash2,
} from "lucide-react";

export type EventScope = "company" | "personal";

export interface CorporateRoom {
  id: string;
  name: string;
  capacity: number;
  features: string[];
  color: string;
}

export const CORPORATE_ROOMS: CorporateRoom[] = [
  { id: "room-a", name: "Sala de Conferencias A", capacity: 12, features: ["Pantalla 4K", "Proyector", "Zoom Rooms"], color: "#3b82f6" },
  { id: "room-b", name: "Sala de Conferencias B", capacity: 8, features: ["Pantalla 4K", "Cámara 360°"], color: "#8b5cf6" },
  { id: "room-vip", name: "Sala VIP de Directorio", capacity: 16, features: ["Acústica Premium", "Audio Shure"], color: "#f59e0b" },
  { id: "booth-1", name: "Cabina 1 (Insonorizada)", capacity: 2, features: ["Llamadas 1-a-1", "Insonorización 42dB"], color: "#10b981" },
];

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
  scope: EventScope;
  roomId?: string;
  roomName?: string;
  organizer: {
    name: string;
    email: string;
  };
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
    scope: "company",
    organizer: { name: "meg-acizer", email: "meg@worvanta.io" },
  },
  {
    id: "evt-2",
    title: "Revisión de Presupuesto Q4 con Dirección",
    account: "corporativo@empresa.com",
    accountColor: "bg-purple-600",
    start: new Date(new Date().setHours(14, 0, 0, 0)),
    end: new Date(new Date().setHours(15, 0, 0, 0)),
    location: "Sala de Conferencias B",
    roomId: "room-b",
    roomName: "Sala de Conferencias B",
    attendees: ["direccion@empresa.com", "carlos@empresa.com"],
    scope: "company",
    organizer: { name: "Carlos Mendoza", email: "carlos@empresa.com" },
  },
  {
    id: "evt-3",
    title: "Consulta Médica (Personal)",
    account: "personal@gmail.com",
    accountColor: "bg-emerald-600",
    start: new Date(new Date().setHours(14, 30, 0, 0)),
    end: new Date(new Date().setHours(15, 30, 0, 0)),
    location: "Consultorio Privado",
    isConflict: true,
    scope: "personal",
    organizer: { name: "meg-acizer", email: "meg@worvanta.io" },
  },
  {
    id: "evt-4",
    title: "Reunión de Inversión y Alianzas 2027",
    account: "corporativo@empresa.com",
    accountColor: "bg-amber-600",
    start: new Date(new Date().setHours(16, 0, 0, 0)),
    end: new Date(new Date().setHours(17, 30, 0, 0)),
    location: "Sala VIP de Directorio",
    roomId: "room-vip",
    roomName: "Sala VIP de Directorio",
    attendees: ["rsilva@alpha-investments.com", "direccion@empresa.com"],
    scope: "company",
    organizer: { name: "Roberto Silva", email: "rsilva@alpha-investments.com" },
  },
];

import type { ConnectedCalendar } from "../account-manager-modal";

interface CalendarViewProps {
  currentUser?: { name: string; email: string; role?: string };
  personalCalendars?: ConnectedCalendar[];
  onOpenProfileCalendars?: () => void;
}

export function CalendarView({
  currentUser = { name: "meg-acizer", email: "meg@worvanta.io", role: "admin" },
  personalCalendars = [],
  onOpenProfileCalendars,
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<"week" | "day" | "rooms" | "availability">("week");
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Active Calendar Filters (Sidebar)
  const [selectedCalendars, setSelectedCalendars] = useState<Record<string, boolean>>({
    companyGeneral: true,
    roomA: true,
    roomB: true,
    roomVIP: true,
    booth1: true,
    googleWork: true,
    ms365: true,
    personal: true,
  });

  // Form states for new event / room reservation
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStart, setNewEventStart] = useState("11:00");
  const [newEventEnd, setNewEventEnd] = useState("12:00");
  const [newEventScope, setNewEventScope] = useState<EventScope>("company");
  const [newEventRoomId, setNewEventRoomId] = useState<string>("");
  const [newEventLocation, setNewEventLocation] = useState("Google Meet");
  const [newEventAttendees, setNewEventAttendees] = useState("");

  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const toggleCalendar = (key: string) => {
    setSelectedCalendars((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyBookingLink = () => {
    navigator.clipboard.writeText("https://worvanta.app/book/mi-organizacion/mgonzalez");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    triggerNotice("Enlace de reservas copiado al portapapeles");
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const [startH, startM] = newEventStart.split(":").map(Number);
    const [endH, endM] = newEventEnd.split(":").map(Number);

    const s = new Date();
    s.setHours(startH, startM, 0, 0);

    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    const selectedRoom = CORPORATE_ROOMS.find((r) => r.id === newEventRoomId);

    // Detección de conflicto si la sala ya está ocupada
    if (newEventRoomId) {
      const isRoomOccupied = events.some((evt) => {
        if (evt.roomId !== newEventRoomId) return false;
        return (s >= evt.start && s < evt.end) || (end > evt.start && end <= evt.end);
      });

      if (isRoomOccupied) {
        alert(`¡Conflicto de reserva! La sala "${selectedRoom?.name}" ya se encuentra reservada en ese horario.`);
        return;
      }
    }

    const attendeesList = newEventAttendees
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const newEvt: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: newEventTitle.trim(),
      account: newEventScope === "company" ? "corporativo@empresa.com" : "personal@gmail.com",
      accountColor: newEventScope === "personal" ? "bg-emerald-600" : selectedRoom ? "bg-purple-600" : "bg-blue-600",
      start: s,
      end: end,
      location: selectedRoom ? selectedRoom.name : newEventLocation,
      scope: newEventScope,
      roomId: selectedRoom?.id,
      roomName: selectedRoom?.name,
      attendees: attendeesList.length > 0 ? attendeesList : undefined,
      organizer: {
        name: currentUser.name,
        email: currentUser.email,
      },
    };

    setEvents((prev) => [...prev, newEvt]);
    setIsNewModalOpen(false);
    setNewEventTitle("");
    setNewEventRoomId("");
    setNewEventAttendees("");
    triggerNotice(
      selectedRoom
        ? `Reunión agendada y ${selectedRoom.name} reservada con éxito.`
        : `Evento "${newEvt.title}" guardado en tu calendario.`
    );
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm("¿Estás seguro de cancelar esta reunión / reserva?")) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      triggerNotice("Reunión cancelada.");
    }
  };

  // Filtrado de eventos según los calendarios activos
  const visibleEvents = events.filter((evt) => {
    if (evt.scope === "personal") {
      return selectedCalendars.personal;
    }
    // Company events
    if (evt.roomId === "room-a" && !selectedCalendars.roomA) return false;
    if (evt.roomId === "room-b" && !selectedCalendars.roomB) return false;
    if (evt.roomId === "room-vip" && !selectedCalendars.roomVIP) return false;
    if (evt.roomId === "booth-1" && !selectedCalendars.booth1) return false;
    if (!evt.roomId && !selectedCalendars.companyGeneral) return false;
    return true;
  });

  const conflicts = visibleEvents.filter((e) => e.isConflict);

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* 1. Header Superior */}
      <header className="px-6 py-4 border-b border-border bg-card/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              Calendario & Reservas de Salas
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-medium">
                {visibleEvents.length} eventos
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Agendas multi-cuenta unificadas, eventos corporativos y reserva de salas de reuniones.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Switcher */}
          <div className="flex items-center border border-border rounded-lg bg-muted/30 p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === "week" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === "day" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setViewMode("rooms")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === "rooms" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <DoorOpen className="h-3.5 w-3.5 text-primary" />
              <span>Salas ({CORPORATE_ROOMS.length})</span>
            </button>
            <button
              onClick={() => setViewMode("availability")}
              className={`px-3 py-1 rounded-md flex items-center space-x-1.5 transition-colors cursor-pointer ${
                viewMode === "availability" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarCheck2 className="h-3.5 w-3.5" />
              <span>Link Reservas</span>
            </button>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Agendar / Reservar</span>
          </button>
        </div>
      </header>

      {/* Notice Banner */}
      {notice && (
        <div className="mx-6 mt-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between animate-fadeIn">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-muted-foreground hover:text-foreground font-bold">✕</button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* 2. Barra Lateral de Filtros de Calendarios y Salas (Colapsable / Fija) */}
        <aside className="w-64 border-r border-border bg-card/30 p-4 overflow-y-auto space-y-5 hidden md:block shrink-0 text-xs">
          {/* Mini Calendario Header */}
          <div className="space-y-2 pb-3 border-b border-border/60">
            <div className="flex items-center justify-between font-bold text-foreground">
              <span>Noviembre 2026</span>
              <div className="flex items-center gap-1">
                <button className="p-1 rounded hover:bg-muted text-muted-foreground cursor-pointer">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button className="p-1 rounded hover:bg-muted text-muted-foreground cursor-pointer">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Zona horaria: <strong className="text-foreground">GMT-3 (Buenos Aires)</strong>
            </p>
          </div>

          {/* Bloque 1: Calendarios de la Empresa & Salas */}
          <div className="space-y-2">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-500" />
              Empresa & Salas Corporativas
            </h3>
            <div className="space-y-1.5 text-xs text-foreground">
              <label className="flex items-center gap-2 hover:bg-muted/40 p-1 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCalendars.companyGeneral}
                  onChange={() => toggleCalendar("companyGeneral")}
                  className="rounded accent-primary"
                />
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
                <span className="truncate">General & Feriados</span>
              </label>

              <label className="flex items-center gap-2 hover:bg-muted/40 p-1 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCalendars.roomA}
                  onChange={() => toggleCalendar("roomA")}
                  className="rounded accent-primary"
                />
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" />
                <span className="truncate">Sala de Conferencias A</span>
              </label>

              <label className="flex items-center gap-2 hover:bg-muted/40 p-1 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCalendars.roomB}
                  onChange={() => toggleCalendar("roomB")}
                  className="rounded accent-primary"
                />
                <span className="h-2.5 w-2.5 rounded-full bg-purple-600 shrink-0" />
                <span className="truncate">Sala de Conferencias B</span>
              </label>

              <label className="flex items-center gap-2 hover:bg-muted/40 p-1 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCalendars.roomVIP}
                  onChange={() => toggleCalendar("roomVIP")}
                  className="rounded accent-primary"
                />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate">Sala VIP Directorio</span>
              </label>

              <label className="flex items-center gap-2 hover:bg-muted/40 p-1 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCalendars.booth1}
                  onChange={() => toggleCalendar("booth1")}
                  className="rounded accent-primary"
                />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">Cabina Insonorizada 1</span>
              </label>
            </div>
          </div>

          {/* Bloque 2: Mis Agendas Personales */}
          <div className="space-y-2 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-500" />
                Mis Calendarios Propios
              </h3>
              {onOpenProfileCalendars && (
                <button
                  type="button"
                  onClick={onOpenProfileCalendars}
                  className="text-[10px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-0.5"
                  title="Vincular nuevo calendario en Mi Perfil"
                >
                  <Plus className="h-3 w-3" />
                  <span>Agregar</span>
                </button>
              )}
            </div>
            <div className="space-y-1.5 text-xs text-foreground">
              <label className="flex items-center gap-2 hover:bg-muted/40 p-1 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCalendars.personal}
                  onChange={() => toggleCalendar("personal")}
                  className="rounded accent-emerald-500"
                />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 shrink-0" />
                <span className="truncate">Agenda Privada (Solo tú)</span>
              </label>

              {personalCalendars
                .filter((c) => !c.isCorporateDefault)
                .map((cal) => (
                  <label
                    key={cal.id}
                    className="flex items-center gap-2 hover:bg-muted/40 p-1 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCalendars[cal.id] ?? true}
                      onChange={() =>
                        setSelectedCalendars((prev) => ({
                          ...prev,
                          [cal.id]: !(prev[cal.id] ?? true),
                        }))
                      }
                      className="rounded accent-primary"
                    />
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cal.color }}
                    />
                    <span className="truncate" title={cal.accountEmailOrUrl}>
                      {cal.name}
                    </span>
                  </label>
                ))}
            </div>
          </div>

          {/* Info Card de Privacidad */}
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-[11px] text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Privacidad Garantizada
            </span>
            <p>
              Los demás miembros solo ven tus eventos personales como <em>"Ocupado"</em> para proteger tu confidencialidad.
            </p>
          </div>
        </aside>

        {/* 3. Área Central según Modo de Vista */}
        {viewMode === "rooms" ? (
          /* VISTA DE SALAS CORPORATIVAS Y RECURSOS */
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-base font-bold text-foreground">Salas de Reuniones & Recursos de la Empresa</h2>
              <p className="text-xs text-muted-foreground">
                Consulta el estado de ocupación en tiempo real y reserva espacios físicos para tu equipo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CORPORATE_ROOMS.map((room) => {
                const roomEvents = events.filter((e) => e.roomId === room.id);
                return (
                  <div
                    key={room.id}
                    className="p-5 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2.5 rounded-lg text-white"
                            style={{ backgroundColor: room.color }}
                          >
                            <DoorOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-foreground">{room.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              Capacidad: <strong>hasta {room.capacity} personas</strong>
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            roomEvents.length > 0
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {roomEvents.length > 0 ? "Ocupada Hoy" : "Disponible"}
                        </span>
                      </div>

                      {/* Equipamiento */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-3">
                        {room.features.map((feat) => (
                          <span
                            key={feat}
                            className="px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground font-medium border border-border/60"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>

                      {/* Próximas reservas */}
                      <div className="pt-3 border-t border-border/60 mt-3 space-y-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground block">
                          Reservas de hoy:
                        </span>
                        {roomEvents.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">Sin reservas para el resto del día.</p>
                        ) : (
                          roomEvents.map((re) => (
                            <div
                              key={re.id}
                              className="p-2 rounded-lg bg-muted/30 border border-border/40 text-xs flex items-center justify-between"
                            >
                              <div className="truncate pr-2">
                                <span className="font-semibold text-foreground block truncate">{re.title}</span>
                                <span className="text-[10px] text-muted-foreground">Por: {re.organizer.name}</span>
                              </div>
                              <span className="font-mono text-[11px] text-primary shrink-0">
                                {re.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                                {re.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setNewEventRoomId(room.id);
                        setNewEventScope("company");
                        setIsNewModalOpen(true);
                      }}
                      className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Reservar {room.name}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewMode === "availability" ? (
          /* VISTA LINK DE RESERVAS ESTILO CALENDLY */
          <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto space-y-6">
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Motor Nativo de Disponibilidad</h2>
                  <p className="text-sm text-muted-foreground">
                    Comparte tu enlace de reservas estilo Calendly 100% autohospedado en Worvanta sin depender de servicios externos.
                  </p>
                </div>
                <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                  Activo
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/50 border border-border flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-mono text-foreground truncate">
                  <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">https://worvanta.app/book/mi-organizacion/mgonzalez</span>
                </div>
                <button
                  onClick={handleCopyBookingLink}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center space-x-1.5 shrink-0 cursor-pointer"
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
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* VISTA SEMANA O DÍA */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Banner de Conflictos */}
            {conflicts.length > 0 && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-amber-500 shrink-0">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Conflicto detectado:</strong> Tienes eventos superpuestos hoy entre las 14:00 y las 15:30.
                  </span>
                </div>
                <span className="font-medium underline cursor-pointer">Resolver superposición</span>
              </div>
            )}

            {/* Time Grid Header */}
            <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
              <div className="flex items-center space-x-3">
                <button className="p-1 rounded hover:bg-muted text-muted-foreground cursor-pointer">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-foreground">
                  Hoy, {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                </span>
                <button className="p-1 rounded hover:bg-muted text-muted-foreground cursor-pointer">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span className="text-muted-foreground">Corporativo</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-600" />
                  <span className="text-muted-foreground">Salas Reservadas</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  <span className="text-muted-foreground">Personal</span>
                </div>
              </div>
            </div>

            {/* Daily Schedule Timeline */}
            <div className="flex-1 p-6 overflow-y-auto space-y-3">
              {visibleEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-4 rounded-xl border transition-all ${
                    evt.isConflict
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-border bg-card hover:border-primary/50 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${evt.accountColor}`} />
                        <h3 className="text-sm font-semibold text-foreground">{evt.title}</h3>

                        {/* Badges */}
                        {evt.scope === "company" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            🏢 Empresa
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            🔒 Personal
                          </span>
                        )}

                        {evt.roomName && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                            <DoorOpen className="h-3 w-3" />
                            {evt.roomName}
                          </span>
                        )}

                        {evt.isConflict && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 uppercase tracking-wider">
                            Superposición
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-muted-foreground flex-wrap gap-y-1">
                        <span className="flex items-center space-x-1 font-mono">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {evt.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                            {evt.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </span>

                        {evt.location && (
                          <span className="flex items-center space-x-1 text-primary">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{evt.location}</span>
                          </span>
                        )}

                        {evt.attendees && evt.attendees.length > 0 && (
                          <span className="flex items-center space-x-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{evt.attendees.length} asistentes</span>
                          </span>
                        )}

                        <span className="text-[11px] text-muted-foreground/80">
                          Organizador: <strong className="text-foreground">{evt.organizer.name}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {evt.location?.includes("Meet") || evt.location?.includes("Teams") ? (
                        <button
                          onClick={() => alert(`Conectando a videollamada: ${evt.location}`)}
                          className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 flex items-center space-x-1 cursor-pointer"
                        >
                          <Video className="h-3.5 w-3.5" />
                          <span>Unirse</span>
                        </button>
                      ) : null}

                      <button
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        title="Cancelar reunión"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Nuevo Evento / Reserva de Sala */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-5 flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                Agendar Evento / Reserva de Sala
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Título del Evento o Reunión *</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Ej: Planificación Estratégica Q1 o Demo Comercial"
                  className="w-full text-xs px-3 py-2 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Ámbito</label>
                  <select
                    value={newEventScope}
                    onChange={(e) => setNewEventScope(e.target.value as EventScope)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="company">🏢 Evento de Empresa (Corporativo)</option>
                    <option value="personal">🔒 Agenda Personal (Privado)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Reserva de Sala Física</label>
                  <select
                    value={newEventRoomId}
                    onChange={(e) => setNewEventRoomId(e.target.value)}
                    disabled={newEventScope === "personal"}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                  >
                    <option value="">(Ninguna - Reunión Virtual)</option>
                    {CORPORATE_ROOMS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (Cap. {r.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={newEventStart}
                    onChange={(e) => setNewEventStart(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={newEventEnd}
                    onChange={(e) => setNewEventEnd(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Plataforma o Lugar</label>
                <select
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="Google Meet">Google Meet</option>
                  <option value="Microsoft Teams">Microsoft Teams</option>
                  <option value="Zoom Meeting">Zoom Meeting</option>
                  <option value="Presencial en Oficina">Presencial en Oficina</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Asistentes / Invitados (separados por coma)
                </label>
                <input
                  type="text"
                  value={newEventAttendees}
                  onChange={(e) => setNewEventAttendees(e.target.value)}
                  placeholder="carlos@empresa.com, laura@empresa.com"
                  className="w-full text-xs px-3 py-1.5 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

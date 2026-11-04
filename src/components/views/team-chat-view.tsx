"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Hash,
  Send,
  Paperclip,
  Smile,
  Mail,
  User,
  Search,
  Sparkles,
  ExternalLink,
  Users,
} from "lucide-react";

interface ChatMessage {
  id: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: string;
  time: string;
  text: string;
  isSelf?: boolean;
  linkedEmail?: {
    subject: string;
    from: string;
    snippet: string;
  };
}

const CHANNELS = [
  { id: "c1", name: "general", topic: "Discusiones de toda la empresa", unread: 0 },
  { id: "c2", name: "ventas-comercial", topic: "Leads y seguimiento de clientes", unread: 2 },
  { id: "c3", name: "soporte-ti", topic: "Incidencias e infraestructura", unread: 0 },
  { id: "c4", name: "anuncios", topic: "Solo lectura - avisos de dirección", unread: 0 },
];

const DIRECT_MEMBERS = [
  { id: "u1", name: "Carlos Mendoza", role: "Director Financiero", status: "online" },
  { id: "u2", name: "Laura Gómez", role: "Lead Developer", status: "online" },
  { id: "u3", name: "Martín Rodríguez", role: "Ventas B2B", status: "busy" },
  { id: "u4", name: "Sofía Valenzuela", role: "Legal & Compliance", status: "offline" },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    senderName: "Carlos Mendoza",
    senderRole: "Director Financiero",
    time: "10:15 AM",
    text: "Equipo, acabo de recibir la propuesta de Inversiones Alpha para la renovación.",
    linkedEmail: {
      subject: "Fw: Propuesta Contrato Q4 - Inversiones Alpha",
      from: "carlos@empresa.com",
      snippet: "Adjunto el borrador financiero con los términos solicitados por el cliente...",
    },
  },
  {
    id: "m2",
    senderName: "Laura Gómez",
    senderRole: "Lead Developer",
    time: "10:18 AM",
    text: "Revisé la cláusula técnica del SLA del 99.9%. Con la nueva arquitectura en Supabase y Vercel lo cumplimos sin problema.",
  },
  {
    id: "m3",
    senderName: "Tú",
    time: "10:20 AM",
    text: "Excelente. Usaré la IA de MailMe para redactar la respuesta aprobatoria con las condiciones estipuladas.",
    isSelf: true,
  },
];

export function TeamChatView() {
  const [activeChannel, setActiveChannel] = useState("general");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isLinkingEmail, setIsLinkingEmail] = useState(false);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: "Tú",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: inputText,
      isSelf: true,
      linkedEmail: isLinkingEmail
        ? {
            subject: "Hilo de Correo Vinculado",
            from: "contacto@alpha.com",
            snippet: "Detalles del correo seleccionados para discusión interna...",
          }
        : undefined,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setIsLinkingEmail(false);
  };

  return (
    <div className="flex-1 flex h-full bg-background overflow-hidden">
      {/* Channels & Team Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-sm text-foreground">Chat del Tenant</h2>
          </div>
          <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
            Realtime
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Canales */}
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1.5 flex items-center justify-between">
              <span>Canales de la Empresa</span>
              <span>4</span>
            </div>
            <div className="space-y-0.5">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.name)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeChannel === ch.name
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Hash className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{ch.name}</span>
                  </div>
                  {ch.unread > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {ch.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Mensajes Directos */}
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1.5 flex items-center justify-between">
              <span>Compañeros de Equipo</span>
              <span>{DIRECT_MEMBERS.length}</span>
            </div>
            <div className="space-y-0.5">
              {DIRECT_MEMBERS.map((u) => (
                <button
                  key={u.id}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <div className="relative">
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground">
                        {u.name.charAt(0)}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-card ${
                          u.status === "online"
                            ? "bg-emerald-500"
                            : u.status === "busy"
                            ? "bg-amber-500"
                            : "bg-muted-foreground"
                        }`}
                      />
                    </div>
                    <span className="truncate">{u.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-border bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-foreground">Conectado</span>
          </div>
          <span className="text-[10px]">Cifrado E2E</span>
        </div>
      </aside>

      {/* Main Chat Timeline */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Chat Header */}
        <header className="px-6 py-3.5 border-b border-border flex items-center justify-between shrink-0 bg-card">
          <div className="flex items-center space-x-3">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="font-bold text-sm text-foreground">#{activeChannel}</h2>
              <p className="text-xs text-muted-foreground">
                Canal interno seguro para los miembros de tu empresa
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
              <Users className="h-3.5 w-3.5" />
              <span>4 miembros</span>
            </div>
          </div>
        </header>

        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="text-center my-2">
            <span className="text-[11px] bg-muted/60 text-muted-foreground px-3 py-1 rounded-full font-medium">
              Comienzo del historial de #{activeChannel}
            </span>
          </div>

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start space-x-3 ${m.isSelf ? "flex-row-reverse space-x-reverse" : ""}`}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {m.senderName.charAt(0)}
              </div>

              <div className={`space-y-1 max-w-lg ${m.isSelf ? "items-end text-right" : ""}`}>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-foreground">{m.senderName}</span>
                  {m.senderRole && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      • {m.senderRole}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">{m.time}</span>
                </div>

                {/* Linked Email Context Card */}
                {m.linkedEmail && (
                  <div className="p-3 my-1.5 rounded-lg border border-primary/30 bg-primary/5 text-left space-y-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-primary">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{m.linkedEmail.subject}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {m.linkedEmail.snippet}
                    </p>
                    <span className="text-[10px] text-primary/80 font-medium inline-block hover:underline cursor-pointer">
                      Ver correo completo en Inbox →
                    </span>
                  </div>
                )}

                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    m.isSelf
                      ? "bg-primary text-primary-foreground rounded-tr-none text-left"
                      : "bg-card border border-border text-foreground rounded-tl-none"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-card shrink-0">
          {isLinkingEmail && (
            <div className="mb-2 p-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between text-xs text-primary">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Adjuntando referencia de correo al mensaje</span>
              </div>
              <button
                onClick={() => setIsLinkingEmail(false)}
                className="text-[10px] font-semibold hover:underline"
              >
                Cancelar
              </button>
            </div>
          )}

          <div className="flex items-center space-x-2 bg-background border border-border rounded-xl p-2 focus-within:border-primary transition-colors">
            <button
              onClick={() => setIsLinkingEmail(!isLinkingEmail)}
              title="Discutir correo internamente"
              className={`p-1.5 rounded-lg transition-colors ${
                isLinkingEmail
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Mail className="h-4 w-4" />
            </button>

            <button
              title="Adjuntar archivo"
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <input
              type="text"
              placeholder={`Enviar mensaje a #${activeChannel}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 bg-transparent border-none text-xs text-foreground focus:outline-none"
            />

            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

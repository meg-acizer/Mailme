"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Building,
  Tag,
  Star,
  MoreVertical,
  ExternalLink,
  MessageSquare,
  Lock,
  Building2,
  Send,
  Trash2,
  Shield,
  Download,
  Filter,
  Check,
  UserCheck,
} from "lucide-react";

export type ContactScope = "shared" | "personal";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  isInternal?: boolean;
  starred?: boolean;
  tags?: string[];
  scope: ContactScope; // "shared" (directorio corporativo) o "personal" (privado)
  ownerEmail?: string; // Creador del contacto (para contactos personales)
}

const INITIAL_CONTACTS: Contact[] = [
  // Contactos Compartidos de la Empresa (Directorio Corporativo)
  {
    id: "cnt-1",
    name: "Carlos Mendoza",
    email: "cmendoza@techcorp.io",
    phone: "+54 11 5555-0101",
    company: "TechCorp Global",
    role: "Director de Finanzas",
    isInternal: false,
    starred: true,
    tags: ["Cliente VIP", "Propuesta-Q4", "Finanzas"],
    scope: "shared",
    ownerEmail: "admin@worvanta.io",
  },
  {
    id: "cnt-2",
    name: "Laura Benítez",
    email: "lbenitez@innovasoft.com",
    phone: "+54 11 5555-0102",
    company: "InnovaSoft Enterprise",
    role: "Líder de Integraciones",
    isInternal: false,
    starred: true,
    tags: ["Proveedor TI", "Calendario"],
    scope: "shared",
    ownerEmail: "admin@worvanta.io",
  },
  {
    id: "cnt-3",
    name: "Roberto Silva",
    email: "rsilva@alpha-investments.com",
    phone: "+1 415 555-0199",
    company: "Inversiones Alpha",
    role: "Managing Director",
    isInternal: false,
    starred: true,
    tags: ["Inversor", "Dirección"],
    scope: "shared",
    ownerEmail: "admin@worvanta.io",
  },
  {
    id: "cnt-4",
    name: "Elena Rostova",
    email: "elena@delta-corp.io",
    phone: "+44 20 7946 0990",
    company: "Delta Tech International",
    role: "Head of Procurement",
    isInternal: false,
    starred: false,
    tags: ["Prospecto", "Q4"],
    scope: "shared",
    ownerEmail: "admin@worvanta.io",
  },
  // Miembros Internos del Equipo (Tenant)
  {
    id: "cnt-5",
    name: "Laura Gómez",
    email: "laura@empresa.com",
    phone: "+54 11 5555-0155",
    company: "Nuestra Organización",
    role: "Lead Developer",
    isInternal: true,
    starred: true,
    tags: ["Ingeniería", "Core-Team"],
    scope: "shared",
    ownerEmail: "admin@worvanta.io",
  },
  {
    id: "cnt-6",
    name: "Sofía Valenzuela",
    email: "sofia@worvanta.io",
    phone: "+54 11 5555-0160",
    company: "Nuestra Organización",
    role: "Legal & Compliance",
    isInternal: true,
    starred: false,
    tags: ["Legal", "Compliance"],
    scope: "shared",
    ownerEmail: "admin@worvanta.io",
  },
  // Contactos Personales (Bóveda privada: solo los ve el usuario generador)
  {
    id: "cnt-p1",
    name: "Dr. Marcelo Arismendi",
    email: "dr.arismendi@medicina-privada.com",
    phone: "+54 11 4444-2222",
    company: "Consultorio Particular",
    role: "Médico de Cabecera",
    isInternal: false,
    starred: false,
    tags: ["Salud", "Personal"],
    scope: "personal",
    ownerEmail: "meg@worvanta.io",
  },
  {
    id: "cnt-p2",
    name: "Luciana Ferraro",
    email: "luciana.ferraro@asesoria-fiscal.ar",
    phone: "+54 11 4444-3333",
    company: "Estudio Contable Ferraro",
    role: "Contadora Personal",
    isInternal: false,
    starred: true,
    tags: ["Impuestos", "Privado"],
    scope: "personal",
    ownerEmail: "meg@worvanta.io",
  },
];

interface ContactsViewProps {
  currentUser?: { name: string; email: string; role?: string };
  onOpenComposer?: (to: string, subject?: string) => void;
  onNavigateToChat?: () => void;
}

export function ContactsView({
  currentUser = { name: "meg-acizer", email: "meg@worvanta.io", role: "admin" },
  onOpenComposer,
  onNavigateToChat,
}: ContactsViewProps) {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "shared" | "personal" | "internal" | "starred">("all");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Form states for new contact
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newScope, setNewScope] = useState<ContactScope>("shared");
  const [newIsInternal, setNewIsInternal] = useState(false);
  const [newTags, setNewTags] = useState("");

  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Regla de Privacidad: Contactos personales solo los ve el usuario generador
  const accessibleContacts = contacts.filter((c) => {
    if (c.scope === "personal") {
      return c.ownerEmail === currentUser.email;
    }
    return true; // Compartidos de empresa son visibles por todos
  });

  const filteredContacts = accessibleContacts.filter((c) => {
    const matchesQuery =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.tags && c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    if (scopeFilter === "shared") return matchesQuery && c.scope === "shared";
    if (scopeFilter === "personal") return matchesQuery && c.scope === "personal";
    if (scopeFilter === "internal") return matchesQuery && c.isInternal;
    if (scopeFilter === "starred") return matchesQuery && c.starred;

    return matchesQuery;
  });

  const handleToggleStar = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, starred: !c.starred } : c))
    );
  };

  const handleDeleteContact = (contact: Contact) => {
    const isOwner = contact.ownerEmail === currentUser.email;
    const isAdmin = currentUser.role === "admin";
    if (contact.scope === "shared" && !isAdmin && !isOwner) {
      alert("Solo administradores o el creador pueden eliminar contactos del Directorio Corporativo.");
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el contacto "${contact.name}"?`)) {
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      triggerNotice(`Contacto "${contact.name}" eliminado.`);
    }
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const parsedTags = newTags
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    const newContact: Contact = {
      id: `cnt-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      phone: newPhone.trim() || undefined,
      company: newCompany.trim() || undefined,
      role: newRole.trim() || undefined,
      isInternal: newIsInternal,
      starred: false,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      scope: newScope,
      ownerEmail: currentUser.email,
    };

    setContacts([newContact, ...contacts]);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewCompany("");
    setNewRole("");
    setNewScope("shared");
    setNewIsInternal(false);
    setNewTags("");
    setIsNewModalOpen(false);

    triggerNotice(
      `Contacto "${newContact.name}" guardado en ${
        newContact.scope === "shared" ? "Directorio Corporativo" : "Contactos Personales"
      }.`
    );
  };

  const handleExportCsv = () => {
    const headers = ["Nombre", "Email", "Teléfono", "Empresa", "Cargo", "Ámbito", "Tipo", "Etiquetas"];
    const rows = filteredContacts.map((c) => [
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.phone || ""}"`,
      `"${c.company || ""}"`,
      `"${c.role || ""}"`,
      c.scope === "shared" ? "Empresa" : "Personal",
      c.isInternal ? "Equipo Interno" : "Externo",
      `"${(c.tags || []).join(", ")}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `worvanta_contactos_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* 1. Top Header */}
      <header className="px-6 py-4 border-b border-border bg-card/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              Libreta & Directorio de Contactos
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-medium">
                {accessibleContacts.length} contactos
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Directorio compartido de la empresa y agenda privada de contactos personales.
            </p>
          </div>
        </div>

        {/* Toolbar Superior */}
        <div className="flex items-center space-x-2">
          {/* Search Bar */}
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo, empresa o tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-muted/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            onClick={handleExportCsv}
            className="p-1.5 rounded-md border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            title="Exportar a planilla CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nuevo Contacto</span>
          </button>
        </div>
      </header>

      {/* Notice Banner */}
      {notice && (
        <div className="mx-6 mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between animate-fadeIn">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-muted-foreground hover:text-foreground font-bold">✕</button>
        </div>
      )}

      {/* 2. Pestañas de Ámbito: Directorio de Empresa vs Personales */}
      <div className="px-6 py-2.5 border-b border-border bg-card/20 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setScopeFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              scopeFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Todos ({accessibleContacts.length})</span>
          </button>

          <button
            onClick={() => setScopeFilter("shared")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              scopeFilter === "shared"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-blue-500" />
            <span>Directorio de Empresa ({contacts.filter((c) => c.scope === "shared").length})</span>
          </button>

          <button
            onClick={() => setScopeFilter("personal")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              scopeFilter === "personal"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span>Mis Contactos Personales ({accessibleContacts.filter((c) => c.scope === "personal").length})</span>
          </button>

          <button
            onClick={() => setScopeFilter("internal")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              scopeFilter === "internal"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5 text-purple-500" />
            <span>Equipo Interno ({accessibleContacts.filter((c) => c.isInternal).length})</span>
          </button>

          <button
            onClick={() => setScopeFilter("starred")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              scopeFilter === "starred"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span>Favoritos ({accessibleContacts.filter((c) => c.starred).length})</span>
          </button>
        </div>

        <div className="text-[11px] text-muted-foreground">
          {scopeFilter === "personal" ? (
            <span className="text-emerald-500 font-medium">🔒 Bóveda personal activa (privacidad total)</span>
          ) : (
            <span>🏢 Contactos corporativos sincronizados con el Tenant</span>
          )}
        </div>
      </div>

      {/* 3. Grid de Contactos */}
      <div className="flex-1 p-6 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-xl">
            <Users className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">No se encontraron contactos</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              {scopeFilter === "personal"
                ? "No tienes contactos en tu libreta personal todavía. Puedes crear uno y será 100% privado."
                : "Prueba modificando los términos de búsqueda o los filtros de ámbito."}
            </p>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="mt-3 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Agregar Contacto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-border bg-card shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  {/* Top Bar: Avatar, Info, Badges & Star */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 truncate">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                        {c.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <h3 className="font-bold text-sm text-foreground flex items-center space-x-1.5 truncate">
                          <span className="truncate">{c.name}</span>
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">{c.role || c.company || "Contacto"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleStar(c.id)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer"
                        title={c.starred ? "Quitar de favoritos" : "Marcar como favorito"}
                      >
                        <Star className={`h-4 w-4 ${c.starred ? "text-amber-500 fill-amber-500" : ""}`} />
                      </button>

                      <button
                        onClick={() => handleDeleteContact(c)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Eliminar contacto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Badges de Ámbito y Tipo */}
                  <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                    {c.scope === "personal" ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5" />
                        Personal (Privado)
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                        <Building2 className="h-2.5 w-2.5" />
                        Directorio Empresa
                      </span>
                    )}

                    {c.isInternal && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        Equipo Interno
                      </span>
                    )}
                  </div>

                  {/* Info Details */}
                  <div className="space-y-1.5 text-xs text-muted-foreground pt-2">
                    <div className="flex items-center space-x-2 truncate">
                      <Mail className="h-3.5 w-3.5 opacity-70 shrink-0" />
                      <span className="text-foreground font-mono text-[11px] truncate">{c.email}</span>
                    </div>

                    {c.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3.5 w-3.5 opacity-70 shrink-0" />
                        <span className="font-mono text-[11px]">{c.phone}</span>
                      </div>
                    )}

                    {c.company && (
                      <div className="flex items-center space-x-2 truncate">
                        <Building className="h-3.5 w-3.5 opacity-70 shrink-0" />
                        <span className="truncate">{c.company}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {c.tags && c.tags.length > 0 && (
                    <div className="pt-2 border-t border-border/50 flex flex-wrap gap-1 mt-2">
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acciones Rápidas Directas */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                  {/* Botón Enviar Correo Directo */}
                  <button
                    onClick={() => onOpenComposer && onOpenComposer(c.email, "")}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    title={`Redactar correo a ${c.email}`}
                  >
                    <Send className="h-3 w-3" />
                    <span>Enviar Correo</span>
                  </button>

                  {/* Botón Iniciar Chat (Para miembros internos) */}
                  {c.isInternal && onNavigateToChat && (
                    <button
                      onClick={onNavigateToChat}
                      className="py-1.5 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Chatear internamente con este compañero"
                    >
                      <MessageSquare className="h-3 w-3 text-primary" />
                      <span>Chat</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Nuevo Contacto */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-5 flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Crear Nuevo Contacto
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej: Lic. Martín Rossi"
                    className="w-full text-xs px-3 py-2 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="mrossi@empresa.com"
                    className="w-full text-xs px-3 py-2 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Teléfono / Móvil</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+54 11 5555-0199"
                    className="w-full text-xs px-3 py-2 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Empresa / Organización</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="Ej: Alpha Corp"
                    className="w-full text-xs px-3 py-2 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Cargo o Puesto</label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Ej: Director Comercial"
                    className="w-full text-xs px-3 py-2 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Ámbito de Almacenamiento</label>
                  <select
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value as ContactScope)}
                    className="w-full text-xs px-2.5 py-2 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="shared">🏢 Directorio Compartido (Empresa)</option>
                    <option value="personal">🔒 Contactos Personales (Solo visible por mí)</option>
                  </select>
                </div>
              </div>

              {/* Toggle Miembro Interno */}
              <div className="flex items-center justify-between p-2.5 bg-muted/30 border border-border rounded-lg">
                <div>
                  <span className="font-semibold block text-foreground">¿Es miembro interno del equipo?</span>
                  <span className="text-[11px] text-muted-foreground">
                    Habilitará el botón directo de chat interno corporativo.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newIsInternal}
                  onChange={(e) => setNewIsInternal(e.target.checked)}
                  className="h-4 w-4 accent-primary cursor-pointer"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Etiquetas (separadas por comas)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="VIP, Finanzas, Proveedor"
                  className="w-full text-xs px-3 py-2 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
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
                  Guardar Contacto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  isInternal?: boolean;
  starred?: boolean;
  tags?: string[];
}

const INITIAL_CONTACTS: Contact[] = [
  {
    id: "cnt-1",
    name: "Carlos Mendoza",
    email: "carlos@empresa.com",
    phone: "+54 11 5555-0101",
    company: "Nuestra Organización",
    role: "Director Financiero",
    isInternal: true,
    starred: true,
    tags: ["Dirección", "Finanzas"],
  },
  {
    id: "cnt-2",
    name: "Laura Gómez",
    email: "laura@empresa.com",
    phone: "+54 11 5555-0102",
    company: "Nuestra Organización",
    role: "Lead Developer",
    isInternal: true,
    starred: true,
    tags: ["Ingeniería"],
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
    tags: ["Cliente VIP", "Inversor"],
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
  },
];

export function ContactsView() {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "internal" | "external">("all");

  const filteredContacts = contacts.filter((c) => {
    const matchesQuery =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterType === "internal") return matchesQuery && c.isInternal;
    if (filterType === "external") return matchesQuery && !c.isInternal;
    return matchesQuery;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Libreta de Contactos</h1>
            <p className="text-xs text-muted-foreground">
              Directorio unificado de miembros internos de la empresa y contactos externos
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterType === "all"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos ({contacts.length})
            </button>
            <button
              onClick={() => setFilterType("internal")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterType === "internal"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Equipo ({contacts.filter((c) => c.isInternal).length})
            </button>
            <button
              onClick={() => setFilterType("external")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterType === "external"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Externos ({contacts.filter((c) => !c.isInternal).length})
            </button>
          </div>

          <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity">
            <Plus className="h-3.5 w-3.5" />
            <span>Nuevo Contacto</span>
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-6 py-3 border-b border-border bg-card">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, empresa o tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Contacts List Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl border border-border bg-card hover:border-border/80 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center space-x-1.5">
                      <span>{c.name}</span>
                      {c.isInternal && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary/10 text-primary">
                          Tenant
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">{c.role || c.company}</p>
                  </div>
                </div>

                <button className="text-muted-foreground hover:text-amber-500">
                  <Star className={`h-4 w-4 ${c.starred ? "text-amber-500 fill-amber-500" : ""}`} />
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Mail className="h-3.5 w-3.5 opacity-70" />
                  <a href={`mailto:${c.email}`} className="text-foreground hover:underline">
                    {c.email}
                  </a>
                </div>
                {c.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3.5 w-3.5 opacity-70" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.company && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-3.5 w-3.5 opacity-70" />
                    <span>{c.company}</span>
                  </div>
                )}
              </div>

              {c.tags && (
                <div className="pt-2 border-t border-border/50 flex flex-wrap gap-1">
                  {c.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

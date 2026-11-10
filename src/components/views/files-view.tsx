"use client";

import React, { useState } from "react";
import {
  FolderOpen,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  File,
  Download,
  Search,
  Filter,
  ShieldCheck,
  Share2,
  Mail,
  Trash2,
  Upload,
  ExternalLink,
  Eye,
  CheckCircle,
  HardDrive,
} from "lucide-react";
import type { AttachedFile } from "../mail-composer";

export interface FileItem {
  id: string;
  name: string;
  size: string;
  type: "pdf" | "spreadsheet" | "doc" | "image" | "zip" | "other";
  mimeType: string;
  date: string;
  account: {
    name: string;
    color: string;
  };
  sender: {
    name: string;
    email: string;
  };
  linkedEmail?: {
    id: string;
    subject: string;
  };
  scanStatus: "clean" | "scanning" | "warning";
}

const INITIAL_FILES: FileItem[] = [
  {
    id: "f-1",
    name: "Presupuesto_Q4_v2.pdf",
    size: "1.4 MB",
    type: "pdf",
    mimeType: "application/pdf",
    date: "Hoy 10:42 AM",
    account: { name: "Google Workspace", color: "#3b82f6" },
    sender: { name: "Carlos Mendoza", email: "cmendoza@techcorp.io" },
    linkedEmail: {
      id: "1",
      subject: "Propuesta comercial Q4 y coordinación de reunión técnica",
    },
    scanStatus: "clean",
  },
  {
    id: "f-2",
    name: "Especificacion_Endpoints_v1.docx",
    size: "2.8 MB",
    type: "doc",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    date: "Ayer 09:15 AM",
    account: { name: "Microsoft 365", color: "#f97316" },
    sender: { name: "Laura Benítez", email: "lbenitez@innovasoft.com" },
    linkedEmail: {
      id: "2",
      subject: "Re: Estado del proyecto de integración Worvanta",
    },
    scanStatus: "clean",
  },
  {
    id: "f-3",
    name: "Reporte_Financiero_Octubre_2026.xlsx",
    size: "4.1 MB",
    type: "spreadsheet",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    date: "3 Nov 2026",
    account: { name: "Google Workspace", color: "#3b82f6" },
    sender: { name: "Roberto Silva", email: "rsilva@alpha-investments.com" },
    linkedEmail: {
      id: "3",
      subject: "Reporte financiero mensual consolidado",
    },
    scanStatus: "clean",
  },
  {
    id: "f-4",
    name: "Worvanta_Brand_Guidelines_v3.pdf",
    size: "5.2 MB",
    type: "pdf",
    mimeType: "application/pdf",
    date: "1 Nov 2026",
    account: { name: "Microsoft 365", color: "#f97316" },
    sender: { name: "Sofía Valenzuela", email: "sofia@worvanta.io" },
    linkedEmail: {
      id: "4",
      subject: "Manual de identidad y paleta de colores Worvanta",
    },
    scanStatus: "clean",
  },
  {
    id: "f-5",
    name: "Mockup_Dashboard_Enterprise.png",
    size: "840 KB",
    type: "image",
    mimeType: "image/png",
    date: "28 Oct 2026",
    account: { name: "Google Workspace", color: "#3b82f6" },
    sender: { name: "Laura Gómez", email: "laura@empresa.com" },
    scanStatus: "clean",
  },
];

interface FilesViewProps {
  onNavigateToMail?: (emailId?: string) => void;
  onOpenComposerWithAttachment?: (attachment: AttachedFile) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({
  onNavigateToMail,
  onOpenComposerWithAttachment,
}) => {
  const [files, setFiles] = useState<FileItem[]>(INITIAL_FILES);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.sender.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || file.type === typeFilter;
    const matchesAccount = accountFilter === "all" || file.account.name === accountFilter;

    return matchesSearch && matchesType && matchesAccount;
  });

  const getFileIcon = (type: FileItem["type"]) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-6 w-6 text-red-500" />;
      case "spreadsheet":
        return <FileSpreadsheet className="h-6 w-6 text-emerald-500" />;
      case "doc":
        return <FileText className="h-6 w-6 text-blue-500" />;
      case "image":
        return <ImageIcon className="h-6 w-6 text-purple-500" />;
      default:
        return <File className="h-6 w-6 text-slate-500" />;
    }
  };

  const handleDownload = (file: FileItem) => {
    // Generate a simple simulated blob download
    const blob = new Blob([`Contenido seguro del archivo: ${file.name}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareViaMail = (file: FileItem) => {
    if (onOpenComposerWithAttachment) {
      onOpenComposerWithAttachment({
        name: file.name,
        size: file.size,
        type: file.mimeType,
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top Header */}
      <div className="p-4 border-b border-border bg-card/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              Archivos & Biblioteca de Adjuntos
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-medium">
                {files.length} archivos
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Documentos, presupuestos y contratos de tus correos escaneados y protegidos por ClamAV.
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-48 sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar archivo o remitente..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-muted/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Account Filter */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-md bg-muted/40 border border-border text-foreground cursor-pointer focus:outline-none"
          >
            <option value="all">Todas las cuentas</option>
            <option value="Google Workspace">Google Workspace</option>
            <option value="Microsoft 365">Microsoft 365</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-md overflow-hidden bg-muted/30 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tarjetas
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                viewMode === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tabla
            </button>
          </div>
        </div>
      </div>

      {/* Security & Overview Stats Bar */}
      <div className="px-4 py-2.5 border-b border-border bg-card/20 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              typeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({files.length})
          </button>
          <button
            onClick={() => setTypeFilter("pdf")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              typeFilter === "pdf" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            PDFs ({files.filter((f) => f.type === "pdf").length})
          </button>
          <button
            onClick={() => setTypeFilter("spreadsheet")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              typeFilter === "spreadsheet" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Hojas de Cálculo ({files.filter((f) => f.type === "spreadsheet").length})
          </button>
          <button
            onClick={() => setTypeFilter("doc")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              typeFilter === "doc" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Documentos Word ({files.filter((f) => f.type === "doc").length})
          </button>
          <button
            onClick={() => setTypeFilter("image")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              typeFilter === "image" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Imágenes ({files.filter((f) => f.type === "image").length})
          </button>
        </div>

        {/* Security verification tag */}
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="h-4 w-4" />
          <span>Protección ClamAV: Todos los archivos analizados sin amenazas</span>
        </div>
      </div>

      {/* Main Files Display */}
      <div className="flex-1 overflow-auto p-4">
        {filteredFiles.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-xl">
            <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">No se encontraron archivos</p>
            <p className="text-xs text-muted-foreground">Prueba ajustando el término de búsqueda o los filtros de tipo.</p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid Card View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="bg-card border border-border rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-primary/50 transition-all group"
              >
                <div>
                  {/* Card Top: Icon & Account Pill */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-2.5 rounded-lg bg-muted/60 border border-border/80">
                      {getFileIcon(file.type)}
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: file.account.color }}
                    >
                      {file.account.name}
                    </span>
                  </div>

                  {/* File Name */}
                  <h4
                    onClick={() => setPreviewFile(file)}
                    className="font-bold text-xs text-foreground truncate cursor-pointer hover:text-primary transition-colors mb-1"
                    title={file.name}
                  >
                    {file.name}
                  </h4>

                  {/* Meta: Size & Date */}
                  <p className="text-[11px] text-muted-foreground mb-3 flex items-center justify-between">
                    <span>{file.size}</span>
                    <span>{file.date}</span>
                  </p>

                  {/* Linked Email Context */}
                  {file.linkedEmail && (
                    <div
                      onClick={() => onNavigateToMail && onNavigateToMail(file.linkedEmail?.id)}
                      className="p-1.5 rounded bg-muted/40 border border-border/60 text-[10px] text-muted-foreground hover:text-primary hover:bg-muted cursor-pointer transition-colors mb-3 truncate flex items-center gap-1.5"
                      title={file.linkedEmail.subject}
                    >
                      <Mail className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{file.linkedEmail.subject}</span>
                    </div>
                  )}

                  {/* Sender */}
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-2">
                    <span className="font-semibold text-foreground truncate">{file.sender.name}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[10px] flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle className="h-3 w-3" />
                    Limpio
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleShareViaMail(file)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Compartir en nuevo correo"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      title="Descargar archivo"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Nombre</th>
                  <th className="py-2.5 px-3">Tamaño</th>
                  <th className="py-2.5 px-3">Cuenta</th>
                  <th className="py-2.5 px-3">Remitente</th>
                  <th className="py-2.5 px-3">Correo Asociado</th>
                  <th className="py-2.5 px-3">Seguridad</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span
                          onClick={() => setPreviewFile(file)}
                          className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors truncate max-w-xs"
                        >
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-mono">{file.size}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: file.account.color }}
                      >
                        {file.account.name}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-foreground">{file.sender.name}</td>
                    <td className="py-2.5 px-3">
                      {file.linkedEmail ? (
                        <button
                          onClick={() => onNavigateToMail && onNavigateToMail(file.linkedEmail?.id)}
                          className="inline-flex items-center gap-1.5 text-primary hover:underline truncate max-w-[200px] cursor-pointer"
                        >
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{file.linkedEmail.subject}</span>
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Verificado
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">{file.date}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleShareViaMail(file)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Compartir por correo"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                          title="Descargar archivo"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview File Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                {getFileIcon(previewFile.type)}
                <div>
                  <h3 className="font-bold text-sm text-foreground">{previewFile.name}</h3>
                  <p className="text-xs text-muted-foreground">{previewFile.size} • {previewFile.account.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Simulated file canvas */}
            <div className="h-56 bg-muted/40 rounded-lg border border-border flex flex-col items-center justify-center p-6 text-center">
              <FileText className="h-12 w-12 text-primary/60 mb-2" />
              <p className="text-sm font-semibold text-foreground">Vista previa protegida</p>
              <p className="text-xs text-muted-foreground max-w-md mt-1">
                Este archivo ha sido analizado por el motor ClamAV corporativo de Worvanta sin detectar virus, macros maliciosas ni scripts.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Seguro para descargar y abrir
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Remitente: <strong className="text-foreground">{previewFile.sender.email}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleShareViaMail(previewFile);
                    setPreviewFile(null);
                  }}
                  className="px-3 py-1.5 text-xs rounded-md bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Adjuntar a correo</span>
                </button>
                <button
                  onClick={() => handleDownload(previewFile)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Descargar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

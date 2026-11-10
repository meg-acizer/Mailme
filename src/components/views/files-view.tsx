"use client";

import React, { useState } from "react";
import {
  FolderOpen,
  Folder,
  FolderPlus,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  File,
  Download,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Share2,
  Mail,
  Trash2,
  Upload,
  ExternalLink,
  Eye,
  CheckCircle,
  HardDrive,
  Lock,
  Unlock,
  Users,
  User,
  Building2,
  Plus,
  ChevronRight,
  Shield,
  Edit3,
  Check,
  AlertTriangle,
  Info,
} from "lucide-react";
import type { AttachedFile } from "../mail-composer";

export type FileScope = "personal" | "shared";
export type FilePermission = "readonly" | "edit" | "admin";

export interface FolderItem {
  id: string;
  name: string;
  scope: FileScope;
  createdBy: string;
  filesCount: number;
  color?: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: string;
  type: "pdf" | "spreadsheet" | "doc" | "image" | "zip" | "other";
  mimeType: string;
  date: string;
  folderId?: string; // ID de la carpeta contenedora o undefined si está en la raíz
  scope: FileScope; // "personal" (solo visible por el creador) o "shared" (empresa)
  permission: FilePermission; // por default "readonly"
  owner: {
    name: string;
    email: string;
  };
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

const INITIAL_FOLDERS: FolderItem[] = [
  { id: "fld-1", name: "Presupuestos & Finanzas", scope: "shared", createdBy: "Carlos Mendoza", filesCount: 2, color: "#3b82f6" },
  { id: "fld-2", name: "Especificaciones Técnicas", scope: "shared", createdBy: "Laura Benítez", filesCount: 1, color: "#8b5cf6" },
  { id: "fld-3", name: "Identidad & Marca", scope: "shared", createdBy: "Sofía Valenzuela", filesCount: 1, color: "#ec4899" },
  { id: "fld-p1", name: "Mis Borradores Privados", scope: "personal", createdBy: "meg-acizer", filesCount: 1, color: "#10b981" },
  { id: "fld-p2", name: "Documentos de Identidad", scope: "personal", createdBy: "meg-acizer", filesCount: 1, color: "#f59e0b" },
];

const INITIAL_FILES: FileItem[] = [
  {
    id: "f-1",
    name: "Presupuesto_Q4_v2.pdf",
    size: "1.4 MB",
    type: "pdf",
    mimeType: "application/pdf",
    date: "Hoy 10:42 AM",
    folderId: "fld-1",
    scope: "shared",
    permission: "readonly", // Default readonly
    owner: { name: "Carlos Mendoza", email: "cmendoza@techcorp.io" },
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
    folderId: "fld-2",
    scope: "shared",
    permission: "readonly", // Default readonly
    owner: { name: "Laura Benítez", email: "lbenitez@innovasoft.com" },
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
    folderId: "fld-1",
    scope: "shared",
    permission: "edit",
    owner: { name: "Roberto Silva", email: "rsilva@alpha-investments.com" },
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
    folderId: "fld-3",
    scope: "shared",
    permission: "readonly", // Default readonly
    owner: { name: "Sofía Valenzuela", email: "sofia@worvanta.io" },
    account: { name: "Microsoft 365", color: "#f97316" },
    sender: { name: "Sofía Valenzuela", email: "sofia@worvanta.io" },
    linkedEmail: {
      id: "4",
      subject: "Manual de identidad y paleta de colores Worvanta",
    },
    scanStatus: "clean",
  },
  // Archivos Personales (Solo visibles por el generador / usuario actual)
  {
    id: "f-p1",
    name: "Borrador_Contrato_Confidencial.docx",
    size: "1.1 MB",
    type: "doc",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    date: "Hoy 08:30 AM",
    folderId: "fld-p1",
    scope: "personal",
    permission: "admin",
    owner: { name: "meg-acizer", email: "meg@worvanta.io" },
    account: { name: "Google Workspace", color: "#3b82f6" },
    sender: { name: "meg-acizer", email: "meg@worvanta.io" },
    scanStatus: "clean",
  },
  {
    id: "f-p2",
    name: "Certificado_Acceso_VPN_Privado.pdf",
    size: "420 KB",
    type: "pdf",
    mimeType: "application/pdf",
    date: "25 Oct 2026",
    folderId: "fld-p2",
    scope: "personal",
    permission: "admin",
    owner: { name: "meg-acizer", email: "meg@worvanta.io" },
    account: { name: "Microsoft 365", color: "#f97316" },
    sender: { name: "meg-acizer", email: "meg@worvanta.io" },
    scanStatus: "clean",
  },
];

interface FilesViewProps {
  currentUser?: { name: string; email: string; role?: string };
  onNavigateToMail?: (emailId?: string) => void;
  onOpenComposerWithAttachment?: (attachment: AttachedFile) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({
  currentUser = { name: "meg-acizer", email: "meg@worvanta.io", role: "admin" },
  onNavigateToMail,
  onOpenComposerWithAttachment,
}) => {
  const [folders, setFolders] = useState<FolderItem[]>(INITIAL_FOLDERS);
  const [files, setFiles] = useState<FileItem[]>(INITIAL_FILES);
  const [activeScope, setActiveScope] = useState<"all" | "shared" | "personal">("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [permissionsModalFile, setPermissionsModalFile] = useState<FileItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // New folder form
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderScope, setNewFolderScope] = useState<FileScope>("shared");

  // New upload form
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState<FileItem["type"]>("pdf");
  const [newFileScope, setNewFileScope] = useState<FileScope>("shared");
  const [newFileFolderId, setNewFileFolderId] = useState<string>("");
  const [newFilePermission, setNewFilePermission] = useState<FilePermission>("readonly"); // Default readonly

  const triggerNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  // Regla de privacidad: Archivos personales solo los ve el usuario creador (owner.email === currentUser.email)
  const visibleFiles = files.filter((f) => {
    if (f.scope === "personal") {
      return f.owner.email === currentUser.email;
    }
    return true; // Archivos compartidos son visibles para toda la empresa
  });

  const visibleFolders = folders.filter((f) => {
    if (f.scope === "personal") {
      return f.createdBy === currentUser.name || f.createdBy === currentUser.email;
    }
    return true;
  });

  // Filtrado compuesto (por ámbito, carpeta, tipo y búsqueda)
  const filteredFiles = visibleFiles.filter((file) => {
    // Filtro por ámbito
    if (activeScope === "shared" && file.scope !== "shared") return false;
    if (activeScope === "personal" && file.scope !== "personal") return false;

    // Filtro por carpeta seleccionada
    if (selectedFolderId && file.folderId !== selectedFolderId) return false;

    // Filtro por búsqueda
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.owner.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtro por tipo de archivo
    const matchesType = typeFilter === "all" || file.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const currentFolder = folders.find((f) => f.id === selectedFolderId);

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

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFld: FolderItem = {
      id: `fld-${Date.now()}`,
      name: newFolderName.trim(),
      scope: newFolderScope,
      createdBy: currentUser.name,
      filesCount: 0,
      color: newFolderScope === "personal" ? "#10b981" : "#3b82f6",
    };

    setFolders([...folders, newFld]);
    setNewFolderName("");
    setIsNewFolderModalOpen(false);
    triggerNotice(`Carpeta "${newFld.name}" creada con éxito`);
  };

  const handleUploadFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const extension = newFileType === "pdf" ? ".pdf" : newFileType === "spreadsheet" ? ".xlsx" : ".docx";
    const fullName = newFileName.includes(".") ? newFileName : `${newFileName}${extension}`;

    const newFile: FileItem = {
      id: `f-${Date.now()}`,
      name: fullName,
      size: "1.2 MB",
      type: newFileType,
      mimeType: newFileType === "pdf" ? "application/pdf" : "application/octet-stream",
      date: "Hoy (Recién)",
      folderId: newFileFolderId || undefined,
      scope: newFileScope,
      permission: newFileScope === "personal" ? "admin" : newFilePermission, // Default readonly en compartidos
      owner: {
        name: currentUser.name,
        email: currentUser.email,
      },
      account: { name: "Google Workspace", color: "#3b82f6" },
      sender: { name: currentUser.name, email: currentUser.email },
      scanStatus: "clean",
    };

    setFiles([newFile, ...files]);
    // Actualizar conteo en carpeta
    if (newFileFolderId) {
      setFolders((prev) =>
        prev.map((f) => (f.id === newFileFolderId ? { ...f, filesCount: f.filesCount + 1 } : f))
      );
    }

    setNewFileName("");
    setNewFileFolderId("");
    setNewFilePermission("readonly");
    setIsUploadModalOpen(false);
    triggerNotice(
      `Archivo "${newFile.name}" cargado en modo ${
        newFile.permission === "readonly" ? "Solo Lectura (Default)" : "Edición"
      }`
    );
  };

  const handleUpdatePermission = (fileId: string, newPermission: FilePermission) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, permission: newPermission } : f))
    );
    setPermissionsModalFile(null);
    triggerNotice(`Permiso actualizado a: ${newPermission.toUpperCase()}`);
  };

  const handleDeleteFile = (file: FileItem) => {
    const isOwner = file.owner.email === currentUser.email;
    const isAdmin = currentUser.role === "admin";
    const canDelete = isOwner || isAdmin || file.permission === "admin";

    if (!canDelete) {
      alert("No tienes permisos suficientes para eliminar este archivo (Requiere permisos de Administrador o Propietario).");
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el archivo "${file.name}"?`)) {
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      triggerNotice(`Archivo "${file.name}" eliminado`);
    }
  };

  const handleDownload = (file: FileItem) => {
    const blob = new Blob([`Contenido seguro del archivo: ${file.name}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerNotice(`Descargando "${file.name}"`);
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

  // Permiso para modificar permisos de un archivo:
  // - En archivos personales: el usuario creador (owner)
  // - En archivos compartidos: el usuario creador o el administrador corporativo
  const canManagePermissions = (file: FileItem) => {
    if (file.scope === "personal") {
      return file.owner.email === currentUser.email;
    }
    return file.owner.email === currentUser.email || currentUser.role === "admin";
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* 1. Header Principal */}
      <div className="p-4 border-b border-border bg-card/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground">Archivos & Documentos</h1>
              {selectedFolderId && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="font-semibold text-primary">{currentFolder?.name}</span>
                  <button
                    onClick={() => setSelectedFolderId(null)}
                    className="ml-1 text-[11px] underline hover:text-foreground cursor-pointer"
                  >
                    (Ver todos)
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Repositorio con carpetas personales (privadas) y compartidas con políticas de permisos.
            </p>
          </div>
        </div>

        {/* Toolbar Superior */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-44 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar archivo o propietario..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-md bg-muted/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-md overflow-hidden bg-muted/30 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tarjetas
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                viewMode === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tabla
            </button>
          </div>

          {/* Botón Nueva Carpeta */}
          <button
            onClick={() => setIsNewFolderModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer shadow-xs"
          >
            <FolderPlus className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Nueva Carpeta</span>
          </button>

          {/* Botón Subir Archivo */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Subir Archivo</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {noticeMessage && (
        <div className="mx-4 mt-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between animate-fadeIn">
          <span>{noticeMessage}</span>
          <button onClick={() => setNoticeMessage(null)} className="text-muted-foreground hover:text-foreground font-bold">✕</button>
        </div>
      )}

      {/* 2. Selector de Ámbitos (Personales vs Compartidos) & Filtros */}
      <div className="px-4 py-2.5 border-b border-border bg-card/20 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
        {/* Scope Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveScope("all");
              setSelectedFolderId(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeScope === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span>Todos los Archivos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-mono">
              {visibleFiles.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveScope("shared");
              setSelectedFolderId(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeScope === "shared"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-blue-500" />
            <span>Compartidos por la Empresa</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-mono">
              {files.filter((f) => f.scope === "shared").length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveScope("personal");
              setSelectedFolderId(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeScope === "personal"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span>Mis Archivos Personales</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-mono">
              {visibleFiles.filter((f) => f.scope === "personal").length}
            </span>
          </button>
        </div>

        {/* Security & Default policy badge */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            ClamAV Activo
          </span>
          <span className="hidden md:inline px-2 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">
            Default: Solo Lectura (Readonly)
          </span>
        </div>
      </div>

      {/* 3. Sección de Carpetas */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Folder className="h-3.5 w-3.5" />
            Carpetas ({visibleFolders.filter((f) => activeScope === "all" || f.scope === activeScope).length})
          </h3>
          {selectedFolderId && (
            <button
              onClick={() => setSelectedFolderId(null)}
              className="text-[11px] text-primary hover:underline cursor-pointer"
            >
              Mostrar todas las carpetas
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {visibleFolders
            .filter((f) => activeScope === "all" || f.scope === activeScope)
            .map((fld) => {
              const isSelected = selectedFolderId === fld.id;
              return (
                <div
                  key={fld.id}
                  onClick={() => setSelectedFolderId(isSelected ? null : fld.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                    isSelected
                      ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary"
                      : "bg-card border-border hover:border-border hover:bg-muted/40 shadow-xs"
                  }`}
                >
                  <div
                    className="p-2 rounded-lg text-white shrink-0"
                    style={{ backgroundColor: fld.color || "#3b82f6" }}
                  >
                    <Folder className="h-4 w-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-xs text-foreground truncate">{fld.name}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      {fld.scope === "personal" ? (
                        <span className="text-emerald-500 font-medium">Personal</span>
                      ) : (
                        <span>Empresa</span>
                      )}
                      • {fld.filesCount} arch.
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 4. Lista o Grid de Archivos */}
      <div className="flex-1 overflow-auto p-4">
        {filteredFiles.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-xl">
            <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">No se encontraron archivos</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              {activeScope === "personal"
                ? "No tienes archivos en tu bóveda personal todavía. Los archivos personales solo son visibles por ti."
                : "No hay archivos en la carpeta o con los filtros seleccionados."}
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-3 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Subir primer archivo
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* Vista en Cuadrícula de Tarjetas */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => {
              const fileFolder = folders.find((f) => f.id === file.folderId);
              return (
                <div
                  key={file.id}
                  className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-xs hover:border-primary/50 transition-all group"
                >
                  <div>
                    {/* Header: Icon, Scope Badge & Permission Pill */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="p-2.5 rounded-lg bg-muted/60 border border-border/80">
                        {getFileIcon(file.type)}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {/* Scope Pill */}
                        {file.scope === "personal" ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" />
                            Personal (Solo tú)
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                            <Building2 className="h-2.5 w-2.5" />
                            Empresa
                          </span>
                        )}

                        {/* Permission Pill */}
                        <span
                          className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                            file.permission === "readonly"
                              ? "bg-slate-500/10 text-slate-500 border-slate-500/20"
                              : file.permission === "edit"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-purple-500/10 text-purple-600 border-purple-500/20"
                          }`}
                        >
                          {file.permission === "readonly" && "👁️ Solo Lectura (Default)"}
                          {file.permission === "edit" && "✏️ Edición"}
                          {file.permission === "admin" && "👑 Control Total"}
                        </span>
                      </div>
                    </div>

                    {/* Nombre del archivo */}
                    <h4
                      onClick={() => setPreviewFile(file)}
                      className="font-bold text-xs text-foreground truncate cursor-pointer hover:text-primary transition-colors mb-1"
                      title={file.name}
                    >
                      {file.name}
                    </h4>

                    {/* Carpeta y Tamaño */}
                    <div className="text-[11px] text-muted-foreground mb-2 flex items-center justify-between">
                      <span className="truncate flex items-center gap-1">
                        <Folder className="h-3 w-3 text-primary/70 shrink-0" />
                        <span className="truncate">{fileFolder?.name || "Raíz"}</span>
                      </span>
                      <span className="font-mono text-[10px]">{file.size}</span>
                    </div>

                    {/* Propietario */}
                    <p className="text-[10px] text-muted-foreground mb-3 truncate">
                      Subido por: <strong className="text-foreground">{file.owner.name}</strong>
                    </p>

                    {/* Correo Vinculado */}
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
                  </div>

                  {/* Acciones de la Tarjeta */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    {/* Botón Gestionar Permisos */}
                    {canManagePermissions(file) ? (
                      <button
                        onClick={() => setPermissionsModalFile(file)}
                        className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        title="Configurar permisos de lectura, edición o acceso"
                      >
                        <Shield className="h-3 w-3" />
                        Permisos
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Protegido
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleShareViaMail(file)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Compartir en correo"
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
                      <button
                        onClick={() => handleDeleteFile(file)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        title="Eliminar archivo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Vista en Tabla */
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Nombre</th>
                  <th className="py-2.5 px-3">Carpeta</th>
                  <th className="py-2.5 px-3">Ámbito</th>
                  <th className="py-2.5 px-3">Permiso</th>
                  <th className="py-2.5 px-3">Tamaño</th>
                  <th className="py-2.5 px-3">Propietario</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFiles.map((file) => {
                  const fileFolder = folders.find((f) => f.id === file.folderId);
                  return (
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
                      <td className="py-2.5 px-3 text-muted-foreground">{fileFolder?.name || "Raíz"}</td>
                      <td className="py-2.5 px-3">
                        {file.scope === "personal" ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            🔒 Personal (Solo tú)
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            🏢 Empresa
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            file.permission === "readonly"
                              ? "bg-slate-500/10 text-slate-500 border-slate-500/20"
                              : file.permission === "edit"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-purple-500/10 text-purple-600 border-purple-500/20"
                          }`}
                        >
                          {file.permission === "readonly" && "Solo Lectura"}
                          {file.permission === "edit" && "Edición"}
                          {file.permission === "admin" && "Control Total"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono">{file.size}</td>
                      <td className="py-2.5 px-3 text-foreground">{file.owner.name}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{file.date}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {canManagePermissions(file) && (
                            <button
                              onClick={() => setPermissionsModalFile(file)}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                              title="Gestionar Permisos"
                            >
                              <Shield className="h-3.5 w-3.5" />
                            </button>
                          )}
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
                          <button
                            onClick={() => handleDeleteFile(file)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Gestionar Permisos de Archivo */}
      {permissionsModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-5 flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Permisos de Acceso</h3>
              </div>
              <button
                onClick={() => setPermissionsModalFile(null)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Archivo seleccionado:</span>
                <span className="font-bold text-foreground text-sm">{permissionsModalFile.name}</span>
              </div>

              {/* Ámbito actual */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <span className="font-semibold block">Ámbito de Privacidad:</span>
                  <span className="text-muted-foreground text-[11px]">
                    {permissionsModalFile.scope === "personal"
                      ? "Personal: Sólo visible por el usuario generador"
                      : "Compartido: Accesible por los miembros de la empresa"}
                  </span>
                </div>
                {permissionsModalFile.scope === "personal" ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    🔒 Personal
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    🏢 Empresa
                  </span>
                )}
              </div>

              {/* Selector de Permiso */}
              <div>
                <label className="font-semibold block mb-1 text-foreground">
                  Nivel de Permiso Asignado:
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border hover:bg-muted/30 cursor-pointer">
                    <input
                      type="radio"
                      name="permission"
                      checked={permissionsModalFile.permission === "readonly"}
                      onChange={() => handleUpdatePermission(permissionsModalFile.id, "readonly")}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        👁️ Solo Lectura (Readonly - Recomendado por defecto)
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Los usuarios pueden previsualizar y descargar el documento, pero no modificarlo ni borrarlo.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border hover:bg-muted/30 cursor-pointer">
                    <input
                      type="radio"
                      name="permission"
                      checked={permissionsModalFile.permission === "edit"}
                      onChange={() => handleUpdatePermission(permissionsModalFile.id, "edit")}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        ✏️ Edición (Read & Write)
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Permite a los usuarios actualizar el archivo y subir nuevas revisiones.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border hover:bg-muted/30 cursor-pointer">
                    <input
                      type="radio"
                      name="permission"
                      checked={permissionsModalFile.permission === "admin"}
                      onChange={() => handleUpdatePermission(permissionsModalFile.id, "admin")}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        👑 Control Total (Admin)
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Control total sobre el documento, incluyendo reasignar permisos y eliminación permanente.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20 text-[11px] text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span>
                  El usuario generador y los Administradores de Worvanta pueden ajustar estos permisos en cualquier momento.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setPermissionsModalFile(null)}
                className="px-4 py-1.5 text-xs rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Subir Archivo Nuevo */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-5 flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Subir Nuevo Archivo a Worvanta
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Nombre del Archivo *</label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Ej: Contrato_Servicios_2026 o Informe_Q4"
                  className="w-full text-xs px-3 py-2 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Tipo de Archivo</label>
                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value as FileItem["type"])}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="pdf">Documento PDF (.pdf)</option>
                    <option value="spreadsheet">Hoja de Cálculo (.xlsx)</option>
                    <option value="doc">Documento Word (.docx)</option>
                    <option value="image">Imagen (.png, .jpg)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Ámbito de Almacenamiento</label>
                  <select
                    value={newFileScope}
                    onChange={(e) => setNewFileScope(e.target.value as FileScope)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="shared">🏢 Compartido (Empresa)</option>
                    <option value="personal">🔒 Personal (Solo visible por mí)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Carpeta Destino</label>
                <select
                  value={newFileFolderId}
                  onChange={(e) => setNewFileFolderId(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">(Raíz - Sin carpeta específica)</option>
                  {visibleFolders
                    .filter((f) => f.scope === newFileScope)
                    .map((fld) => (
                      <option key={fld.id} value={fld.id}>
                        📁 {fld.name} ({fld.scope === "personal" ? "Personal" : "Empresa"})
                      </option>
                    ))}
                </select>
              </div>

              {/* Permiso por Default (Readonly) */}
              {newFileScope === "shared" ? (
                <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Permiso Inicial Corporativo:</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-500/10 text-slate-500 font-bold border border-slate-500/20">
                      Default: Solo Lectura (Readonly)
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Por política de seguridad, los archivos compartidos de la empresa se cargan por defecto en modo <strong>Solo Lectura</strong> para los miembros. Podrás cambiarlo a Edición cuando lo desees.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-600 dark:text-emerald-400">
                  🔒 Este archivo se guardará en tu <strong>Bóveda Personal</strong>. Ningún otro usuario ni administrador de la empresa tendrá acceso a su contenido.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                >
                  Subir y Escanear (ClamAV)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Crear Nueva Carpeta */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-5 flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-primary" />
                Nueva Carpeta
              </h3>
              <button
                onClick={() => setIsNewFolderModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Nombre de la Carpeta *</label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ej: Contratos 2026 o Mis Notas"
                  className="w-full text-xs px-3 py-2 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Ámbito de la Carpeta</label>
                <select
                  value={newFolderScope}
                  onChange={(e) => setNewFolderScope(e.target.value as FileScope)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="shared">🏢 Compartida con la Empresa</option>
                  <option value="personal">🔒 Personal (Solo tú tendrás acceso)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                >
                  Crear Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Previsualización de Archivo */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl p-6 flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                {getFileIcon(previewFile.type)}
                <div>
                  <h3 className="font-bold text-sm text-foreground">{previewFile.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {previewFile.size} • {previewFile.scope === "personal" ? "🔒 Archivo Personal" : "🏢 Compartido de Empresa"} • {previewFile.permission === "readonly" ? "Solo Lectura" : "Edición"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="h-48 bg-muted/40 rounded-lg border border-border flex flex-col items-center justify-center p-6 text-center">
              <FileText className="h-10 w-10 text-primary/60 mb-2" />
              <p className="text-sm font-semibold text-foreground">Vista previa protegida</p>
              <p className="text-xs text-muted-foreground max-w-md mt-1">
                Documento escaneado y certificado por el motor ClamAV corporativo. Sin amenazas ni virus detectados.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Protegido por ClamAV
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Propietario: <strong className="text-foreground">{previewFile.owner.name}</strong>
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

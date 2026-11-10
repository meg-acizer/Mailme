"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  Plus,
  Search,
  Sparkles,
  Calendar,
  Clock,
  Tag,
  User,
  Mail,
  AlertCircle,
  CheckCircle2,
  Circle,
  MoreVertical,
  Filter,
  ArrowRight,
  ChevronDown,
  Trash2,
  Edit2,
  Check,
} from "lucide-react";

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "high" | "normal" | "low";
  dueDate: string;
  assignee: {
    name: string;
    avatar?: string;
    email: string;
  };
  tags: string[];
  linkedEmail?: {
    id: string;
    subject: string;
    sender: string;
  };
  aiExtracted?: boolean;
}

const INITIAL_TASKS: TaskItem[] = [
  {
    id: "tsk-1",
    title: "Revisar y validar presupuesto Q4 v2",
    description: "Revisar el desglose de infraestructura acordado con Carlos Mendoza antes de la reunión del jueves.",
    status: "in_progress",
    priority: "high",
    dueDate: "Jueves 15:00",
    assignee: {
      name: "meg-acizer",
      email: "meg@worvanta.io",
    },
    tags: ["Finanzas", "Propuesta-Q4"],
    linkedEmail: {
      id: "1",
      subject: "Propuesta comercial Q4 y coordinación de reunión técnica",
      sender: "Carlos Mendoza <cmendoza@techcorp.io>",
    },
    aiExtracted: true,
  },
  {
    id: "tsk-2",
    title: "Validar endpoints de integración de calendario",
    description: "Responder a Laura Benítez confirmando las pruebas sobre los endpoints del calendario multi-cuenta.",
    status: "todo",
    priority: "normal",
    dueDate: "Viernes 18:00",
    assignee: {
      name: "meg-acizer",
      email: "meg@worvanta.io",
    },
    tags: ["Integración", "Backend"],
    linkedEmail: {
      id: "2",
      subject: "Re: Estado del proyecto de integración Worvanta",
      sender: "Laura Benítez <lbenitez@innovasoft.com>",
    },
    aiExtracted: true,
  },
  {
    id: "tsk-3",
    title: "Actualizar configuración de políticas de seguridad en Tenant Admin",
    description: "Verificar el tamaño máximo de adjuntos a 5MB y lista negra de dominios con el oficial de cumplimiento.",
    status: "todo",
    priority: "high",
    dueDate: "Lunes próximo",
    assignee: {
      name: "meg-acizer",
      email: "meg@worvanta.io",
    },
    tags: ["Seguridad", "Admin"],
  },
  {
    id: "tsk-4",
    title: "Probar webhook y polling runner del bot de Telegram",
    description: "Validar los comandos /briefing y /ask en el entorno de desarrollo local.",
    status: "done",
    priority: "normal",
    dueDate: "Ayer",
    assignee: {
      name: "meg-acizer",
      email: "meg@worvanta.io",
    },
    tags: ["Telegram", "Dev"],
  },
  {
    id: "tsk-5",
    title: "Presentación ejecutiva del nuevo branding Worvanta",
    description: "Preparar las diapositivas con el nuevo logo origami para la junta directiva.",
    status: "review",
    priority: "low",
    dueDate: "15 Noviembre",
    assignee: {
      name: "meg-acizer",
      email: "meg@worvanta.io",
    },
    tags: ["Branding", "Marketing"],
  },
];

interface TasksViewProps {
  onNavigateToMail?: (emailId?: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onNavigateToMail }) => {
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [aiSuggestionsBanner, setAiSuggestionsBanner] = useState(true);

  // Form states for new task
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "normal" | "low">("normal");
  const [newDueDate, setNewDueDate] = useState("Esta semana");
  const [newTag, setNewTag] = useState("");

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const handleToggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === "done" ? "todo" : "done";
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleMoveStatus = (id: string, newStatus: TaskItem["status"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: `tsk-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      status: "todo",
      priority: newPriority,
      dueDate: newDueDate.trim() || "Sin fecha",
      assignee: {
        name: "meg-acizer",
        email: "meg@worvanta.io",
      },
      tags: newTag.trim() ? newTag.split(",").map((s) => s.trim().replace(/^#/, "")) : ["General"],
    };

    setTasks([newTask, ...tasks]);
    setNewTitle("");
    setNewDescription("");
    setNewPriority("normal");
    setNewDueDate("Esta semana");
    setNewTag("");
    setIsNewTaskModalOpen(false);
  };

  const handleAcceptAiSuggestion = () => {
    const aiTask: TaskItem = {
      id: `tsk-ai-${Date.now()}`,
      title: "Coordinar llamada de 45 min con Carlos Mendoza",
      description: "Compromiso extraído automáticamente del correo sobre propuesta Q4 para el jueves a las 15:00 hs.",
      status: "todo",
      priority: "high",
      dueDate: "Jueves 15:00",
      assignee: {
        name: "meg-acizer",
        email: "meg@worvanta.io",
      },
      tags: ["Reunión", "Propuesta-Q4"],
      linkedEmail: {
        id: "1",
        subject: "Propuesta comercial Q4 y coordinación de reunión técnica",
        sender: "Carlos Mendoza",
      },
      aiExtracted: true,
    };
    setTasks([aiTask, ...tasks]);
    setAiSuggestionsBanner(false);
  };

  const columns: Array<{ id: TaskItem["status"]; title: string; color: string; badge: string }> = [
    { id: "todo", title: "Por Hacer", color: "border-slate-500", badge: "bg-slate-500/10 text-slate-500 dark:text-slate-400" },
    { id: "in_progress", title: "En Progreso", color: "border-blue-500", badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { id: "review", title: "En Revisión", color: "border-amber-500", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { id: "done", title: "Completadas", color: "border-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top Header */}
      <div className="p-4 border-b border-border bg-card/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              Gestor de Tareas & Compromisos
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-medium">
                {tasks.filter((t) => t.status !== "done").length} pendientes
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Tareas sincronizadas con tus correos y compromisos detectados por la IA de Worvanta.
            </p>
          </div>
        </div>

        {/* Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tareas o etiquetas..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-muted/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-md bg-muted/40 border border-border text-foreground cursor-pointer focus:outline-none"
          >
            <option value="all">Todas las prioridades</option>
            <option value="high">🔴 Alta prioridad</option>
            <option value="normal">⚪ Prioridad normal</option>
            <option value="low">🟢 Baja prioridad</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-md overflow-hidden bg-muted/30 p-0.5">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                viewMode === "kanban" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tablero
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Lista
            </button>
          </div>

          {/* New Task Button */}
          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* AI Smart Commitments Banner */}
      {aiSuggestionsBanner && (
        <div className="mx-4 mt-3 p-3 rounded-lg border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-foreground">
                Sugerencia Inteligente de Worvanta:
              </p>
              <p className="text-muted-foreground">
                Detectamos una solicitud de reunión de <strong className="text-foreground">Carlos Mendoza</strong> para este <strong className="text-foreground">Jueves a las 15:00 hs</strong>. ¿Quieres convertirla en una tarea con recordatorio?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAcceptAiSuggestion}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              <span>Crear Tarea</span>
            </button>
            <button
              onClick={() => setAiSuggestionsBanner(false)}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Area (Kanban vs List) */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full min-h-[500px]">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);
              return (
                <div
                  key={col.id}
                  className="flex flex-col bg-card/50 rounded-xl border border-border p-3 overflow-hidden shadow-xs"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-foreground">{col.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${col.badge}`}>
                        {colTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsNewTaskModalOpen(true)}
                      className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                      title="Agregar tarea en esta columna"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {colTasks.length === 0 ? (
                      <div className="h-24 border border-dashed border-border/70 rounded-lg flex items-center justify-center text-xs text-muted-foreground italic">
                        Sin tareas
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-lg bg-card border border-border shadow-xs hover:border-primary/50 transition-all group flex flex-col gap-2"
                        >
                          {/* Top: Priority & Actions */}
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {task.priority === "high" && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-500/10 text-red-600 dark:text-red-400">
                                  🔴 Alta
                                </span>
                              )}
                              {task.priority === "normal" && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400">
                                  ⚪ Normal
                                </span>
                              )}
                              {task.priority === "low" && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  🟢 Baja
                                </span>
                              )}
                              {task.aiExtracted && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center gap-1" title="Extraído automáticamente de correo">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  IA
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 transition-opacity cursor-pointer"
                              title="Eliminar tarea"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Title */}
                          <h4
                            onClick={() => handleToggleTaskStatus(task.id)}
                            className={`text-xs font-semibold text-foreground cursor-pointer hover:text-primary transition-colors ${
                              task.status === "done" ? "line-through opacity-60" : ""
                            }`}
                          >
                            {task.title}
                          </h4>

                          {/* Description */}
                          {task.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Linked Email Chip */}
                          {task.linkedEmail && (
                            <div
                              onClick={() => onNavigateToMail && onNavigateToMail(task.linkedEmail?.id)}
                              className="p-1.5 rounded bg-muted/60 border border-border/80 text-[10px] flex items-center gap-1.5 text-muted-foreground hover:text-primary hover:bg-muted cursor-pointer transition-colors"
                              title={`Abrir correo: ${task.linkedEmail.subject}`}
                            >
                              <Mail className="h-3 w-3 text-primary shrink-0" />
                              <span className="truncate font-medium">{task.linkedEmail.subject}</span>
                            </div>
                          )}

                          {/* Tags & Due Date */}
                          <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1 truncate">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span className="truncate">{task.dueDate}</span>
                            </div>

                            {/* Move status dropdown */}
                            <div className="relative">
                              <select
                                value={task.status}
                                onChange={(e) => handleMoveStatus(task.id, e.target.value as TaskItem["status"])}
                                className="text-[10px] py-0.5 px-1 bg-muted rounded border border-border text-foreground cursor-pointer focus:outline-none"
                              >
                                <option value="todo">Por hacer</option>
                                <option value="in_progress">En progreso</option>
                                <option value="review">En revisión</option>
                                <option value="done">Completada</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View Mode */
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3 w-8"></th>
                  <th className="py-2.5 px-3">Tarea</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Prioridad</th>
                  <th className="py-2.5 px-3">Fecha Límite</th>
                  <th className="py-2.5 px-3">Origen / Email</th>
                  <th className="py-2.5 px-3">Etiquetas</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground italic">
                      No se encontraron tareas con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleTaskStatus(task.id)}
                          className="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                        >
                          {task.status === "done" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span
                            className={`font-semibold text-foreground ${
                              task.status === "done" ? "line-through opacity-60" : ""
                            }`}
                          >
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="text-[11px] text-muted-foreground line-clamp-1">
                              {task.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={task.status}
                          onChange={(e) => handleMoveStatus(task.id, e.target.value as TaskItem["status"])}
                          className="text-[11px] py-1 px-1.5 bg-muted/60 rounded border border-border text-foreground cursor-pointer focus:outline-none"
                        >
                          <option value="todo">Por hacer</option>
                          <option value="in_progress">En progreso</option>
                          <option value="review">En revisión</option>
                          <option value="done">Completada</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3">
                        {task.priority === "high" && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-red-500/10 text-red-600 dark:text-red-400">
                            🔴 Alta
                          </span>
                        )}
                        {task.priority === "normal" && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400">
                            ⚪ Normal
                          </span>
                        )}
                        {task.priority === "low" && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            🟢 Baja
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                        {task.dueDate}
                      </td>
                      <td className="py-2.5 px-3">
                        {task.linkedEmail ? (
                          <button
                            onClick={() => onNavigateToMail && onNavigateToMail(task.linkedEmail?.id)}
                            className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline truncate max-w-[180px] cursor-pointer"
                          >
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{task.linkedEmail.subject}</span>
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {task.tags.map((tg) => (
                            <span
                              key={tg}
                              className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono"
                            >
                              #{tg}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 rounded text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                          title="Eliminar tarea"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Crear Nueva Tarea */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                Nueva Tarea o Compromiso
              </h3>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Título de la tarea *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Revisar contrato de renovación..."
                  className="w-full text-xs px-3 py-2 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Descripción o notas
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detalles sobre lo que se debe realizar..."
                  className="w-full text-xs px-3 py-2 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Prioridad
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as "high" | "normal" | "low")}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="high">🔴 Alta prioridad</option>
                    <option value="normal">⚪ Prioridad normal</option>
                    <option value="low">🟢 Baja prioridad</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Fecha límite
                  </label>
                  <input
                    type="text"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    placeholder="Ej: Jueves 15:00 o 20 Nov"
                    className="w-full text-xs px-3 py-1.5 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Etiquetas (separadas por coma)
                </label>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Finanzas, Q4, Urgente"
                  className="w-full text-xs px-3 py-1.5 rounded-md bg-muted/40 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                >
                  Crear Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

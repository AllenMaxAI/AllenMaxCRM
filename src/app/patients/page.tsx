"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Patient } from "@/lib/mock-data"
import { useData } from "@/context/data-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Plus, User, Users, MoreHorizontal, Mail, Phone, Calendar, Info, Edit, Clock, MapPin, Filter, FileDown, Tag, Trash2, Save, X, Pipette, ExternalLink, ArrowLeft, Pencil, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "@/hooks/use-toast"
import { cn, parseToDate } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { useSearchParams, useRouter } from "next/navigation"
import { resolvePatientName, resolvePatientInitial, cleanSummary } from "@/lib/patient-utils"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ToastAction } from "@/components/ui/toast"


const PREMIUM_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#10B981", "#06B6D4", "#3B82F6", "#6366F1", "#8B5CF6", "#D946EF", "#EC4899", "#64748B", "#0F172A"
];

import { Calendar as CalendarUI } from "@/components/ui/calendar"

const formatDate = (date: any) => {
  const d = parseToDate(date);
  if (!d) return "---";
  
  return d.toLocaleString('es-ES', { 
    day: 'numeric', 
    month: 'numeric', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatPhone = (phone: string | undefined | null) => {
  if (!phone) return "---";
  let cleaned = phone.trim().replace(/\s+/g, "");
  let prefix = "";
  
  // Specific handling for +34 (Spain) and others
  if (cleaned.startsWith('+34')) {
    prefix = "+34 ";
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('+')) {
    const commonPrefixes = ['+1', '+52', '+44', '+33', '+49', '+351', '+54', '+57', '+56'];
    const foundPrefix = commonPrefixes.find(p => cleaned.startsWith(p));
    if (foundPrefix) {
      prefix = foundPrefix + " ";
      cleaned = cleaned.slice(foundPrefix.length);
    } else {
      const match = cleaned.match(/^(\+\d{1,2})/);
      if (match) {
        prefix = match[1] + " ";
        cleaned = cleaned.slice(match[1].length);
      }
    }
  }
  
  const raw = cleaned.replace(/\D/g, "");
  let formatted = raw;
  
  if (raw.length === 9) {
    // Spanish standard: 600 00 00 00
    formatted = `${raw.slice(0, 3)} ${raw.slice(3, 5)} ${raw.slice(5, 7)} ${raw.slice(7)}`;
  } else if (raw.length === 10) {
    formatted = `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
  } else if (raw.length === 8) {
    formatted = `${raw.slice(0, 4)} ${raw.slice(4)}`;
  }
  
  return (prefix + formatted).trim() || "---";
};

const CHANNEL_MAP: Record<string, string> = {
  "n8n Chatbot": "Chatbot web",
  "n8n chatbot": "Chatbot web",
  "chatbot web": "Chatbot web",
  "Chatbot Web": "Chatbot web",
  "Chatbot WhatsApp": "Chatbot WhatsApp",
  "Agente de Voz": "Agente de voz",
  "Agente de voz": "Agente de voz",
  "Instagram": "Instagram",
}

const normalizeChannel = (channel: string): string =>
  CHANNEL_MAP[channel] ?? channel;

function ColorPicker({ color, onChange }: { color: string, onChange: (c: string) => void }) {
  return (
    <div className="space-y-3 p-4 bg-slate-50 dark:bg-accent/10 rounded-2xl border border-slate-100 dark:border-border">
      <div>
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 ml-1">Colores</p>
        <div className="flex flex-wrap gap-2.5">
          {PREMIUM_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                "h-6 w-6 rounded-full transition-all hover:scale-125 active:scale-90 border border-white dark:border-border/20",
                color === c ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-[#0F172A]" : ""
              )}
              style={{ backgroundColor: c }}
              onClick={() => onChange(c)}
            />
          ))}
        </div>
      </div>
      
      <div className="pt-3 border-t border-slate-100 dark:border-border flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Personalizado</p>
          <div className="flex items-center gap-2">
            <Input 
              value={color} 
              onChange={(e) => onChange(e.target.value)}
              className="h-8 rounded-lg text-[10px] font-mono uppercase bg-white dark:bg-background border-slate-200 dark:border-slate-700 w-24 px-2"
            />
            <div className="h-6 w-6 rounded-md shadow-sm border border-white dark:border-border/10" style={{ backgroundColor: color }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const { 
    patients, appointments, conversations, calls, trash, settings, 
    addPatient, updatePatient, updateSettings, trashPatient, restorePatient, deletePatients,
    updateAppointment, deleteAppointment, trashAppointment, restoreAppointment
  } = useData()
  const availableTags = settings?.availableTags || [];
  const safePatients = patients || [];
  const safeAppointments = appointments || [];
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientIdParam = searchParams.get('id')

  const [searchQuery, setSearchQuery] = useState("")
  const [filterChannel, setFilterChannel] = useState<string | null>(null)
  const [filterAppointment, setFilterAppointment] = useState<string>("Todas")
  const [filterTag, setFilterTag] = useState<string>("Todas")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  
  // Form State
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formCountryCode, setFormCountryCode] = useState("+34")
  const [formPhone, setFormPhone] = useState("")
  const [formSource, setFormSource] = useState("")
  const [formTags, setFormTags] = useState<string[]>([])
  
  // Tags Management State
  const [newTagInput, setNewTagInput] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3B82F6") // Default blue
  const [isTagsManagerOpen, setIsTagsManagerOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<{ name: string, originalName: string, color: string } | null>(null)

  const getTagStyle = (hexColor: string) => {
    if (!hexColor || !hexColor.startsWith('#')) return { backgroundColor: '#64748B20', color: '#64748B' };
    const bg = `${hexColor}20`;
    return {
      backgroundColor: bg,
      color: hexColor,
      border: `1px solid ${hexColor}40`
    };
  }

  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isAppointmentsOpen, setIsAppointmentsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  
  // Appointment Detail/Edit View State within Historial Dialog
  const [appHistoryView, setAppHistoryView] = useState<'list' | 'edit'>('list')
  const [editingApp, setEditingApp] = useState<any>(null)
  const [isAppDatePickerOpen, setIsAppDatePickerOpen] = useState(false)
  const [appEditForm, setAppEditForm] = useState({
    title: "",
    date: "",
    time: "",
    status: "",
    notes: ""
  })

  const appointmentCategories = [
    { name: "Consulta General", color: "bg-blue-500" },
    { name: "Ortodoncia", color: "bg-emerald-500" },
    { name: "Ortodoncia invisible", color: "bg-teal-500" },
    { name: "Implantes dentales", color: "bg-indigo-500" },
    { name: "Periodoncia", color: "bg-amber-500" },
    { name: "Estética dental", color: "bg-pink-500" },
    { name: "Cirugía oral", color: "bg-purple-500" },
    { name: "Odontopediatría", color: "bg-orange-500" },
  ]
  
  // Delete & Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isAppDeleteConfirmOpen, setIsAppDeleteConfirmOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<string | 'bulk' | null>(null)
  const [appToDeleteId, setAppToDeleteId] = useState<string | null>(null)
  const [deleteAssocAppointments, setDeleteAssocAppointments] = useState(true)
  const [deleteAssocConversations, setDeleteAssocConversations] = useState(true)
  const [deleteAssocCalls, setDeleteAssocCalls] = useState(true)

  // Tag Delete States
  const [isTagDeleteConfirmOpen, setIsTagDeleteConfirmOpen] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<any>(null)
  const [removeTagFromPatients, setRemoveTagFromPatients] = useState(true)
  const [deletePatientsWithTag, setDeletePatientsWithTag] = useState(false)
  
  // FIX: Forzar limpieza de body al cerrar cualquier modal para evitar bloqueo de clicks
  useEffect(() => {
    const anyModalOpen = isInfoOpen || isEditOpen || isAppointmentsOpen || isAddOpen || 
                        isDeleteConfirmOpen || isTagsManagerOpen || isTagDeleteConfirmOpen;
    if (!anyModalOpen && mounted) {
      // Usamos un timeout ligeramente mayor para asegurar que Radix ha terminado su ciclo de descolgado
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
        document.documentElement.style.pointerEvents = 'auto';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isInfoOpen, isEditOpen, isAppointmentsOpen, isAddOpen, isDeleteConfirmOpen, isTagsManagerOpen, isTagDeleteConfirmOpen, mounted]);

  // Handle URL ID parameter
  useEffect(() => {
    if (patientIdParam && mounted && safePatients.length > 0) {
      const patient = safePatients.find(p => p.id === patientIdParam)
      if (patient) {
        setSelectedPatient(patient)
        setIsInfoOpen(true)
      }
    }
  }, [patientIdParam, mounted, safePatients])

  const handleEditOpen = (patient: any) => {
    setSelectedPatient(patient)
    setFormName(patient.name)
    setFormEmail(patient.email)
    
    let countryCode = "+34";
    let localPhone = (patient.phone && patient.phone !== "No proporcionado" && patient.phone !== "Sin teléfono") ? patient.phone : "";
    if (localPhone.startsWith('+')) {
      const parts = localPhone.split(' ');
      if (parts.length > 1 && parts[0].length <= 5) {
        countryCode = parts[0];
        localPhone = parts.slice(1).join(' ');
      } else {
        const knownCodes = ['+351', '+52', '+54', '+57', '+56', '+34', '+44', '+33', '+49', '+1'];
        for (const code of knownCodes) {
          if (localPhone.startsWith(code)) {
            countryCode = code;
            localPhone = localPhone.substring(code.length).trim();
            break;
          }
        }
      }
    }
    
    setFormCountryCode(countryCode)
    setFormPhone(localPhone)
    setFormSource(patient.first_contact_channel)
    setFormTags(patient.tags || [])
    setTimeout(() => setIsEditOpen(true), 50)
  }

  const formChannels = ['Chatbot Web', 'Chatbot WhatsApp', 'Agente de voz', 'Instagram']
  const channels = Array.from(new Set(safePatients.map(p => normalizeChannel(p.first_contact_channel || ""))))

  const handleEditAppOpen = (app: any) => {
    let cleanTitle = (app.title || app.treatment || "Consulta General").replace(/^(Tratamiento|Servicio):\s*/i, '');
    const matchedCategory = appointmentCategories.find(c => 
      c.name.toLowerCase() === cleanTitle.toLowerCase() || 
      c.name.toLowerCase().startsWith(cleanTitle.toLowerCase()) || 
      cleanTitle.toLowerCase().startsWith(c.name.toLowerCase())
    );
    if (matchedCategory) {
      cleanTitle = matchedCategory.name;
    }

    const startTime = app.start_time || "";
    const parts = startTime.split('T');
    const datePart = parts[0] || new Date().toISOString().split('T')[0];
    const timePart = (parts[1] || "09:00").substring(0, 5);

    setEditingApp(app)
    setAppEditForm({
      title: cleanTitle,
      date: datePart,
      time: timePart,
      status: app.status || "PROGRAMADA",
      notes: app.notes || ""
    })
    setAppHistoryView('edit')
  }

  const handleSaveApp = async () => {
    if (!editingApp) return;
    try {
      const updatedStartTime = `${appEditForm.date}T${appEditForm.time}:00`;
      // Calculate end time (keep duration)
      const oldStartDate = parseToDate(editingApp.start_time) || new Date();
      const oldEndDate = parseToDate(editingApp.end_time) || oldStartDate;
      const oldStart = oldStartDate.getTime();
      const oldEnd = oldEndDate.getTime();
      const duration = oldEnd - oldStart || 3600000;
      const newEnd = new Date(new Date(updatedStartTime).getTime() + duration).toISOString();

      await updateAppointment(editingApp.id, {
        title: appEditForm.title,
        start_time: updatedStartTime,
        end_time: newEnd,
        status: appEditForm.status as any,
        notes: appEditForm.notes
      });
      
      toast({ 
        title: "Cita actualizada",
        description: "Los cambios se han guardado correctamente.",
        className: "bg-emerald-600 border-none text-white"
      });
      setAppHistoryView('list');
      setEditingApp(null);
    } catch (error) {
      toast({ title: "Error al actualizar la cita", variant: "destructive" });
    }
  }

  const handleDeleteApp = async (id: string) => {
    setAppToDeleteId(id);
    setIsAppDeleteConfirmOpen(true);
  };

  const confirmDeleteApp = async () => {
    if (!appToDeleteId) return;
    try {
      const trashId = await trashAppointment(appToDeleteId);
      setIsAppDeleteConfirmOpen(false);
      setAppToDeleteId(null);
      
      toast({ 
        title: "Cita movida a la papelera", 
        description: "La cita se ha eliminado del historial.",
        className: "bg-slate-900 border-none text-white",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 border-white/20 hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-widest"
            onClick={async () => {
              try {
                await restoreAppointment(trashId);
                toast({ title: "Cita restaurada", className: "bg-emerald-600 border-none text-white" });
              } catch (e) {
                toast({ title: "Error al restaurar", variant: "destructive" });
              }
            }}
          >
            Deshacer
          </Button>
        )
      });
    } catch (error) {
      toast({ title: "Error al eliminar la cita", variant: "destructive" });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredPatients.map(p => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectPatient = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(pid => pid !== id))
    }
  }

  const confirmDelete = async () => {
    const options = { 
      deleteAppointments: deleteAssocAppointments, 
      deleteConversations: deleteAssocConversations,
      deleteCalls: deleteAssocCalls
    };

    if (patientToDelete === 'bulk') {
      await deletePatients(selectedIds, options);
      setSelectedIds([]);
      toast({ title: "Pacientes enviados a la papelera", description: "Los pacientes han sido eliminados correctamente." })
    } else if (patientToDelete) {
      const tId = await trashPatient(patientToDelete, options);
      setSelectedIds(prev => prev.filter(id => id !== patientToDelete))
      
      toast({ 
        title: "Paciente enviado a la papelera", 
        description: "El paciente estará disponible en la papelera durante 30 días.", 
        variant: "destructive",
        action: (
          <ToastAction altText="Deshacer" onClick={() => restorePatient(tId)}>
            Deshacer
          </ToastAction>
        ),
      })
    }
    setIsDeleteConfirmOpen(false)
    setPatientToDelete(null)
  }

  const confirmDeleteTag = () => {
    if (!tagToDelete) return;

    updateSettings({
      availableTags: availableTags.filter((t: any) => t.name !== tagToDelete.name)
    });

    if (removeTagFromPatients) {
      safePatients.forEach(p => {
        if (p.tags && p.tags.includes(tagToDelete.name)) {
          updatePatient(p.id, { tags: p.tags.filter(t => t !== tagToDelete.name) });
        }
      });
    }

    if (deletePatientsWithTag) {
      const patientsToKill = safePatients.filter(p => p.tags && p.tags.includes(tagToDelete.name)).map(p => p.id);
      if (patientsToKill.length > 0) {
        deletePatients(patientsToKill, { deleteAppointments: true, deleteConversations: true });
      }
    }

    setIsTagDeleteConfirmOpen(false);
    setTagToDelete(null);
    toast({ 
      title: "Etiqueta gestionada", 
      description: `La etiqueta ${tagToDelete.name} ha sido eliminada con las opciones seleccionadas.` 
    });
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredPatients = safePatients.filter(p => {
    const matchesSearch = (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.phone || "").includes(searchQuery)
    const matchesChannel = !filterChannel || normalizeChannel(p.first_contact_channel || "") === filterChannel
    const matchesTag = filterTag === "Todas" || (p.tags && p.tags.includes(filterTag))
    const hasAppointment = safeAppointments.some(a => a.patient_id === p.id)
    const matchesAppointment = filterAppointment === "Todas" || 
                               (filterAppointment === "Con Cita" && hasAppointment) ||
                               (filterAppointment === "Sin Cita" && !hasAppointment)

    return matchesSearch && matchesChannel && matchesTag && matchesAppointment
  })

  const handleToggleFormTag = (tagName: string) => {
    setFormTags(prev => 
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    )
  }

  const handleAddNewTag = () => {
    if (!newTagInput.trim()) return;
    const name = newTagInput.trim().toUpperCase();
    if (!availableTags.find((t: any) => t.name === name)) {
      updateSettings({
        availableTags: [...availableTags, { name, color: newTagColor }]
      });
    }
    if (!formTags.includes(name)) {
      setFormTags(prev => [...prev, name]);
    }
    setNewTagInput("");
    setNewTagColor("#3B82F6");
  }

  const handleUpdateTag = () => {
    if (!editingTag || !newTagInput.trim()) return;
    const newName = newTagInput.trim().toUpperCase();
    
    updateSettings({
      availableTags: availableTags.map((t: any) => 
        t.name === editingTag.originalName ? { name: newName, color: newTagColor } : t
      )
    });

    if (newName !== editingTag.originalName) {
      safePatients.forEach(p => {
        if (p.tags && p.tags.includes(editingTag.originalName)) {
          const updatedTags = p.tags.map(t => t === editingTag.originalName ? newName : t);
          updatePatient(p.id, { tags: updatedTags });
        }
      });
    }
    
    setEditingTag(null);
    setNewTagInput("");
    setNewTagColor("#3B82F6");
    toast({ title: "Etiqueta Actualizada", description: `La etiqueta ahora es ${newName}.` });
  }

  const handleExport = () => {
    toast({ title: "Copiando al portapapeles", description: "Se han exportado pacientes en formato CSV." })
  }

  if (!mounted) return null

  return (
    <>
      <main className="flex-1 px-12 py-10 overflow-y-auto no-scrollbar">
        <div className="flex items-end justify-between border-b border-slate-100 dark:border-border pb-6 mb-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">Pacientes</h1>
            <p className="text-sm font-medium text-slate-400 mt-0.5">Gestión integral de la base de datos de la clínica</p>
          </motion.div>
          
          <div className="flex items-center gap-2">
            <Dialog open={isTagsManagerOpen} onOpenChange={(open) => {
              setIsTagsManagerOpen(open);
              if (!open) setEditingTag(null);
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-11 rounded-2xl border-slate-100 dark:border-border bg-white dark:bg-background font-bold text-xs gap-2 transition-all active:scale-95 shadow-sm">
                  <Tag className="h-4 w-4" />
                  Etiquetas
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[850px] rounded-[32px] border-none shadow-2xl p-0 bg-white dark:bg-background overflow-hidden">
                <DialogTitle className="sr-only">Detalle del Paciente</DialogTitle>
                <div className="p-8">
                  <DialogHeader className="mb-8">
                    <DialogTitle className="text-xl font-black">Gestión de Etiquetas</DialogTitle>
                    <DialogDescription className="font-medium text-slate-400 text-xs">Administra y personaliza tus etiquetas de pacientes.</DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-2 gap-10">
                    {/* Col 1: Lista de Etiquetas */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Etiquetas Existentes</p>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {availableTags.map((t: any) => {
                          const isEditing = editingTag?.originalName === t.name;
                          return (
                            <div key={t.name} className={cn(
                              "flex items-center justify-between p-3 rounded-2xl border transition-all group",
                              isEditing ? "bg-blue-50/50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/30 shadow-sm" : "bg-slate-50 dark:bg-accent/10 border-slate-100 dark:border-border hover:border-slate-200 dark:hover:border-slate-700"
                            )}>
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: t.color }} />
                                <Badge 
                                  className="text-[9px] font-black uppercase tracking-widest h-6 border-none rounded-lg whitespace-nowrap"
                                  style={getTagStyle(t.color)}
                                >
                                  {t.name}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg"
                                  onClick={() => {
                                    setEditingTag({ name: t.name, originalName: t.name, color: t.color });
                                    setNewTagInput(t.name);
                                    setNewTagColor(t.color);
                                  }}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg"
                                  onClick={() => {
                                    setTagToDelete(t);
                                    setRemoveTagFromPatients(true);
                                    setDeletePatientsWithTag(false);
                                    setIsTagDeleteConfirmOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Col 2: Crear/Editar */}
                    <div className="space-y-6">
                      <div className="p-6 bg-slate-50 dark:bg-accent/10 rounded-[24px] border border-slate-100 dark:border-border">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 ml-1">
                          {editingTag ? "Editar Etiqueta" : "Nueva Etiqueta"}
                        </p>
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase text-slate-500 tracking-tight ml-1">Nombre</Label>
                            <div className="flex gap-2">
                              <Input 
                                placeholder="Nombre..." 
                                className="h-10 rounded-xl bg-white dark:bg-background border-slate-200 dark:border-slate-700 text-sm" 
                                value={newTagInput} 
                                onChange={(e) => setNewTagInput(e.target.value)} 
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') editingTag ? handleUpdateTag() : handleAddNewTag();
                                }}
                              />
                            </div>
                          </div>
                          
                          <ColorPicker color={newTagColor} onChange={setNewTagColor} />

                          <div className="pt-2 flex gap-2">
                            {editingTag ? (
                              <>
                                <Button 
                                  className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px]"
                                  onClick={handleUpdateTag}
                                >
                                  Guardar
                                </Button>
                                <Button 
                                  variant="ghost"
                                  className="h-11 px-4 rounded-xl text-slate-400 hover:text-slate-600"
                                  onClick={() => {
                                    setEditingTag(null);
                                    setNewTagInput("");
                                    setNewTagColor("#3B82F6");
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </>
                            ) : (
                              <Button 
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px]"
                                onClick={handleAddNewTag}
                              >
                                Crear Etiqueta
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddOpen} onOpenChange={(open) => {
              setIsAddOpen(open);
              if (!open) {
                setFormName("");
                setFormEmail("");
                setFormCountryCode("+34");
                setFormPhone("");
                setFormSource("");
                setFormTags([]);
                setNewTagInput("");
              }
            }}>
              <DialogTrigger asChild>
                <Button className="h-11 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-none gap-2 active:scale-95 transition-all">
                  <Plus className="h-4 w-4" />
                  Nuevo Paciente
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-[32px] border-none shadow-2xl p-0 bg-white dark:bg-background overflow-hidden">
              <DialogTitle className="sr-only">Historial de Llamadas</DialogTitle>
                <div className="p-8">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="text-xl font-black">Crear nuevo paciente</DialogTitle>
                    <DialogDescription className="font-medium text-slate-400 text-xs">Introduce los datos del nuevo miembro de la clínica.</DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Información Básica */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Información básica</p>
                      <div className="space-y-4 p-5 bg-slate-50 dark:bg-accent/10 rounded-2xl border border-slate-100 dark:border-border">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-slate-500 tracking-tight ml-1">Nombre Completo</Label>
                          <Input autoComplete="off" placeholder="Nombre..." className="h-10 rounded-xl bg-white dark:bg-background border-slate-200 dark:border-slate-700 text-sm" value={formName} onChange={(e) => setFormName(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-slate-500 tracking-tight ml-1">Email</Label>
                          <Input autoComplete="off" type="email" placeholder="juan@ejemplo.com" className="h-10 rounded-xl bg-white dark:bg-background border-slate-200 dark:border-slate-700 text-sm" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-slate-500 tracking-tight ml-1">Teléfono</Label>
                          <div className="flex gap-2">
                            <Select value={formCountryCode} onValueChange={setFormCountryCode}>
                              <SelectTrigger className="w-[100px] h-10 rounded-xl bg-white dark:bg-background border-slate-200 dark:border-slate-700 font-bold text-xs">
                                <SelectValue>
                                  <div className="flex items-center gap-2">
                                    <img src={`https://flagcdn.com/w20/${[
                                      { code: '+34', iso: 'es' }, { code: '+1', iso: 'us' }, { code: '+52', iso: 'mx' }, { code: '+44', iso: 'gb' },
                                      { code: '+33', iso: 'fr' }, { code: '+49', iso: 'de' }, { code: '+351', iso: 'pt' }, { code: '+54', iso: 'ar' },
                                      { code: '+57', iso: 'co' }, { code: '+56', iso: 'cl' }
                                    ].find(p => p.code === formCountryCode)?.iso || 'es'}.png`} width="16" className="rounded-sm" alt="" />
                                    <span>{formCountryCode}</span>
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-background border-slate-100 dark:border-border rounded-xl">
                                {[
                                  { code: '+34', iso: 'es' }, { code: '+1', iso: 'us' }, { code: '+52', iso: 'mx' }, { code: '+44', iso: 'gb' },
                                  { code: '+33', iso: 'fr' }, { code: '+49', iso: 'de' }, { code: '+351', iso: 'pt' }, { code: '+54', iso: 'ar' },
                                  { code: '+57', iso: 'co' }, { code: '+56', iso: 'cl' }
                                ].map((p) => (
                                  <SelectItem key={p.code} value={p.code} className="rounded-lg text-xs">
                                    <div className="flex items-center gap-2">
                                      <img src={`https://flagcdn.com/w20/${p.iso}.png`} width="16" className="rounded-sm" alt="" />
                                      <span>{p.code}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input autoComplete="off" placeholder="Número..." className="flex-1 h-10 rounded-xl bg-white dark:bg-background border-slate-200 dark:border-slate-700 text-sm" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-slate-500 tracking-tight ml-1">Canal de Origen</Label>
                          <Select value={formSource} onValueChange={setFormSource}>
                            <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-background border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500">
                              <SelectValue placeholder="Selecciona una opción" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 dark:border-border bg-white dark:bg-background">
                              {formChannels.map(ch => (
                                <SelectItem key={ch} value={ch} className="rounded-lg text-sm font-medium">{ch}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Etiquetas */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Seleccionar Etiquetas</p>
                      <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-accent/10 rounded-2xl border border-slate-100 dark:border-border max-h-[160px] overflow-y-auto no-scrollbar content-start">
                        {availableTags.length === 0 ? (
                          <p className="text-[10px] text-slate-400 font-medium italic w-full text-center py-2">No hay etiquetas disponibles</p>
                        ) : (
                          availableTags.map((t: any) => {
                            const isSelected = formTags.includes(t.name);
                            return (
                              <Badge 
                                key={t.name}
                                onClick={() => handleToggleFormTag(t.name)}
                                className={cn(
                                  "text-[9px] font-black uppercase tracking-widest h-7 border-none rounded-lg cursor-pointer transition-all",
                                  isSelected ? "ring-2 ring-offset-2 ring-blue-500 shadow-md" : "opacity-60 grayscale-[0.5] hover:opacity-100"
                                )}
                                style={getTagStyle(t.color)}
                              >
                                {t.name}
                              </Badge>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="mt-8 pt-6 border-t border-slate-50 dark:border-border">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-none" onClick={() => {
                      if (!formName) return;
                      addPatient({ 
                        name: formName, 
                        email: formEmail, 
                        phone: formPhone ? `${formCountryCode} ${formPhone}` : "", 
                        first_contact_channel: formSource, 
                        tags: formTags, 
                        notes: "" 
                      });
                      setIsAddOpen(false);
                      setFormName("");
                      setFormEmail("");
                      setFormPhone("");
                      setFormTags([]);
                      setFormSource("");
                      toast({ title: "Registrado", description: `${formName} añadido correctamente.` });
                    }}>
                      Completar Registro
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Buscar pacientes..." 
                className="w-full bg-white dark:bg-background border border-slate-100 dark:border-border rounded-2xl py-3 pl-11 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all shadow-sm shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className={cn("h-11 rounded-2xl border-slate-100 dark:border-border bg-white dark:bg-background font-bold text-xs gap-2", filterAppointment !== "Todas" && "bg-blue-50 dark:bg-accent/50 text-blue-600 border-blue-200")}>
                    <Clock className="h-4 w-4" />
                    {filterAppointment === "Todas" ? "Cita" : filterAppointment}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 dark:border-border p-1">
                  {["Todas", "Con Cita", "Sin Cita"].map(opt => (
                    <DropdownMenuItem key={opt} className="rounded-xl font-bold text-xs py-2.5 px-4" onClick={() => setFilterAppointment(opt)}>{opt}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className={cn("h-11 rounded-2xl border-slate-100 dark:border-border bg-white dark:bg-background font-bold text-xs gap-2", filterTag !== "Todas" && "bg-blue-50 dark:bg-accent/50 text-blue-600 border-blue-200")}>
                    <Tag className="h-4 w-4" />
                    {filterTag === "Todas" ? "Etiqueta" : filterTag}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 dark:border-border p-1 min-w-[160px]">
                  <DropdownMenuItem className="rounded-xl font-bold text-xs py-2.5 px-4" onClick={() => setFilterTag("Todas")}>Todas</DropdownMenuItem>
                  {availableTags.map((t: any) => (
                    <DropdownMenuItem key={t.name} className="rounded-xl font-bold text-xs py-2.5 px-4 flex items-center gap-2" onClick={() => setFilterTag(t.name)}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className={cn("h-11 rounded-2xl border-slate-100 dark:border-border bg-white dark:bg-background font-bold text-xs gap-2", filterChannel && "bg-blue-50 dark:bg-accent/50 text-blue-600 border-blue-200")}>
                    <MapPin className="h-4 w-4" />
                    {filterChannel || "Origen"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 dark:border-border p-1 min-w-[200px]">
                  <DropdownMenuItem className="rounded-xl font-bold text-xs py-2.5 px-4" onClick={() => setFilterChannel(null)}>Todos los canales</DropdownMenuItem>
                  {channels.map(ch => (
                    <DropdownMenuItem key={ch} className="rounded-xl font-bold text-xs py-2.5 px-4" onClick={() => setFilterChannel(ch)}>{ch}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Button 
                  variant="destructive" 
                  className="h-11 rounded-2xl font-bold text-xs gap-2 bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20 px-5" 
                  onClick={() => { setPatientToDelete('bulk'); setIsDeleteConfirmOpen(true); }}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar ({selectedIds.length})
                </Button>
              </motion.div>
            )}

            <Button variant="outline" className="h-11 rounded-2xl border-slate-100 dark:border-border bg-white dark:bg-background font-bold text-xs gap-2 shadow-sm shadow-none" onClick={handleExport}>
              <FileDown className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-background rounded-[32px] shadow-sm shadow-none border border-slate-50 dark:border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-accent/10">
              <TableRow className="border-slate-100 dark:border-border hover:bg-transparent">
                <TableHead className="w-12 px-6">
                  <Checkbox 
                    checked={filteredPatients.length > 0 && selectedIds.length === filteredPatients.length}
                    onCheckedChange={handleSelectAll}
                    className="border-slate-300 dark:border-slate-600 rounded-md data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Paciente</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-center">Contacto</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-center">Origen</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-center">Etiquetas</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-center">Ingreso</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-center">Interacciones</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right px-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-[400px] text-center border-none">
                    <div className="flex flex-col items-center justify-center h-full opacity-60">
                      <Users className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4 stroke-[1.5]" />
                      <p className="text-slate-500 dark:text-slate-400 font-bold text-xl tracking-tight">No hay pacientes aún</p>
                      <p className="text-slate-400/80 dark:text-slate-500 font-medium text-sm mt-1">Añade tu primer paciente para empezar a gestionar la clínica.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id} className={cn("border-slate-50 dark:border-border cursor-pointer hover:bg-slate-50 dark:hover:bg-accent group transition-colors", selectedIds.includes(patient.id) ? "bg-blue-50/50 dark:bg-blue-900/20" : "dark:bg-accent/10")}>
                  <TableCell className="px-6">
                    <Checkbox 
                      checked={selectedIds.includes(patient.id)}
                      onCheckedChange={(checked) => handleSelectPatient(patient.id, checked as boolean)}
                      className="border-slate-300 dark:border-slate-600 rounded-md data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-2xl bg-blue-50 dark:bg-accent/50 flex items-center justify-center text-blue-600 font-black text-sm group-hover:scale-110 transition-transform shadow-sm shadow-none shadow-blue-100">
                        {resolvePatientInitial(resolvePatientName(patient.phone, patient.name, "", safePatients, settings?.preferredDisplayName))}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-50 text-sm">{resolvePatientName(patient.phone, patient.name, "", safePatients, settings?.preferredDisplayName)}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {patient.id.toUpperCase()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex flex-col justify-center items-start text-xs font-semibold text-slate-600 dark:text-slate-300 gap-1 min-h-[40px] w-full items-center">
                      {(() => {
                        const hasRealEmail = patient.email && patient.email !== "test@test.com";
                        const phoneDigits = patient.phone.replace(/\D/g, '');
                        const hasRealPhone = phoneDigits.length > 3; 
                        
                        if (!hasRealEmail && !hasRealPhone) {
                          return <span className="text-slate-400 font-bold italic opacity-50">N/A</span>;
                        }

                        return (
                          <div className="flex flex-col items-start gap-1">
                            {hasRealEmail && (
                              <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-300" /> {patient.email}</span>
                            )}
                            {hasRealPhone && (
                              <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-300" /> {formatPhone(patient.phone)}</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#334155] border-none rounded-xl text-[10px] font-bold py-1 px-3">
                      {normalizeChannel(patient.first_contact_channel)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5 flex-wrap justify-center">
                      {(patient.tags || []).length > 0 ? (
                        (patient.tags || []).map(tag => {
                          const tagObj = availableTags.find((t: any) => t.name === tag);
                          return (
                            <Badge key={tag} className="text-[9px] font-black uppercase tracking-widest h-5 border-none rounded-lg" style={getTagStyle(tagObj?.color || '#64748B')}>
                              {tag}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-slate-400 italic font-medium">N/A</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-400 text-center uppercase tracking-tighter">
                    {mounted ? formatDate(patient.created_at) : "---"}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-50">
                        {(() => {
                          const cleanPPhone = patient.phone?.replace(/\D/g, '') || "";
                          const chatCount = conversations.filter(c => {
                            const cleanConvPhone = c.contact_identifier?.replace(/\D/g, '') || ""; 
                            return c.patient_id === patient.id || ( 
                              cleanPPhone.length >= 7 && cleanConvPhone.length >= 7 && (
                                cleanPPhone.endsWith(cleanConvPhone) || cleanConvPhone.endsWith(cleanPPhone)
                              )
                            );
                          }).length;
                          const callCount = calls.filter(c => {
                            const cleanCallPhone = c.phone_number?.replace(/\D/g, '') || ""; 
                                                        return c.patient_id === patient.id || (
                              cleanPPhone.length >= 7 && cleanCallPhone.length >= 7 && (
                                cleanPPhone.endsWith(cleanCallPhone) || cleanCallPhone.endsWith(cleanPPhone)
                              )
                            );
                          }).length;
                          const trashedCount = trash.filter(t => {
                                                        const matchById = t.patient_id === patient.id;
                            let matchByPhone = false;

                            if (t.type === 'conversation' && t.data.conversation) {
                                                            const cleanConvPhone = t.data.conversation.contact_identifier?.replace(/\D/g, '') || ""; 
                                                                                                 matchByPhone = cleanPPhone.length >= 7 && cleanConvPhone.length >= 7 && (
                                cleanPPhone.endsWith(cleanConvPhone) || cleanConvPhone.endsWith(cleanPPhone)
                              );
                            }
                                                        else if (t.type === 'call' && t.data.call) {
                                                            const cleanCallPhone = t.data.call.phone_number?.replace(/\D/g, '') || ""; 
                                                                   matchByPhone = cleanPPhone.length >= 7 && cleanCallPhone.length >= 7 && (
                                cleanPPhone.endsWith(cleanCallPhone) || cleanCallPhone.endsWith(cleanPPhone)
                              );
                            }
                            else if (t.type === 'appointment' && t.data.appointment) {
                              const cleanAppPhone = t.data.appointment.patient_phone?.replace(/\D/g, '') || "";
                              matchByPhone = cleanPPhone.length >= 7 && cleanAppPhone.length >= 7 && (
                                cleanPPhone.endsWith(cleanAppPhone) || cleanAppPhone.endsWith(cleanPPhone)
                              );
                            }
                            return matchById || matchByPhone;
                          }).length;
                          return chatCount + callCount + trashedCount;
                        })()}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 text-right">
                    <div className="flex justify-end gap-1 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white rounded-xl transition-all" onClick={() => { setSelectedPatient(patient); setIsAppointmentsOpen(true); }}>
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#334155] rounded-xl">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 dark:border-border w-44 p-1">
                          <DropdownMenuItem 
                            onSelect={() => {
                              setSelectedPatient(patient);
                              setIsInfoOpen(true);
                            }}
                            className="rounded-xl p-3 font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:bg-blue-50 focus:text-blue-600 dark:focus:bg-blue-500/10"
                          >
                            <User className="h-4 w-4 mr-2" /> Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onSelect={() => { 
                              setPatientToDelete(patient.id); 
                              setTimeout(() => setIsDeleteConfirmOpen(true), 100); 
                            }}
                            className="rounded-xl p-3 font-bold text-red-500 cursor-pointer focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl p-8 bg-white dark:bg-background">
            <DialogTitle className="sr-only">Añadir Paciente</DialogTitle>
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-black">Información del paciente</DialogTitle>
            </DialogHeader>
            {selectedPatient && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-accent/10 rounded-3xl border border-slate-100 dark:border-border">
                  <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-none">
                    {resolvePatientInitial(resolvePatientName(selectedPatient.phone, selectedPatient.name, "", safePatients, settings?.preferredDisplayName))}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">{resolvePatientName(selectedPatient.phone, selectedPatient.name, "", safePatients, settings?.preferredDisplayName)}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {selectedPatient.id.toUpperCase()}</p>
                  </div>
                </div>
                
                <div className="space-y-4 px-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-accent/10 rounded-xl"><Mail className="h-4 w-4 text-slate-400" /></div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {selectedPatient.email && selectedPatient.email !== "test@test.com" ? selectedPatient.email : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-accent/10 rounded-xl"><Phone className="h-4 w-4 text-slate-400" /></div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {selectedPatient.phone && selectedPatient.phone.replace(/\D/g, '').length > 3 ? formatPhone(selectedPatient.phone) : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-accent/10 rounded-xl"><MapPin className="h-4 w-4 text-slate-400" /></div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Origen: {normalizeChannel(selectedPatient.first_contact_channel)}</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-3 ml-1 tracking-widest">Etiquetas</p>
                    <div className="flex gap-2 flex-wrap">
                      {(selectedPatient.tags || []).filter(t => t !== "Llamada").length > 0 ? (
                        (selectedPatient.tags || []).filter(t => t !== "Llamada").map(tag => {
                          const tagData = availableTags.find((t: any) => t.name === tag);
                          return (
                            <Badge 
                              key={tag} 
                              style={tagData ? getTagStyle(tagData.color) : getTagStyle("#3B82F6")}
                              className="font-black border-none px-3 py-1 rounded-lg text-[9px] uppercase tracking-wider"
                            >
                              {tag}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-xs text-slate-400 italic font-medium">N/A</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 mt-4">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 h-11 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-none" 
                    onClick={() => {
                      setIsInfoOpen(false);
                      setTimeout(() => {
                        handleEditOpen(selectedPatient);
                      }, 300);
                    }}
                  >
                    Editar Perfil
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full h-11 rounded-2xl font-bold text-slate-400 hover:text-slate-600" 
                    onClick={() => setIsInfoOpen(false)}
                  >
                    Hecho
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isAppointmentsOpen} onOpenChange={(open) => {
          setIsAppointmentsOpen(open);
          if (!open) {
            setAppHistoryView('list');
            setEditingApp(null);
          }
        }}>
          <DialogContent className="rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-background sm:max-w-[520px]">
            <DialogTitle className="sr-only">Historial de Citas</DialogTitle>
            
            {/* Header */}
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {appHistoryView === 'edit' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-accent/20" 
                      onClick={() => setAppHistoryView('list')}
                    >
                      <ArrowLeft className="h-5 w-5 text-slate-400" />
                    </Button>
                  )}
                  <DialogTitle className="text-lg font-black">
                    {appHistoryView === 'list' ? 'Historial de Citas' : 'Editar Cita'}
                  </DialogTitle>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-2">
              {appHistoryView === 'list' ? (
                <div className="space-y-3 max-h-[450px] overflow-y-auto px-1 pr-1 pb-4">
                  {(() => {
                    if (!selectedPatient) return null;
                    
                    const cleanPPhone = selectedPatient.phone?.replace(/\D/g, '') || "";
                    const patientAppointments = [
                      ...safeAppointments,
                      ...trash
                        .filter(t => t.type === 'appointment' && t.data.appointment)
                        .map(t => ({ ...t.data.appointment!, isDeleted: true }))
                    ]
                      .filter((app, index, self) => {
                        // Deduplicate by ID
                        if (self.findIndex(a => a.id === app.id) !== index) return false;
                        const cleanAppPhone = app.patient_phone?.replace(/\D/g, '') || "";
                        const matchById = app.patient_id === selectedPatient.id;
                        const matchByPhone = cleanPPhone.length >= 7 && cleanAppPhone.length >= 7 && (
                          cleanPPhone.endsWith(cleanAppPhone) || cleanAppPhone.endsWith(cleanPPhone)
                        );
                        return matchById || matchByPhone;
                      })
                      .sort((a, b) => (parseToDate(b.start_time)?.getTime() || 0) - (parseToDate(a.start_time)?.getTime() || 0));

                    if (patientAppointments.length > 0) {
                      return patientAppointments.map(app => (
                        <div 
                          key={app.id} 
                          className="p-4 bg-white dark:bg-background border border-slate-100 dark:border-border rounded-[24px] hover:border-blue-200 transition-all group relative mr-2 shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-accent/10 flex flex-col items-center justify-center text-slate-900 dark:text-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                              <span className="text-[9px] font-black uppercase opacity-60 group-hover:opacity-100">{mounted ? (parseToDate(app.start_time)?.toLocaleDateString('es-ES', { weekday: 'short' }) || '---') : ''}</span>
                              <span className="text-lg font-black leading-none mt-0.5">{mounted ? (parseToDate(app.start_time)?.getDate() || '?') : ''}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                {(() => {
                                  const cleanTitle = (app.title || app.treatment || "Cita").replace(/^(Tratamiento|Servicio):\s*/i, '');
                                  const matchedCategory = appointmentCategories.find(c => 
                                    c.name.toLowerCase() === cleanTitle.toLowerCase() || 
                                    c.name.toLowerCase().startsWith(cleanTitle.toLowerCase()) || 
                                    cleanTitle.toLowerCase().startsWith(c.name.toLowerCase())
                                  );
                                  const displayName = matchedCategory ? matchedCategory.name : cleanTitle;
                                  const dotColor = matchedCategory ? matchedCategory.color : "bg-slate-400";
                                  return (
                                    <>
                                      <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", dotColor)} />
                                      <p className="font-black text-sm text-slate-900 dark:text-slate-50 truncate">{displayName}</p>
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center gap-2.5">
                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tight">
                                  <Clock className="h-3 w-3" />
                                  {mounted ? (parseToDate(app.start_time)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '--:--') : ''}
                                </p>
                                <Badge className={cn("rounded-lg px-1.5 py-0 text-[7px] font-black uppercase tracking-wider border-none", 
                                  app.isDeleted ? 'bg-red-50 dark:bg-red-500/10 text-red-600' :
                                  app.status === 'confirmada' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 
                                  app.status === 'programada' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' :
                                  app.status === 'completada' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' :
                                  app.status === 'cancelada' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600' :
                                  'bg-slate-100 text-slate-400'
                                )}>
                                  {app.isDeleted ? 'Papelera' : app.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                onClick={() => handleEditAppOpen(app)}
                                title="Editar cita"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                onClick={() => handleDeleteApp(app.id)}
                                title="Eliminar cita"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                onClick={() => router.push(`/calendar?appointmentId=${app.id}`)}
                                title="Ver en calendario"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ));
                    }

                    return (
                      <div className="text-center py-10">
                        <CalendarIcon className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                        <p className="text-slate-400 text-sm font-bold italic">No hay citas registradas</p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Paciente</Label>
                    <Input 
                      className="h-11 rounded-xl bg-white dark:bg-background border-slate-200 dark:border-slate-700 font-bold" 
                      value={selectedPatient?.name || ""} 
                      readOnly
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipo de Cita</Label>
                    <Select 
                      value={appEditForm.title} 
                      onValueChange={(val) => setAppEditForm({...appEditForm, title: val})}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-background border-slate-200 dark:border-slate-700 font-bold shadow-none">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl p-1">
                        {(!appointmentCategories.find(i => i.name === appEditForm.title) && appEditForm.title) && (
                          <SelectItem value={appEditForm.title} className="rounded-xl font-bold text-blue-600 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-slate-300 dark:bg-slate-700" />
                              <span>{appEditForm.title}</span>
                            </div>
                          </SelectItem>
                        )}
                        {appointmentCategories.map(cat => (
                          <SelectItem key={cat.name} value={cat.name} className="rounded-xl font-bold cursor-pointer">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", cat.color)} />
                              <span>{cat.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fecha</Label>
                      <Popover open={isAppDatePickerOpen} onOpenChange={setIsAppDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-11 w-full justify-start text-left font-bold rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-background shadow-none",
                              !appEditForm.date && "text-slate-400"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                            {appEditForm.date ? format(new Date(appEditForm.date), "PPP", { locale: es }) : <span>Elegir fecha</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[360px] p-0 rounded-[32px] overflow-hidden border-slate-100 shadow-2xl z-[99999]" align="center" side="top" sideOffset={10}>
                          <div className="bg-blue-600 p-4 text-white">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Editar Fecha de Cita</p>
                            <p className="text-xl font-black mt-1">
                              {appEditForm.date ? format(new Date(appEditForm.date), "EEEE, d 'de' MMMM", { locale: es }) : "Seleccionar"}
                            </p>
                          </div>
                          <CalendarUI
                            mode="single"
                            selected={appEditForm.date ? new Date(appEditForm.date) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                setAppEditForm({...appEditForm, date: format(date, "yyyy-MM-dd")});
                                setIsAppDatePickerOpen(false);
                              }
                            }}
                            initialFocus
                            className="bg-white dark:bg-background"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Horas Disponibles</Label>
                      <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto no-scrollbar p-1">
                        {Array.from({ 
                          length: Math.floor(((settings?.closingHour || 18) - (settings?.openingHour || 9)) * 60 / (settings?.appointmentInterval || 30)) + (settings?.allowBookingAtClosingHour ? 1 : 0) 
                        }).map((_, i) => {
                          const totalMinutes = i * (settings?.appointmentInterval || 30);
                          const hour = (settings?.openingHour || 9) + Math.floor(totalMinutes / 60);
                          const minute = totalMinutes % 60;
                          
                          if (!settings?.allowBookingAtClosingHour && hour >= (settings?.closingHour || 18)) return null;
                          if (settings?.allowBookingAtClosingHour && hour > (settings?.closingHour || 18)) return null;
                          if (settings?.allowBookingAtClosingHour && hour === (settings?.closingHour || 18) && minute > 0) return null;

                          const h = String(hour).padStart(2, '0');
                          const m = String(minute).padStart(2, '0');
                          const timeStr = `${h}:${m}`;
                          const isSelected = appEditForm.time === timeStr;
                          
                          const isOccupied = safeAppointments.some(a => 
                            a.id !== editingApp?.id && 
                            a.start_time.startsWith(`${appEditForm.date}T${timeStr}`) &&
                            a.status !== 'cancelada'
                          );

                          return (
                              <button
                                key={timeStr}
                                type="button"
                                disabled={isOccupied}
                                onClick={() => setAppEditForm({...appEditForm, time: timeStr})}
                                className={cn(
                                  "py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all border",
                                  isSelected 
                                    ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                                    : isOccupied
                                      ? "bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-slate-100 dark:border-slate-800 cursor-not-allowed opacity-50"
                                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                )}
                              >
                                {timeStr}
                              </button>
                            );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Notas Clínicas</Label>
                      <textarea 
                        className="w-full h-20 p-3 rounded-xl bg-white dark:bg-background border border-slate-200 dark:border-slate-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                        placeholder="Añadir comentarios clínicos..."
                        value={appEditForm.notes}
                        onChange={(e) => setAppEditForm({...appEditForm, notes: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="p-6 pt-2">
              {appHistoryView === 'list' ? (
                <Button 
                  className="w-full bg-slate-900 hover:bg-slate-800 h-11 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg" 
                  onClick={() => setIsAppointmentsOpen(false)}
                >
                  Cerrar Historial
                </Button>
              ) : (
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-600" 
                    onClick={() => setAppHistoryView('list')}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 h-11 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200 transition-all active:scale-95" 
                    onClick={handleSaveApp}
                  >
                    Guardar Cambios
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setFormName("");
            setFormEmail("");
            setFormCountryCode("+34");
            setFormPhone("");
            setFormSource("");
            setFormTags([]);
            setNewTagInput("");
            setSelectedPatient(null);
          }
        }}>
          <DialogContent 
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="sm:max-w-[480px] rounded-[32px] border-none shadow-2xl p-0 bg-white dark:bg-background overflow-hidden"
          >
            <div className="p-8">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-xl font-black">Editar Paciente</DialogTitle>
                <DialogDescription className="font-medium text-slate-400 text-xs">Actualiza los datos del miembro en la clínica.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Información Básica */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Información básica</p>
                  <div className="space-y-4 p-5 bg-slate-50 dark:bg-accent/10 rounded-2xl border border-slate-100 dark:border-border">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-500 tracking-tight ml-1">Nombre</Label>
                      <Input autoComplete="off" placeholder="Nombre..." className="h-10 rounded-xl bg-white dark:bg-background border-slate-200 dark:border-slate-700 text-sm" value={formName} onChange={(e) => setFormName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-500 tracking-tight ml-1">Email</Label>
                      <Input autoComplete="off" type="email" placeholder="juan@ejemplo.com" className="h-10 rounded-xl bg-white dark:bg-background border-slate-200 dark:border-slate-700 text-sm" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-500 tracking-tight ml-1">Teléfono</Label>
                      <div className="flex gap-2">
                        <Select value={formCountryCode} onValueChange={setFormCountryCode}>
                          <SelectTrigger className="w-[100px] h-10 rounded-xl bg-white dark:bg-background border-slate-200 dark:border-slate-700 font-bold text-xs">
                            <SelectValue>
                              <div className="flex items-center gap-2">
                                <img src={`https://flagcdn.com/w20/${[
                                  { code: '+34', iso: 'es' }, { code: '+1', iso: 'us' }, { code: '+52', iso: 'mx' }, { code: '+44', iso: 'gb' },
                                  { code: '+33', iso: 'fr' }, { code: '+49', iso: 'de' }, { code: '+351', iso: 'pt' }, { code: '+54', iso: 'ar' },
                                  { code: '+57', iso: 'co' }, { code: '+56', iso: 'cl' }
                                ].find(p => p.code === formCountryCode)?.iso || 'es'}.png`} width="16" className="rounded-sm" alt="" />
                                <span>{formCountryCode}</span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-background border-slate-100 dark:border-border rounded-xl">
                            {[
                              { code: '+34', iso: 'es' }, { code: '+1', iso: 'us' }, { code: '+52', iso: 'mx' }, { code: '+44', iso: 'gb' },
                              { code: '+33', iso: 'fr' }, { code: '+49', iso: 'de' }, { code: '+351', iso: 'pt' }, { code: '+54', iso: 'ar' },
                              { code: '+57', iso: 'co' }, { code: '+56', iso: 'cl' }
                            ].map((p) => (
                              <SelectItem key={p.code} value={p.code} className="rounded-lg text-xs">
                                <div className="flex items-center gap-2">
                                  <img src={`https://flagcdn.com/w20/${p.iso}.png`} width="16" className="rounded-sm" alt="" />
                                  <span>{p.code}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input autoComplete="off" placeholder="Número..." className="flex-1 h-10 rounded-xl bg-white dark:bg-background border-slate-200 dark:border-slate-700 text-sm" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Etiquetas */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Etiquetas del Paciente</p>
                  <div className="flex flex-wrap gap-2 p-5 bg-slate-50 dark:bg-accent/10 rounded-2xl border border-slate-100 dark:border-border max-h-[160px] overflow-y-auto no-scrollbar content-start">
                    {availableTags.length === 0 ? (
                      <p className="text-[10px] text-slate-400 font-medium italic p-2 text-center w-full">No hay etiquetas disponibles</p>
                    ) : (
                      availableTags.map((t: any) => {
                        const isSelected = formTags.includes(t.name);
                        return (
                          <Badge 
                            key={t.name}
                            onClick={() => handleToggleFormTag(t.name)}
                            className={cn(
                              "text-[9px] font-black uppercase tracking-widest h-7 border-none rounded-lg cursor-pointer transition-all",
                              isSelected ? "ring-2 ring-offset-2 ring-blue-500 shadow-md" : "opacity-60 grayscale-[0.5] hover:opacity-100"
                            )}
                            style={getTagStyle(t.color)}
                          >
                            {t.name}
                          </Badge>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-8 pt-6 border-t border-slate-50 dark:border-border">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-none" onClick={() => {
                  if (!formName || !selectedPatient) return;
                  updatePatient(selectedPatient.id, { 
                    name: formName, 
                    email: formEmail, 
                    phone: formPhone ? `${formCountryCode} ${formPhone}` : "", 
                    tags: formTags 
                  });
                  setIsEditOpen(false);
                  toast({ title: "Datos Actualizados", description: `El perfil de ${formName} ha sido guardado correctamente.` });
                }}>
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[32px] p-8 border-slate-100 dark:border-border bg-white dark:bg-background text-center">
          <DialogTitle className="sr-only">Confirmar Eliminación</DialogTitle>
          <DialogHeader className="flex flex-col items-center">
            <div className="h-16 w-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50">¿Eliminar {patientToDelete === 'bulk' ? 'Pacientes' : 'Paciente'}?</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 mb-4">
              {patientToDelete === 'bulk' 
                ? `Estás a punto de eliminar ${selectedIds.length} pacientes del sistema. ¿Qué otros datos asociados deseas eliminar?` 
                : "Estás a punto de eliminar este paciente del sistema. ¿Qué otros datos asociados deseas eliminar?"
              }
            </DialogDescription>
            <div className="flex flex-col gap-3 w-full text-left bg-slate-50 dark:bg-accent/10 p-4 rounded-2xl border border-slate-100 dark:border-border">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="delete-appointments" 
                  checked={deleteAssocAppointments} 
                  onCheckedChange={(c) => setDeleteAssocAppointments(c as boolean)} 
                  className="border-slate-300 dark:border-slate-600 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                />
                <label htmlFor="delete-appointments" className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                  Eliminar citas asociadas
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="delete-conversations" 
                  checked={deleteAssocConversations} 
                  onCheckedChange={(c) => setDeleteAssocConversations(c as boolean)} 
                  className="border-slate-300 dark:border-slate-600 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                />
                <label htmlFor="delete-conversations" className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                  Eliminar conversaciones asociadas
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="delete-calls" 
                  checked={deleteAssocCalls} 
                  onCheckedChange={(c) => setDeleteAssocCalls(c as boolean)} 
                  className="border-slate-300 dark:border-slate-600 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                />
                <label htmlFor="delete-calls" className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                  Eliminar historial de llamadas
                </label>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex gap-3 mt-6 sm:justify-center">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:text-slate-900 border-slate-200 dark:border-slate-700" 
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1 h-12 rounded-2xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20" 
              onClick={confirmDelete}
            >
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación de Etiqueta */}
      <Dialog open={isTagDeleteConfirmOpen} onOpenChange={setIsTagDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[32px] p-8 border-slate-100 dark:border-border bg-white dark:bg-background text-center">
          <DialogTitle className="sr-only">Confirmar Eliminación Masiva</DialogTitle>
          <DialogHeader className="flex flex-col items-center">
            <div className="h-16 w-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50">¿Eliminar Etiqueta?</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 mb-4 text-center">
              Estás a punto de eliminar la etiqueta <span className="font-bold text-red-600">{tagToDelete?.name}</span>. ¿Qué deseas hacer con los datos asociados?
            </DialogDescription>
            
            <div className="flex flex-col gap-3 w-full text-left bg-slate-50 dark:bg-accent/10 p-4 rounded-2xl border border-slate-100 dark:border-border">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="remove-from-patients" 
                  checked={removeTagFromPatients} 
                  onCheckedChange={(c) => setRemoveTagFromPatients(c as boolean)} 
                  className="border-slate-300 dark:border-slate-600 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                />
                <label htmlFor="remove-from-patients" className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1.5 flex-1">
                  Quitar etiqueta de los contactos
                  <span className="relative group/tip1 cursor-help">
                    <Info className="h-3.5 w-3.5 text-slate-400 hover:text-blue-500 transition-colors shrink-0" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium rounded-xl px-3 py-2 shadow-xl opacity-0 group-hover/tip1:opacity-100 transition-opacity duration-75 pointer-events-none z-50 text-left leading-relaxed">
                      La etiqueta desaparece del perfil de cada contacto, pero los contactos permanecen en el sistema.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
                    </div>
                  </span>
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="delete-patients-with-tag" 
                  checked={deletePatientsWithTag} 
                  onCheckedChange={(c) => setDeletePatientsWithTag(c as boolean)} 
                  className="border-slate-300 dark:border-slate-600 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                />
                <label htmlFor="delete-patients-with-tag" className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1.5 flex-1">
                  Eliminar contactos con esta etiqueta
                  <span className="relative group/tip2 cursor-help">
                    <Info className="h-3.5 w-3.5 text-slate-400 hover:text-orange-500 transition-colors shrink-0" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium rounded-xl px-3 py-2 shadow-xl opacity-0 group-hover/tip2:opacity-100 transition-opacity duration-75 pointer-events-none z-50 text-left leading-relaxed">
                      ⚠️ Se borrarán <strong>definitivamente</strong> todos los contactos que tengan asignada esta etiqueta, junto a sus conversaciones.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
                    </div>
                  </span>
                </label>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex gap-3 mt-6 sm:justify-center">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:text-slate-900 border-slate-200 dark:border-slate-700" 
              onClick={() => setIsTagDeleteConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1 h-12 rounded-2xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20" 
              onClick={confirmDeleteTag}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isAppDeleteConfirmOpen} onOpenChange={setIsAppDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[32px] p-8 border-none shadow-2xl bg-white dark:bg-background text-center">
          <DialogTitle className="sr-only">Confirmar Eliminación de Cita</DialogTitle>
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50">¿Eliminar esta cita?</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 mb-8 px-4">
              La cita se moverá a la papelera. Podrás restaurarla si lo deseas.
            </p>
            
            <div className="flex flex-col gap-3 w-full">
              <Button 
                className="w-full bg-red-500 hover:bg-red-600 h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-red-200 dark:shadow-none"
                onClick={confirmDeleteApp}
              >
                Eliminar Cita
              </Button>
              <Button 
                variant="ghost" 
                className="w-full h-12 rounded-2xl font-bold text-slate-400 hover:text-slate-600"
                onClick={() => setIsAppDeleteConfirmOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

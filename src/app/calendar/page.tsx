"use client"

import React, { useState, useEffect } from "react"
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  Check,
  Settings2,
  MoreHorizontal,
  Trash2,
  X,
  Clock,
  Mail,
  Phone,
  User,
  Stethoscope,
  Copy,
  ExternalLink,
  MessageSquare,
  MapPin,
  RefreshCcw,
  Headphones,
  AlertCircle,
  Download,
  ArrowLeft,
  ArrowRight,
  UserPlus
} from "lucide-react"
import { resolvePatientName } from "@/lib/patient-utils"
import { useRouter, useSearchParams } from "next/navigation"
import { cn, parseToDate } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import JSZip from "jszip"
import { CallAudioPlayer } from "@/components/conversations/call-audio-player"
import { useData } from "@/context/data-context"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { SidebarNav } from "@/components/layout/sidebar-nav"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Appointment } from "@/lib/mock-data"

const formatPhone = (phone: string | undefined | null) => {
  if (!phone) return "---";
  let cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.startsWith('34') && cleaned.length === 11) {
    cleaned = cleaned.slice(2);
  }
  
  if (cleaned.length === 9) {
    return `+34 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone.startsWith('+') ? phone : `+${phone}`;
};

// Helper to resolve the best name for a patient (moved to @/lib/patient-utils)

const resolvePatientPhone = (app: any, patients: any[]) => {
  if (app.patient_id) {
    const p = patients.find(p => p.id === app.patient_id);
    if (p) return p.phone;
  }
  return app.patient_phone;
};

const getStatusColor = (status: string | undefined | null) => {
  if (!status) return '#6366f1'
  switch (status.toLowerCase()) {
    case 'confirmada': return '#10b981'
    case 'cancelada': return '#ef4444'
    case 'completada': return '#3b82f6'
    default: return '#6366f1'
  }
}

const AppointmentItem = ({ 
  app, 
  onClick, 
  onContextMenu,
  isFullWidth = false,
  patients = [],
  preferredDisplayName = 'profile'
}: { 
  app: Appointment, 
  onClick: (app: Appointment) => void,
  onContextMenu: (e: React.MouseEvent, appId: string) => void,
  isFullWidth?: boolean,
  patients?: any[],
  preferredDisplayName?: 'profile' | 'conversation'
}) => {
  const time = parseToDate(app.start_time)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) || '--:--'
  const color = getStatusColor(app.status)
  const patientName = resolvePatientName(app.patient_phone, app.patient_name, "", patients, preferredDisplayName)
  
  return (
    <div 
      onClick={(e) => {
        e.stopPropagation()
        onClick(app)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu(e, app.id)
      }}
      className={cn(
        "group flex items-center cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-800",
        isFullWidth ? "w-full mb-1 px-3 py-2 gap-3 rounded-lg" : "mb-0.5 px-1.5 py-0.5 gap-1.5 rounded-[4px]"
      )}
    >
      <div 
        className={cn("rounded-full flex-shrink-0", isFullWidth ? "w-2.5 h-2.5" : "w-1.5 h-1.5")} 
        style={{ backgroundColor: color }}
      />
      <span className={cn("font-medium text-slate-500 whitespace-nowrap", isFullWidth ? "text-xs" : "text-[10px]")}>{time}</span>
      <span className={cn("font-semibold text-slate-900 dark:text-slate-200 truncate", isFullWidth ? "text-sm" : "text-[10px]")}>
        {patientName}
      </span>
      <Stethoscope className={cn("ml-auto opacity-0 group-hover:opacity-40 transition-opacity text-slate-400", isFullWidth ? "w-4 h-4" : "w-2.5 h-2.5")} />
    </div>
  )
}


const CHANNEL_MAP: Record<string, string> = {
  "n8n Chatbot": "Chatbot web",
  "n8n chatbot": "Chatbot web",
  "chatbot web": "Chatbot web",
  "Chatbot Web": "Chatbot web",
  "Chatbot WhatsApp": "Chatbot WhatsApp",
  "Agente de voz": "Agente de voz",
  "Llamada VoIP": "Agente de voz",
  "voip": "Agente de voz",
  "Instagram": "Instagram",
}

const normalizeChannel = (channel: string): string =>
  CHANNEL_MAP[channel] ?? channel;

const getTagStyle = (hexColor: string) => {
  if (!hexColor || !hexColor.startsWith('#')) return { backgroundColor: '#64748B20', color: '#64748B' };
  const bg = `${hexColor}20`;
  return {
    backgroundColor: bg,
    color: hexColor,
    border: `1px solid ${hexColor}40`
  };
}

export default function CalendarPage() {
  const { 
    appointments, 
    patients, 
    addAppointment, 
    updateAppointment, 
    deleteAppointment, 
    restoreAppointment, 
    addPatient, 
    settings,
    calls,
    conversations
  } = useData()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<'Day' | 'Week' | 'Month'>('Month')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'Users' | 'Calendars' | 'Groups'>('Calendars')
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isEditDatePickerOpen, setIsEditDatePickerOpen] = useState(false)
  const viewOrder = { Day: 0, Week: 1, Month: 2 }
  const prevViewRef = React.useRef<'Day' | 'Week' | 'Month'>('Month')
  const [viewDirection, setViewDirection] = useState<1 | -1>(1)
  
  // Detail/Edit state
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Patient Profile states
  const [isPatientInfoOpen, setIsPatientInfoOpen] = useState(false)
  const [isCallHistoryDialogOpen, setIsCallHistoryDialogOpen] = useState(false)
  const [selectedPatientForInfo, setSelectedPatientForInfo] = useState<any>(null)
  
  // Estados para el calendario mejorado
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, appId: string } | null>(null)
  const [moreAppointments, setMoreAppointments] = useState<{ date: Date, apps: any[] } | null>(null)
  const [returnToMoreAppointments, setReturnToMoreAppointments] = useState<{ date: Date, apps: any[] } | null>(null)
  const [deleteAppId, setDeleteAppId] = useState<string | null>(null)
  
  // Form state
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState("")
  
  // Safe default ISO date for the new appointment form
  const [formDate, setFormDate] = useState("")
  
  useEffect(() => {
    setFormDate(new Date().toISOString().split('T')[0])
  }, [])
  
  const [formTime, setFormTime] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [patientSuggestions, setPatientSuggestions] = useState<Patient[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const [calendarItems, setCalendarItems] = useState([
    { id: '1', name: "Consulta General", checked: true, color: "bg-blue-500" },
    { id: '2', name: "Ortodoncia", checked: true, color: "bg-emerald-500" },
    { id: '3', name: "Ortodoncia invisible", checked: true, color: "bg-teal-500" },
    { id: '4', name: "Implantes dentales", checked: true, color: "bg-indigo-500" },
    { id: '5', name: "Periodoncia", checked: true, color: "bg-amber-500" },
    { id: '6', name: "Estética dental", checked: true, color: "bg-pink-500" },
    { id: '7', name: "Cirugía oral", checked: true, color: "bg-purple-500" },
    { id: '8', name: "Odontopediatría", checked: true, color: "bg-orange-500" },
  ])

  const [isManageFiltersOpen, setIsManageFiltersOpen] = useState(false)
  const [newFilterName, setNewFilterName] = useState("")
  const [newFilterColor, setNewFilterColor] = useState("bg-blue-500")
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  
  const searchParams = useSearchParams()
  const appointmentIdParam = searchParams.get('appointmentId')

  // Handle direct appointment link from patients history
  useEffect(() => {
    if (appointmentIdParam && mounted && appointments.length > 0) {
      const app = appointments.find(a => a.id === appointmentIdParam)
      if (app) {
        const d = parseToDate(app.start_time);
        if (d) {
          setSelectedApp(app)
          setIsDetailOpen(true)
          setCurrentDate(d)
        }
        // If the view is Month, ensure we are in the right month
        // (setCurrentDate already does that if currentDate is used in getDaysForView)
      }
    }
  }, [appointmentIdParam, mounted, appointments])


  const toggleFilter = (id: string) => {
    setCalendarItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  const addFilter = () => {
    const trimmedName = newFilterName.trim()
    if (!trimmedName) {
      toast({ title: "Introduce un nombre para la categoría", variant: "destructive" })
      return
    }
    const id = Math.random().toString(36).substr(2, 9)
    setCalendarItems(prev => [...prev, { id, name: trimmedName, checked: true, color: newFilterColor }])
    setNewFilterName("")
    setNewFilterColor("bg-blue-500")
    toast({ title: "✓ Categoría añadida", description: `"${trimmedName}" ya aparece en el calendario.` })
  }

  const deleteFilter = (id: string) => {
    setCalendarItems(prev => prev.filter(item => item.id !== id))
    setDeleteConfirmId(null)
    toast({ title: "Filtro eliminado" })
  }

  const handleCreatePatientFromApp = async () => {
    if (!selectedApp) return;
    try {
      const patientId = await addPatient({
        name: selectedApp.patient_name,
        phone: selectedApp.patient_phone || "",
        email: "",
        first_contact_channel: selectedApp.source || "Manual",
        tags: ["NUEVO PACIENTE", "MANUAL"],
        notes: `Creado desde cita: ${selectedApp.notes || ""}`
      });
      
      // Link appointment to new patient
      await updateAppointment(selectedApp.id, { patient_id: patientId });
      setSelectedApp({ ...selectedApp, patient_id: patientId });
      toast({ 
        title: "Paciente creado con éxito",
        description: "La cita ha sido vinculada al nuevo perfil.",
        className: "bg-emerald-600 border-none text-white"
      });
    } catch (error) {
      toast({ title: "Error al crear paciente", variant: "destructive" });
    }
  };

  const goToPatientProfile = (id: string) => {
    const patient = patients.find(p => p.id === id);
    if (patient) {
      setSelectedPatientForInfo(patient);
      setIsPatientInfoOpen(true);
      setIsDetailOpen(false); // Cerramos el detalle de la cita para ver el perfil
    } else {
      router.push(`/patients?id=${id}`);
    }
  };

  const colorOptions = [
    { name: "Azul", value: "bg-blue-500" },
    { name: "Púrpura", value: "bg-purple-500" },
    { name: "Rojo", value: "bg-red-500" },
    { name: "Verde", value: "bg-emerald-500" },
    { name: "Ambar", value: "bg-amber-500" },
    { name: "Rosa", value: "bg-pink-500" },
    { name: "Cian", value: "bg-cyan-500" },
  ]

  // View logic
  const getDaysForView = () => {
    if (view === 'Month') {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      let startDay = startOfMonth.getDay() // 0 is Sun
      if (startDay === 0) startDay = 7;
      
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
      
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
      const prevMonthDays = prevMonth.getDate()
      
      const grid = []
      // Fill previous month padding
      for (let i = startDay - 2; i >= 0; i--) {
        grid.push({ day: prevMonthDays - i, current: false, date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonthDays - i) })
      }
      // Fill current month
      for (let i = 1; i <= daysInMonth; i++) {
        grid.push({ day: i, current: true, date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i) })
      }
      // Fill next month padding to reach a complete week (multiple of 7)
      const totalCellsNeeded = Math.ceil(grid.length / 7) * 7;
      const remaining = totalCellsNeeded - grid.length;
      for (let i = 1; i <= remaining; i++) {
        grid.push({ day: i, current: false, date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i) })
      }

      // Filter weekends if needed
      if (!settings.showWeekends) {
        return grid.filter(d => d.date.getDay() !== 0 && d.date.getDay() !== 6);
      }
      return grid
    }
    if (view === 'Week') {
      const startOfWeek = new Date(currentDate)
      const day = currentDate.getDay() || 7 // 1 is Mon, 7 is Sun
      startOfWeek.setDate(currentDate.getDate() - day + 1)
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek)
        d.setDate(startOfWeek.getDate() + i)
        return { day: d.getDate(), current: true, date: d }
      })

      if (!settings.showWeekends) {
        return days.filter(d => d.date.getDay() !== 0 && d.date.getDay() !== 6);
      }
      return days
    }
    return [{ day: currentDate.getDate(), current: true, date: currentDate }]
  }

  const calendarDays = getDaysForView()
  const numCols = view === 'Day' ? 1 : (!settings.showWeekends ? 5 : 7);
  const dayNames = settings.showWeekends 
    ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (view === 'Month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (view === 'Week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
      // Skip weekends in Day view if showWeekends is false
      if (!settings.showWeekends) {
        if (newDate.getDay() === 6) { // Saturday
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 2 : -1))
        } else if (newDate.getDay() === 0) { // Sunday
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -2))
        }
      }
    }
    setCurrentDate(newDate)
  }

  const handleMonthChange = (month: string) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(parseInt(month))
    setCurrentDate(newDate)
  }

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(parseInt(year))
    setCurrentDate(newDate)
  }

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const years = Array.from({ length: 11 }, (_, i) => (currentDate.getFullYear() - 5 + i).toString())

  if (!mounted) return null

  return (
    <main className="flex-1 flex flex-col overflow-hidden px-12 pt-10 pb-4">
      {/* Page Header — matches Dashboard style exactly */}
        <div className="flex items-end justify-between border-b border-slate-100 dark:border-border pb-6 mb-8 shrink-0">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">Calendario</h1>
            <p className="text-sm font-medium text-slate-400 mt-0.5">Programa y gestiona las citas de la clínica</p>
          </motion.div>
          <div className="flex items-center gap-3">
            {/* Filters Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-[38px] px-4 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-background text-sm font-bold text-slate-700 dark:text-slate-300 shadow-none gap-2 hover:bg-slate-50 dark:hover:bg-accent/10">
                  <Filter className="w-4 h-4" />
                  Filtros
                  {calendarItems.some(i => i.checked) && (
                    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-slate-900 dark:bg-slate-50 text-[10px] text-white dark:text-slate-900 font-black px-1">
                      {calendarItems.filter(i => i.checked).length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-3 rounded-2xl shadow-xl z-50 border-slate-100 dark:border-slate-800" align="end" sideOffset={12}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Categorías de Cita</span>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold px-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => setIsManageFiltersOpen(true)}>
                      <Settings2 className="w-3 h-3 mr-1.5" />
                      Gestionar
                    </Button>
                  </div>
                  <div className="flex flex-col gap-1 max-h-[340px] overflow-y-auto no-scrollbar">
                    {calendarItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleFilter(item.id)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left group",
                          item.checked 
                            ? "bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-50" 
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500"
                        )}
                      >
                        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", item.color)} />
                        <span className="truncate flex-1">{item.name}</span>
                        <div className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                          item.checked 
                            ? "bg-blue-600 border-blue-600 text-white" 
                            : "border-slate-300 dark:border-slate-600 text-transparent group-hover:border-slate-400"
                        )}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* View toggle — animated pill indicator */}
            <div className="inline-flex p-1 bg-slate-100/80 dark:bg-[#060D1A] rounded-xl relative">
              {(['Day', 'Week', 'Month'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    const dir = viewOrder[v] > viewOrder[view] ? 1 : -1
                    setViewDirection(dir)
                    prevViewRef.current = view
                    setView(v)
                  }}
                  className={cn(
                    "relative px-5 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 z-10",
                    view === v 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  {view === v && (
                    <motion.span
                      layoutId="viewPill"
                      className="absolute inset-0 bg-white dark:bg-background rounded-[8px] border border-slate-200/80 dark:border-slate-700 shadow-sm"
                      style={{ zIndex: -1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  {v === 'Day' ? 'Día' : v === 'Week' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>

            {/* Month/Year nav - Refined and Premium */}
            <div className="flex items-center gap-0.5">
              <div className="flex items-center pr-2 border-r border-slate-100 dark:border-border gap-0.5">
                <button 
                  onClick={() => handleNavigate('prev')} 
                  className="p-2 hover:bg-slate-50 dark:hover:bg-accent dark:bg-accent/10 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-blue-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleNavigate('next')} 
                  className="p-2 hover:bg-slate-50 dark:hover:bg-accent dark:bg-accent/10 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-blue-600"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-1 px-3 h-9">
                <Select value={currentDate.getMonth().toString()} onValueChange={handleMonthChange}>
                  <SelectTrigger className="h-8 px-3 border-none shadow-none bg-transparent font-black text-[15px] text-slate-900 dark:text-slate-50 focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 outline-none capitalize hover:bg-slate-50 dark:hover:bg-accent dark:bg-accent/10 rounded-lg transition-all flex gap-1.5 items-center">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[20px] border-slate-100 dark:border-border shadow-2xl p-1">
                    {months.map((m, i) => (
                      <SelectItem key={i} value={i.toString()} className="rounded-xl py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:bg-blue-50 dark:focus:bg-blue-500/10 focus:text-blue-700">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={currentDate.getFullYear().toString()} onValueChange={handleYearChange}>
                  <SelectTrigger className="h-8 px-2 border-none shadow-none bg-transparent font-bold text-sm text-slate-400 focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 outline-none hover:bg-slate-50 dark:hover:bg-accent dark:bg-accent/10 rounded-lg transition-all flex gap-1 items-center">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[20px] border-slate-100 dark:border-border shadow-2xl p-1">
                    {years.map(y => (
                      <SelectItem key={y} value={y} className="rounded-xl py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:bg-blue-50 dark:focus:bg-blue-500/10 focus:text-blue-700">{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="h-6 w-px bg-slate-100 dark:bg-slate-800 mx-1.5" />

              <Button 
                variant="ghost" 
                size="sm" 
                className="px-4 h-9 text-xs font-black text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 rounded-xl transition-all active:scale-95" 
                onClick={() => setCurrentDate(new Date())}
              >
                Hoy
              </Button>

              <div className="h-6 w-px bg-slate-100 dark:bg-slate-800 mx-1.5" />
            </div>

            <Button 
              onClick={() => {
                const y = currentDate.getFullYear();
                const m = String(currentDate.getMonth() + 1).padStart(2, '0');
                const d = String(currentDate.getDate()).padStart(2, '0');
                setFormDate(`${y}-${m}-${d}`);
                setFormTime("");
                setIsCreateDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 font-bold px-6 h-10 rounded-xl gap-2 flex items-center shadow-md shadow-none text-white dark:text-white active:scale-95 transition-all text-sm"
            >
              <Plus className="h-4 w-4" />
              Nueva Cita
            </Button>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="sm:max-w-[425px] rounded-[24px] border-none shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
                <DialogTitle className="sr-only">Detalles de la Cita</DialogTitle>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold tracking-tight">Programar Cita</DialogTitle>
                </DialogHeader>
                <div className="grid gap-5 py-4">
                  <div className="grid gap-2 relative">
                    <Label className="text-sm font-semibold text-slate-700 ml-1">Paciente</Label>
                    <Input 
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-accent/10 focus:bg-white dark:bg-background transition-all px-4" 
                      placeholder="Nombre completo..." 
                      value={formName} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormName(val);
                        if (val.length > 2) {
                          const matches = patients.filter(p => p.name.toLowerCase().includes(val.toLowerCase()));
                          setPatientSuggestions(matches);
                          setShowSuggestions(true);
                        } else {
                          setShowSuggestions(false);
                        }
                      }} 
                    />
                    {showSuggestions && patientSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-40 overflow-y-auto p-1">
                        {patientSuggestions.map(p => (
                          <button
                            key={p.id}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex flex-col"
                            onClick={() => {
                              setFormName(p.name);
                              setFormPhone(p.phone);
                              setShowSuggestions(false);
                            }}
                          >
                            <span className="font-bold">{p.name}</span>
                            <span className="text-xs text-slate-400">{p.phone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-semibold text-slate-700 ml-1">Teléfono</Label>
                    <Input 
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-accent/10 focus:bg-white dark:bg-background transition-all px-4" 
                      placeholder="Teléfono de contacto..." 
                      value={formPhone} 
                      onChange={(e) => setFormPhone(e.target.value)} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-semibold text-slate-700 ml-1">Tipo de Cita (Categoría)</Label>
                    <Select value={formType} onValueChange={setFormType}>
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-accent/10 focus:bg-white dark:bg-background transition-all px-4 shadow-none">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 dark:border-border shadow-2xl p-1">
                        {calendarItems.map((item) => (
                          <SelectItem key={item.id} value={item.name} className="rounded-xl py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", item.color)} />
                              {item.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fecha</Label>
                      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-11 w-full justify-start text-left font-bold rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-background shadow-none",
                              !formDate && "text-slate-400"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                            {formDate ? format(new Date(formDate + 'T00:00:00'), "PPP", { locale: es }) : <span>Elegir fecha</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[360px] p-0 rounded-[32px] overflow-hidden border-slate-100 shadow-2xl z-[99999]" align="center" side="top" sideOffset={10}>
                          <div className="bg-blue-600 p-4 text-white">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Seleccionar Fecha</p>
                            <p className="text-xl font-black mt-1">
                              {formDate ? format(new Date(formDate + 'T00:00:00'), "EEEE, d 'de' MMMM", { locale: es }) : "Elige un día"}
                            </p>
                          </div>
                          <Calendar
                            selected={formDate ? new Date(formDate + 'T00:00:00') : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const y = date.getFullYear();
                                const m = String(date.getMonth() + 1).padStart(2, '0');
                                const d = String(date.getDate()).padStart(2, '0');
                                setFormDate(`${y}-${m}-${d}`);
                                setIsDatePickerOpen(false);
                              }
                            }}
                            initialFocus
                            className="bg-white"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Horas Disponibles</Label>
                      <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto no-scrollbar p-1">
                        {Array.from({ 
                          length: Math.floor(((settings.closingHour || 18) - (settings.openingHour || 9)) * 60 / (settings.appointmentInterval || 30)) + (settings.allowBookingAtClosingHour ? 1 : 0) 
                        }).map((_, i) => {
                          const totalMinutes = i * (settings.appointmentInterval || 30);
                          const hour = (settings.openingHour || 9) + Math.floor(totalMinutes / 60);
                          const minute = totalMinutes % 60;
                          
                          if (!settings.allowBookingAtClosingHour && hour >= (settings.closingHour || 18)) return null;
                          if (settings.allowBookingAtClosingHour && hour > (settings.closingHour || 18)) return null;
                          if (settings.allowBookingAtClosingHour && hour === (settings.closingHour || 18) && minute > 0) return null;

                          const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                          const isSelected = formTime === timeStr;
                          
                          // Check if occupied
                          const isOccupied = appointments.some(a => 
                            a.start_time.startsWith(`${formDate}T${timeStr}`) &&
                            a.status !== 'cancelada'
                          );

                          return (
                            <button
                              key={timeStr}
                              type="button"
                              disabled={isOccupied}
                              onClick={() => setFormTime(timeStr)}
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
                  </div>

                </div>
                <DialogFooter className="mt-2">
                  <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="h-11 rounded-xl font-bold text-slate-500">Cancelar</Button>
                  <Button 
                    disabled={!formTime}
                    className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold px-8 shadow-lg shadow-none" 
                    onClick={async () => {
                      await addAppointment({
                      patient_id: patients.find(p => p.name === formName && p.phone === formPhone)?.id || "",
                      patient_name: formName || "Nuevo Paciente",
                      patient_phone: formPhone,
                      title: formType,
                      start_time: `${formDate}T${formTime}:00`,
                      end_time: `${formDate}T${formTime}:30`, // Default 30 min, can be improved with interval
                      status: "programada",
                      source: "Manual",
                      notes: ""
                    })
                    setIsCreateDialogOpen(false)
                    setFormName("")
                    setFormPhone("")
                    toast({ title: "Cita programada correctamente" })
                  }}>Guardar Cita</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>



        <div className="flex-1 flex overflow-hidden">
          {/* Main Grid Content */}
          <div className="flex-1 overflow-hidden">
            <div className="p-2 h-full flex flex-col">
              
              <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={view}
                    custom={viewDirection}
                    variants={{
                      enter: { opacity: 0 },
                      center: { opacity: 1 },
                      exit: { opacity: 0 },
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      duration: 0.18,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 flex bg-white dark:bg-background rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm shadow-none overflow-hidden"
                  >
                    {/* Time Column for Day/Week View */}
                    {(view === 'Day' || view === 'Week') && (() => {
                      const visualClosingHour = settings.allowBookingAtClosingHour
                        ? (settings.closingHour || 18) + 1
                        : (settings.closingHour || 18);
                      return (
                        <div className="w-16 bg-slate-50 dark:bg-accent/10 border-r border-slate-200 dark:border-slate-700 flex flex-col shrink-0 pt-[60px] pb-0">
                          {Array.from({ length: visualClosingHour - (settings.openingHour || 9) + 1 }, (_, i) => i + (settings.openingHour || 9)).map((hour, i, arr) => (
                            <div key={hour} className="relative w-full" style={{ flex: i === arr.length - 1 ? 'none' : '1', height: i === arr.length - 1 ? '0px' : undefined }}>
                              {i !== arr.length - 1 && (
                                <span className="absolute -top-[10px] left-0 right-0 text-center text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter">
                                  {hour.toString().padStart(2, '0')}:00
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    <div 
                      className={cn(
                        "grid flex-1 overflow-hidden no-scrollbar relative min-h-0",
                        view === 'Day' ? "grid-cols-1 grid-rows-[auto_1fr]" : view === 'Week' ? (settings.showWeekends ? "grid-cols-7" : "grid-cols-5") + " grid-rows-[auto_1fr]" : (settings.showWeekends ? "grid-cols-7" : "grid-cols-5")
                      )}
                      style={view === 'Month' ? { gridTemplateRows: `auto repeat(${calendarDays.length / numCols}, minmax(0, 1fr))` } : undefined}
                    >
                      {/* Grid Header for Week and Month View */}
                      {(view === 'Week' || view === 'Month') && (
                        <div className={cn(
                          settings.showWeekends ? "col-span-7 grid grid-cols-7" : "col-span-5 grid grid-cols-5",
                          "border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-background/95 backdrop-blur-sm z-20",
                          view === 'Month' ? "h-[40px]" : "h-[60px]"
                        )}>
                          {dayNames.map((day, i) => (
                            <div key={day} className="flex flex-col items-center justify-center border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                              <span className={cn(
                                "font-black text-slate-700 uppercase tracking-[0.2em]",
                                view === 'Month' ? "text-[10px]" : "text-[11px]"
                              )}>
                                {day}
                              </span>
                              {view === 'Week' && (
                                <span className={cn(
                                  "text-[14px] font-bold mt-0.5",
                                  calendarDays[i]?.date.toDateString() === new Date().toDateString() 
                                    ? "text-blue-600 dark:text-blue-400" 
                                    : "text-slate-500 dark:text-slate-400"
                                )}>
                                  {calendarDays[i]?.day}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Grid Header for Day View */}
                      {view === 'Day' && (
                        <div className="h-[60px] border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-background/95 backdrop-blur-sm z-20 flex items-center px-8">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                              {currentDate.toLocaleDateString('es-ES', { weekday: 'long' })}
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-50 capitalize">
                              {currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Render Cells */}
                      {calendarDays.map((dateObj, i) => {
                        const dayApps = dateObj.current ? appointments.filter(app => {
                          const appDate = new Date(app.start_time)
                          const matchesDate = appDate.getDate() === dateObj.day && 
                                             appDate.getMonth() === dateObj.date.getMonth() &&
                                             appDate.getFullYear() === dateObj.date.getFullYear()
                          
                          const title = (app.title || app.treatment || '').toLowerCase()
                          const activeFilters = calendarItems.filter(f => f.checked).map(f => f.name.toLowerCase())
                          
                          if (activeFilters.length === 0) return false

                          let categoryMatch = false;
                          const isKnownCategory = calendarItems.some(f => title.includes(f.name.toLowerCase()) || f.name.toLowerCase().includes(title));

                          if (isKnownCategory) {
                            categoryMatch = activeFilters.some(f => title.includes(f) || f.includes(title));
                          } else {
                            categoryMatch = activeFilters.length > 0;
                          }

                          return matchesDate && (categoryMatch || title.includes('general'))
                        }).sort((a, b) => (parseToDate(a.start_time)?.getTime() || 0) - (parseToDate(b.start_time)?.getTime() || 0)) : []

                        const isToday = dateObj.current && 
                                        dateObj.day === new Date().getDate() && 
                                        dateObj.date.getMonth() === new Date().getMonth() &&
                                        dateObj.date.getFullYear() === new Date().getFullYear();

                        return (
                          <div 
                            key={`${dateObj.date.getTime()}-${i}`} 
                            className={cn(
                              "group relative flex flex-col border-r border-b border-slate-200 dark:border-slate-700 overflow-hidden min-h-0",
                              view === 'Month' ? "p-1.5 hover:bg-slate-50/50 dark:hover:bg-accent/5 transition-colors" : "pb-0",
                              !dateObj.current ? "bg-transparent opacity-40 pointer-events-none" : "cursor-pointer"
                            )}
                            onClick={(e) => {
                              if (!dateObj.current || view !== 'Month') return;
                              const newDate = new Date(dateObj.date)
                              newDate.setHours(9) // Default 9 AM
                              setCurrentDate(newDate)
                              
                              const y = newDate.getFullYear();
                              const m = String(newDate.getMonth() + 1).padStart(2, '0');
                              const d = String(newDate.getDate()).padStart(2, '0');
                              setFormDate(`${y}-${m}-${d}`);
                              setFormTime("");
                              setIsCreateDialogOpen(true)
                            }}
                          >
                            <div className="relative z-10 flex-1 flex flex-col min-h-0">
                            {view === 'Month' && (
                              <div className="flex justify-between items-center mb-0.5">
                                <span className={cn(
                                  "text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full transition-all duration-300",
                                  isToday 
                                    ? "bg-blue-600 text-white shadow-md shadow-none" 
                                    : dateObj.current ? "text-slate-700 dark:text-slate-300" : "text-slate-500"
                                )}>
                                  {dateObj.day}
                                </span>
                              </div>
                            )}

                            {/* Time Slots for Day/Week View */}
                            {(view === 'Day' || view === 'Week') && (() => {
                              const visualClosingHour = settings.allowBookingAtClosingHour
                                ? (settings.closingHour || 18) + 1
                                : (settings.closingHour || 18);
                              return (
                                <div className="flex-1 relative flex flex-col min-h-0">
                                  {Array.from({ length: visualClosingHour - (settings.openingHour || 9) }, (_, i) => (
                                    <div key={i} className="group/slot relative flex-1 border-b border-slate-200 dark:border-slate-700 w-full cursor-pointer" onClick={() => {
                                      const newDate = new Date(dateObj.date);
                                      const y = newDate.getFullYear();
                                      const m = String(newDate.getMonth() + 1).padStart(2, '0');
                                      const d = String(newDate.getDate()).padStart(2, '0');
                                      setFormDate(`${y}-${m}-${d}`);
                                      const hour = (settings.openingHour || 9) + i;
                                      setFormTime(`${String(hour).padStart(2, '0')}:00`);
                                      setIsCreateDialogOpen(true);
                                    }}>
                                      <div className="absolute inset-x-1 bottom-1 top-1 rounded-xl bg-blue-50/0 group-hover/slot:bg-blue-50/100 dark:group-hover/slot:bg-blue-500/10 transition-colors z-0" />
                                    </div>
                                  ))}
                                
                                <div className={cn(
                                  "absolute inset-0 pointer-events-none",
                                  view === 'Day' ? "px-6" : "px-2"
                                )}>
                                  {dayApps.map((app) => {
                                    const openingHour = settings.openingHour || 9;
                                    const visualClosingHour = settings.allowBookingAtClosingHour
                                      ? (settings.closingHour || 18) + 1
                                      : (settings.closingHour || 18);
                                    const totalMinutes = (visualClosingHour - openingHour) * 60;
                                    
                                    const startDate = new Date(app.start_time);
                                    const appStartHour = startDate.getHours();
                                    const appStartMinute = startDate.getMinutes();
                                    
                                    const topMinutes = (appStartHour - openingHour) * 60 + appStartMinute;
                                    const topPercent = (topMinutes / totalMinutes) * 100;
                                    
                                    let durationMinutes = 30;
                                    if (app.end_time) {
                                      const endDate = new Date(app.end_time);
                                      durationMinutes = (endDate.getTime() - startDate.getTime()) / 60000;
                                    }
                                    const heightPercent = (durationMinutes / totalMinutes) * 100;

                                    return (
                                      <div 
                                        key={app.id} 
                                        className={cn(
                                          "absolute rounded-[12px] shadow-sm shadow-none border-l-[4px] transition-all hover:scale-[1.02] active:scale-[0.98] group/item pointer-events-auto cursor-pointer p-2 flex flex-col overflow-hidden min-h-[24px]",
                                          view === 'Day' ? "left-8 right-8" : "left-2 right-2",
                                          app.status === 'confirmada' 
                                            ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-900 dark:text-blue-100" 
                                            : "bg-indigo-50 border-indigo-500 text-indigo-900"
                                        )}
                                        style={{ top: `${topPercent}%`, height: `${heightPercent}%`, zIndex: 10 }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedApp(app)
                                          setIsDetailOpen(true)
                                        }}
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="text-[10px] font-bold truncate tracking-tight uppercase leading-none">
                                            {resolvePatientName(app.patient_phone, app.patient_name, "", patients, settings?.preferredDisplayName)}
                                          </span>
                                          {heightPercent >= 6 && (
                                            <span className="text-[9px] font-black opacity-50 shrink-0 leading-none">
                                              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </span>
                                          )}
                                        </div>
                                        {heightPercent >= 10 && (
                                          <div className="text-[9px] font-medium opacity-60 mt-1 truncate uppercase tracking-wider leading-none">
                                            {app.title || app.treatment || "Cita"}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            );
                            })()}

                            {view === 'Month' && (
                              <div className="flex-1 space-y-0.5 overflow-hidden p-0">
                                {[...dayApps].sort((a, b) => (parseToDate(a.start_time)?.getTime() || 0) - (parseToDate(b.start_time)?.getTime() || 0)).slice(0, 3).map((app) => (
                                  <AppointmentItem 
                                    key={app.id} 
                                    app={app} 
                                    patients={patients}
                                    preferredDisplayName={settings?.preferredDisplayName}
                                    onClick={(app) => {
                                      setSelectedApp(app)
                                      setIsDetailOpen(true)
                                    }}
                                    onContextMenu={(e, appId) => {
                                      setContextMenu({ x: e.clientX, y: e.clientY, appId })
                                    }}
                                  />
                                ))}

                                {dayApps.length > 3 && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setMoreAppointments({ 
                                        date: dateObj.date, 
                                        apps: [...dayApps].sort((a, b) => (parseToDate(a.start_time)?.getTime() || 0) - (parseToDate(b.start_time)?.getTime() || 0)) 
                                      })
                                    }}
                                    className="w-full text-left px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                  >
                                    {dayApps.length - 3} más
                                  </button>
                                )}

                                {dateObj.current && (
                                  <div 
                                    className="h-5 w-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700 mt-0.5 shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const newDate = new Date(dateObj.date)
                                      newDate.setHours(9) // Default 9 AM
                                      setCurrentDate(newDate)
                                      
                                      const y = newDate.getFullYear();
                                      const m = String(newDate.getMonth() + 1).padStart(2, '0');
                                      const d = String(newDate.getDate()).padStart(2, '0');
                                      setFormDate(`${y}-${m}-${d}`);
                                      setFormTime("");
                                      setIsCreateDialogOpen(true)
                                    }}
                                  >
                                    <Plus className="h-3 w-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Lateral Panel - Only in Day View */}
          <AnimatePresence>
          {view === 'Day' && (
            <motion.aside
              key="day-sidebar"
              initial={{ width: 0, opacity: 0, x: 40 }}
              animate={{ width: 320, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: 40 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="flex flex-col shrink-0 overflow-hidden relative border-l border-slate-100 dark:border-border"
            >
              <div className="w-[320px] p-6 flex-1 overflow-y-auto no-scrollbar">
                {/* Mini Calendar Moderno - Dynamic and Sync'd */}
                <div className="mb-6 p-5 rounded-3xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">
                        {currentDate.getFullYear()}
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest capitalize">
                        {months[currentDate.getMonth()]}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => {
                          const d = new Date(currentDate)
                          d.setMonth(d.getMonth() - 1)
                          setCurrentDate(d)
                        }}
                        className="h-8 w-8 flex items-center justify-center border border-slate-100 dark:border-border rounded-xl hover:bg-white dark:bg-background hover:shadow-sm shadow-none transition-all text-slate-400 hover:text-blue-600 active:scale-90"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={() => {
                          const d = new Date(currentDate)
                          d.setMonth(d.getMonth() + 1)
                          setCurrentDate(d)
                        }}
                        className="h-8 w-8 flex items-center justify-center border border-slate-100 dark:border-border rounded-xl hover:bg-white dark:bg-background hover:shadow-sm shadow-none transition-all text-slate-400 hover:text-blue-600 active:scale-90"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "grid text-center gap-y-2",
                    settings.showWeekends ? "grid-cols-7" : "grid-cols-5"
                  )}>
                    {(settings.showWeekends ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'] : ['L', 'M', 'X', 'J', 'V']).map(d => (
                      <span key={d} className="text-[9px] font-black text-slate-300">{d}</span>
                    ))}
                    
                    {/* Real calendar grid for the mini view */}
                    {(() => {
                      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                      const startDay = (startOfMonth.getDay() + 6) % 7 // Adjust to start on Monday
                      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
                      const today = new Date()
                      const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()
                      
                      const miniGrid = [
                        ...Array(startDay).fill(null),
                        ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
                      ].map(d => {
                        if (d === null) return null;
                        return new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                      });

                      const filteredMiniGrid = settings.showWeekends 
                        ? miniGrid 
                        : miniGrid.filter(d => d === null || (d.getDay() !== 0 && d.getDay() !== 6));

                      return filteredMiniGrid.map((dateObj, i) => (
                        <div key={i} className="flex items-center justify-center aspect-square">
                          {dateObj !== null && (
                            <button 
                              onClick={() => {
                                const newDate = new Date(dateObj)
                                setCurrentDate(newDate)
                              }}
                              className={cn(
                                "h-7 w-7 rounded-full text-[10px] font-bold transition-all relative group",
                                isCurrentMonth && dateObj.getDate() === today.getDate()
                                  ? "bg-blue-600 text-white shadow-md shadow-none" 
                                  : dateObj.getDate() === currentDate.getDate()
                                    ? "bg-slate-200 text-slate-900 dark:text-black"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-white dark:bg-background hover:shadow-sm shadow-none hover:text-blue-600"
                              )}
                            >
                              {dateObj.getDate()}
                              {/* Dot indicator for appointments - simplified for mini view */}
                              {appointments.some(app => {
                                const appDate = new Date(app.start_time)
                                return appDate.getDate() === dateObj.getDate() && 
                                       appDate.getMonth() === currentDate.getMonth() && 
                                       appDate.getFullYear() === currentDate.getFullYear()
                              }) && <div className={cn(
                                "absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full",
                                isCurrentMonth && dateObj.getDate() === today.getDate() ? "bg-blue-200" : "bg-blue-400"
                              )} />}
                            </button>
                          )}
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
          </AnimatePresence>
        </div>

        {/* Dialog Gestionar Filtros */}
        <Dialog open={isManageFiltersOpen} onOpenChange={setIsManageFiltersOpen}>
          <DialogContent className="sm:max-w-[450px] rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
            <DialogTitle className="sr-only">Formulario de Cita</DialogTitle>
            <div className="p-8 bg-slate-50 dark:bg-accent/10">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-xl font-bold flex items-center justify-between">
                  Gestionar Categorías
                </DialogTitle>
              </DialogHeader>

              {/* OVERLAY DE CONFIRMACIÓN DE BORRADO: Simula el AlertDialog sin romper Radix UI */}
              {deleteConfirmId && (
                <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-white dark:bg-background p-8 rounded-[32px] shadow-2xl w-full max-w-[380px] text-center space-y-6">
                    <div className="space-y-2">
                       <h3 className="font-bold text-xl text-slate-900 dark:text-slate-50">¿Eliminar categoría?</h3>
                       <p className="text-sm font-medium text-slate-500">
                         Esta acción ocultará todas las citas asociadas a esta categoría de la vista. Quedarán archivadas.
                       </p>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        variant="secondary" 
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-600 dark:text-black"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => deleteFilter(deleteConfirmId)}
                        className="flex-1 h-11 rounded-xl bg-red-50 dark:bg-red-500/100 hover:bg-red-600 font-bold text-white shadow-lg shadow-red-500/20"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Nuevo Filtro */}
                <div className="bg-white dark:bg-background p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm shadow-none space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1 block">Nueva Categoría</label>
                    <input 
                      type="text"
                      placeholder="Nombre de la categoría..." 
                      className="w-full h-11 rounded-xl bg-slate-50 dark:bg-accent/10 border border-slate-200 dark:border-slate-700 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                      value={newFilterName}
                      onChange={(e) => setNewFilterName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFilter() } }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1 block">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setNewFilterColor(color.value) }}
                          className={cn(
                            "w-8 h-8 rounded-full transition-all",
                            color.value,
                            newFilterColor === color.value
                              ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                              : "hover:scale-105"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!newFilterName.trim()}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addFilter() }}
                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:hover:bg-blue-600 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-none transition-all cursor-pointer select-none"
                  >
                    <Plus className="h-4 w-4" />
                    Añadir Categoría
                  </button>
                </div>

                {/* Lista de Filtros */}
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Categorías Existentes</Label>
                  <div className="max-h-[220px] overflow-y-auto pr-2 pb-2 no-scrollbar space-y-2">
                    {calendarItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-background rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm shadow-none group">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-3 h-3 rounded-full", item.color)} />
                          <span className="text-sm font-bold text-slate-700">{item.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:bg-red-500/10 dark:hover:bg-red-50 dark:bg-red-500/100/10 transition-all opacity-0 group-hover:opacity-100"
                          onClick={() => setDeleteConfirmId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-background border-t border-slate-100 dark:border-border flex justify-end">
              <Button onClick={() => setIsManageFiltersOpen(false)} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold px-8 shadow-lg shadow-none">Hecho</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Detail / Edit Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={(open) => {
          setIsDetailOpen(open)
          if (!open) {
            setIsEditing(false)
            setSelectedApp(null)
            setReturnToMoreAppointments(null)
          }
        }}>
          <DialogContent className="sm:max-w-[420px] rounded-[24px] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
            <DialogTitle className="sr-only">Detalles de Cita Existente</DialogTitle>
            {selectedApp && (
              <>
                {/* Custom Header with Action Icons */}
                <div className="flex items-center justify-between p-4 px-6 border-b border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {returnToMoreAppointments && !isEditing && (
                      <>
                        <button 
                          onClick={() => {
                            setIsDetailOpen(false)
                            setMoreAppointments(returnToMoreAppointments)
                            setReturnToMoreAppointments(null)
                          }}
                          className="p-2 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Volver a la lista"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                      </>
                    )}
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-2 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors relative flex items-center justify-center overflow-hidden"
                      title={isEditing ? "Volver" : "Editar"}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {isEditing ? (
                          <motion.div
                            key="back-icon"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="edit-icon"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <Settings2 className="w-5 h-5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="w-5 h-5 opacity-0" /> {/* Spacer */}
                    </button>
                    {!isEditing && (
                      <button 
                        onClick={() => setDeleteAppId(selectedApp.id)}
                        className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-8">
                  {!isEditing ? (
                    <div className="space-y-8">
                      {/* Title Section */}
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-lg shadow-blue-200">
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                            {resolvePatientName(selectedApp.patient_phone, selectedApp.patient_name, "", patients, settings?.preferredDisplayName)}
                          </DialogTitle>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-500">
                              {(selectedApp.title || selectedApp.treatment || "Consulta Médica").replace(/^(Tratamiento|Servicio):\s*/i, '')}
                            </p>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
                              {selectedApp.patient_id ? (
                                <button 
                                  onClick={() => goToPatientProfile(selectedApp.patient_id)}
                                  className="flex items-center gap-1 hover:underline underline-offset-2"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Ver Perfil
                                </button>
                              ) : (
                                <button 
                                  onClick={handleCreatePatientFromApp}
                                  className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-2"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  Crear Paciente
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="space-y-5">
                        <div className="flex items-center gap-4 group">
                          <Clock className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {format(new Date(selectedApp.start_time), "EEEE, d 'de' MMMM", { locale: es })}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(selectedApp.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                              {" - "} 
                              {selectedApp.end_time ? new Date(selectedApp.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "10:00"}
                            </p>
                          </div>
                        </div>

                        {selectedApp.patient_phone && (
                          <div className="flex items-center gap-4 group">
                            <Phone className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                {formatPhone(resolvePatientPhone(selectedApp, patients))}
                              </p>
                            </div>
                          </div>
                        )}


                        {selectedApp.notes && (
                          <div className="flex items-start gap-4 group">
                            <MessageSquare className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors mt-0.5" />
                            <div className="space-y-1 flex-1">
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Notas del paciente</p>
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                  {selectedApp.notes.replace(/^(Comentarios?):\s*/i, '')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-4 group">
                          <User className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors mt-0.5" />
                          <div className="space-y-1 flex-1">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Notas de la Cita</p>
                            <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                {selectedApp.appointment_notes || "Sin anotaciones."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Footer */}
                      <div className="pt-4 flex justify-between items-center">
                        <div className="flex flex-wrap items-center gap-2">
                          {selectedApp.status && (
                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border-emerald-100 px-3 py-1 rounded-full whitespace-nowrap shrink-0">
                              {selectedApp.status}
                            </Badge>
                          )}
                          {selectedApp.source && (
                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border-blue-100 px-3 py-1 rounded-full whitespace-nowrap shrink-0">
                              {selectedApp.source}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Paciente</Label>
                        <Input 
                          className="h-11 rounded-xl bg-white dark:bg-background border-slate-200 dark:border-slate-700 font-bold" 
                          value={selectedApp.patient_name} 
                          onChange={(e) => setSelectedApp({...selectedApp, patient_name: e.target.value})} 
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipo de Cita</Label>
                        <Select 
                          value={(selectedApp.title || selectedApp.treatment || "Consultas Médicas").replace(/^(Tratamiento|Servicio):\s*/i, '')} 
                          onValueChange={(val) => setSelectedApp({...selectedApp, title: val, treatment: val})}
                        >
                          <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-background border-slate-200 dark:border-slate-700 font-bold shadow-none">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const currentVal = (selectedApp.title || selectedApp.treatment || '').replace(/^(Tratamiento|Servicio):\s*/i, '');
                                const matched = calendarItems.find(i => i.name === currentVal);
                                return matched ? <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", matched.color)} /> : null;
                              })()}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl p-1">
                            {(!calendarItems.find(i => i.name === (selectedApp.title || selectedApp.treatment || '').replace(/^(Tratamiento|Servicio):\s*/i, '')) && (selectedApp.title || selectedApp.treatment)) && (
                              <SelectItem value={(selectedApp.title || selectedApp.treatment).replace(/^(Tratamiento|Servicio):\s*/i, '')} className="rounded-xl font-bold text-blue-600 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-slate-300 dark:bg-slate-700" />
                                  <span>{(selectedApp.title || selectedApp.treatment).replace(/^(Tratamiento|Servicio):\s*/i, '')}</span>
                                </div>
                              </SelectItem>
                            )}
                            {calendarItems.map(item => (
                              <SelectItem key={item.id} value={item.name} className="rounded-xl font-bold cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", item.color)} />
                                  <span>{item.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fecha</Label>
                          <Popover open={isEditDatePickerOpen} onOpenChange={setIsEditDatePickerOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-11 w-full justify-start text-left font-bold rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-background shadow-none",
                                  !selectedApp.start_time && "text-slate-400"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                {selectedApp.start_time ? format(new Date(selectedApp.start_time), "PPP", { locale: es }) : <span>Elegir fecha</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[360px] p-0 rounded-[32px] overflow-hidden border-slate-100 shadow-2xl z-[99999]" align="center" side="top" sideOffset={10}>
                              <div className="bg-blue-600 p-4 text-white">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Editar Fecha de Cita</p>
                                <p className="text-xl font-black mt-1">
                                  {format(new Date(selectedApp.start_time), "EEEE, d 'de' MMMM", { locale: es })}
                                </p>
                              </div>
                              <Calendar
                                selected={new Date(selectedApp.start_time)}
                                onSelect={(date) => {
                                  if (date) {
                                    const timeParts = selectedApp.start_time.includes('T') ? selectedApp.start_time.split('T') : selectedApp.start_time.split(' ');
                                    const time = timeParts[1] || '00:00:00';
                                    const y = date.getFullYear();
                                    const m = String(date.getMonth() + 1).padStart(2, '0');
                                    const d = String(date.getDate()).padStart(2, '0');
                                    setSelectedApp({...selectedApp, start_time: `${y}-${m}-${d}T${time}`});
                                    setIsEditDatePickerOpen(false);
                                  }
                                }}
                                initialFocus
                                className="bg-white"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="grid gap-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Horas Disponibles</Label>
                          <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto no-scrollbar p-1">
                              {Array.from({ 
                                length: Math.floor(((settings.closingHour || 18) - (settings.openingHour || 9)) * 60 / (settings.appointmentInterval || 30)) + (settings.allowBookingAtClosingHour ? 1 : 0) 
                              }).map((_, i) => {
                                const totalMinutes = i * (settings.appointmentInterval || 30);
                                const hour = (settings.openingHour || 9) + Math.floor(totalMinutes / 60);
                                const minute = totalMinutes % 60;
                                
                                if (!settings.allowBookingAtClosingHour && hour >= (settings.closingHour || 18)) return null;
                                if (settings.allowBookingAtClosingHour && hour > (settings.closingHour || 18)) return null;
                                if (settings.allowBookingAtClosingHour && hour === (settings.closingHour || 18) && minute > 0) return null;

                                const h = String(hour).padStart(2, '0');
                                const m = String(minute).padStart(2, '0');
                                const timeStr = `${h}:${m}`;
                                
                                const stParts = selectedApp.start_time.includes('T') ? selectedApp.start_time.split('T') : selectedApp.start_time.split(' ');
                                const dateStr = stParts[0];
                                const isSelected = stParts[1] ? stParts[1].substring(0, 5) === timeStr : false;
                                
                                // Check if the hour is already occupied by another appointment
                                const isOccupied = appointments.some(a => 
                                  a.id !== selectedApp.id && 
                                  a.start_time.startsWith(`${dateStr}T${timeStr}`) &&
                                  a.status !== 'cancelada'
                                );

                                return (
                                  <button
                                    key={timeStr}
                                    type="button"
                                    disabled={isOccupied}
                                    onClick={() => {
                                      const stParts = selectedApp.start_time.includes('T') ? selectedApp.start_time.split('T') : selectedApp.start_time.split(' ');
                                      const date = stParts[0];
                                      const oldStart = parseToDate(selectedApp.start_time)?.getTime() || 0;
                                      const oldEnd = parseToDate(selectedApp.end_time || selectedApp.start_time)?.getTime() || 0;
                                      const duration = oldEnd - oldStart || 3600000; // Default 1 hr
                                      
                                      const newStartStr = `${date}T${timeStr}:00`;
                                      const newStart = new Date(newStartStr).getTime();
                                      const newEnd = new Date(newStart + duration);
                                      
                                      const y = newEnd.getFullYear();
                                      const mon = String(newEnd.getMonth() + 1).padStart(2, '0');
                                      const day = String(newEnd.getDate()).padStart(2, '0');
                                      const endH = String(newEnd.getHours()).padStart(2, '0');
                                      const min = String(newEnd.getMinutes()).padStart(2, '0');
                                      
                                      setSelectedApp({
                                        ...selectedApp, 
                                        start_time: newStartStr,
                                        end_time: `${y}-${mon}-${day}T${endH}:${min}:00`
                                      });
                                    }}
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
                            value={selectedApp.appointment_notes || ""}
                            onChange={(e) => setSelectedApp({...selectedApp, appointment_notes: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="pt-4 flex justify-end gap-3">
                        <Button 
                          variant="ghost" 
                          onClick={() => setIsEditing(false)} 
                          className="h-11 rounded-xl font-bold text-slate-500"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold px-8 shadow-lg shadow-none"
                          onClick={async () => {
                            const { id, ...updates } = selectedApp
                            await updateAppointment(id, updates)
                            setIsEditing(false)
                            setIsDetailOpen(false)
                            toast({ title: "Cita actualizada correctamente" })
                          }}
                        >
                          Guardar Cambios
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Context Menu */}
        {contextMenu && (
          <>
            <div 
              className="fixed inset-0 z-50" 
              onClick={() => setContextMenu(null)}
              onContextMenu={(e) => {
                e.preventDefault()
                setContextMenu(null)
              }}
            />
            <motion.div 
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
              className="fixed z-[60] min-w-[160px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-1.5"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const app = appointments.find(a => a.id === contextMenu.appId)
                  if (app) {
                    setSelectedApp(app)
                    setIsEditing(true)
                    setIsDetailOpen(true)
                  }
                  setContextMenu(null)
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
              >
                <Settings2 className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:rotate-45 transition-all" />
                Editar
              </button>
              <div className="my-1 h-px bg-slate-100 dark:bg-slate-800 mx-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteAppId(contextMenu.appId)
                  setContextMenu(null)
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
              >
                <Trash2 className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                Eliminar
              </button>
            </motion.div>
          </>
        )}

        {/* More Appointments Popup */}
        <Dialog open={!!moreAppointments} onOpenChange={() => setMoreAppointments(null)}>
          <DialogContent className="sm:max-w-[320px] rounded-[24px] p-0 border-none shadow-2xl overflow-hidden">
            <DialogTitle className="sr-only">Selector de Color</DialogTitle>
            {moreAppointments && (
              <div className="bg-white dark:bg-slate-900">
                <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex flex-col items-center gap-1">
                  <DialogTitle className="sr-only">Citas del día</DialogTitle>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {format(moreAppointments.date, "EEEE", { locale: es })}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
                    {moreAppointments.date.getDate()}
                  </div>
                </div>
                <div className="p-2 max-h-[400px] overflow-y-auto no-scrollbar">
                  {[...moreAppointments.apps].sort((a, b) => (parseToDate(a.start_time)?.getTime() || 0) - (parseToDate(b.start_time)?.getTime() || 0)).map(app => (
                    <AppointmentItem 
                      key={app.id} 
                      app={app} 
                      isFullWidth
                      onClick={(app) => {
                        setSelectedApp(app)
                        setIsDetailOpen(true)
                        setReturnToMoreAppointments(moreAppointments)
                        setMoreAppointments(null)
                      }}
                      onContextMenu={(e, appId) => {
                        setContextMenu({ x: e.clientX, y: e.clientY, appId })
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Custom Delete Confirmation Dialog */}
        <Dialog open={!!deleteAppId} onOpenChange={(open) => !open && setDeleteAppId(null)}>
          <DialogContent className="sm:max-w-[400px] rounded-[32px] border-none shadow-2xl p-8 bg-white dark:bg-slate-900">
            <div className="flex flex-col items-center text-center">
              {/* Circular Icon Wrapper */}
              <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center mb-6">
                <div className="w-14 h-14 rounded-full bg-red-100/50 dark:bg-red-900/20 flex items-center justify-center border border-red-200 dark:border-red-800">
                  <Trash2 className="w-7 h-7 text-red-600" />
                </div>
              </div>

              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3">
                ¿Eliminar esta cita?
              </DialogTitle>
              
              <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-[280px] leading-relaxed mb-8">
                Estás a punto de eliminar esta cita del sistema. Esta acción no se puede deshacer.
              </DialogDescription>


              <div className="flex w-full gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteAppId(null)}
                  className="flex-1 h-12 rounded-2xl font-bold text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={async () => {
                    if (deleteAppId) {
                      const trashId = await deleteAppointment(deleteAppId)
                      setDeleteAppId(null)
                      setIsDetailOpen(false)
                      
                      toast({
                        title: "Cita enviada a la papelera",
                        description: "Estará disponible en la papelera durante 30 días.",
                        duration: 6000,
                        className: "bg-red-600 border-none text-white",
                        action: (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold rounded-lg"
                            onClick={() => restoreAppointment(trashId)}
                          >
                            Deshacer
                          </Button>
                        ),
                      })
                    }
                  }}
                  className="flex-1 h-12 rounded-2xl bg-red-600 hover:bg-red-700 font-bold text-white shadow-lg shadow-red-200 dark:shadow-none border-none transition-all active:scale-95"
                >
                  Sí, eliminar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Patient Info Modal */}
        <Dialog open={isPatientInfoOpen} onOpenChange={setIsPatientInfoOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl p-8 bg-white dark:bg-background">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Información del paciente</DialogTitle>
            </DialogHeader>
            {selectedPatientForInfo && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-accent/10 rounded-3xl border border-slate-100 dark:border-border">
                  <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-none">
                    {selectedPatientForInfo.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 uppercase tracking-tight">{selectedPatientForInfo.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {selectedPatientForInfo.id.toUpperCase()}</p>
                  </div>
                </div>

                <div className="space-y-4 px-1">
                  {(() => {
                    const cleanPatientPhone = selectedPatientForInfo.phone?.replace(/\D/g, '') || "";
                    const patientCalls = calls
                      .filter(c => {
                        if (selectedPatientForInfo && c.patient_id === selectedPatientForInfo.id) return true;
                        const cleanCallPhone = c.phone_number?.replace(/\D/g, '') || "";
                        return cleanCallPhone && cleanPatientPhone && (cleanCallPhone.endsWith(cleanPatientPhone) || cleanPatientPhone.endsWith(cleanCallPhone));
                      })
                      .sort((a, b) => (parseToDate(b.timestamp)?.getTime() || 0) - (parseToDate(a.timestamp)?.getTime() || 0));

                    if (patientCalls.length === 0) return null;

                    return (
                      <div className="space-y-3">
                        <CallAudioPlayer url={patientCalls[0].recording_url} />

                        {patientCalls.length > 1 && (
                          <div className="pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsCallHistoryDialogOpen(true)}
                              className="w-full h-10 rounded-xl bg-slate-50 dark:bg-accent/5 hover:bg-slate-100 dark:hover:bg-accent/10 text-slate-500 hover:text-blue-600 border border-slate-100 dark:border-white/5 transition-all flex items-center justify-center gap-2 group"
                            >
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Ver historial de llamadas ({patientCalls.length})
                              </span>
                              <RefreshCcw className="h-3 w-3 group-hover:rotate-180 transition-transform duration-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-accent/10 rounded-xl"><Mail className="h-4 w-4 text-slate-400" /></div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {selectedPatientForInfo.email && selectedPatientForInfo.email !== "test@test.com" ? selectedPatientForInfo.email : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-accent/10 rounded-xl"><Phone className="h-4 w-4 text-slate-400" /></div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {selectedPatientForInfo.phone && selectedPatientForInfo.phone.replace(/\D/g, '').length > 3 ? formatPhone(selectedPatientForInfo.phone) : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-accent/10 rounded-xl"><MapPin className="h-4 w-4 text-slate-400" /></div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Origen: {normalizeChannel(selectedPatientForInfo.first_contact_channel)}</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-3 ml-1 tracking-widest">Etiquetas</p>
                    <div className="flex gap-2 flex-wrap">
                      {(selectedPatientForInfo.tags || []).filter((t: string) => t !== "Llamada").length > 0 ? (
                        (selectedPatientForInfo.tags || []).filter((t: string) => t !== "Llamada").map((tag: string) => {
                          return (
                            <Badge
                              key={tag}
                              className="font-black border-none px-3 py-1 rounded-lg text-[9px] uppercase tracking-wider bg-blue-50 dark:bg-accent/5 text-blue-600"
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
                    onClick={() => setIsPatientInfoOpen(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Call History Dialog */}
        <Dialog open={isCallHistoryDialogOpen} onOpenChange={setIsCallHistoryDialogOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-[32px] border-none shadow-2xl p-8 bg-slate-50 dark:bg-[#0B0F1A] max-h-[80vh] flex flex-col">
            <DialogHeader className="mb-6 shrink-0">
              <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <div className="p-2 bg-blue-600/10 rounded-xl">
                  <RefreshCcw className="h-5 w-5 text-blue-600" />
                </div>
                Historial de llamadas
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex justify-between items-center w-full">
                <span>Todas las grabaciones de {selectedPatientForInfo?.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const cleanPatientPhone = selectedPatientForInfo?.phone?.replace(/\D/g, '') || "";
                    const patientCalls = (calls || []).filter(c => {
                      if (selectedPatientForInfo && c.patient_id === selectedPatientForInfo.id) return true;
                      const cleanCallPhone = c.phone_number?.replace(/\D/g, '') || "";
                      return cleanCallPhone && cleanPatientPhone && (cleanCallPhone.endsWith(cleanPatientPhone) || cleanPatientPhone.endsWith(cleanCallPhone));
                    });
                    
                    if (patientCalls.length === 0) return;

                    const zip = new JSZip();
                    const folder = zip.folder(`llamadas_${selectedPatientForInfo?.name?.replace(/\s+/g, '_')}`);
                    
                    toast({
                      title: "Preparando descarga",
                      description: `Procesando ${patientCalls.length} grabaciones...`,
                    });

                    try {
                      const downloadPromises = patientCalls.map(async (c, i) => {
                        try {
                          const response = await fetch(c.recording_url);
                          if (!response.ok) throw new Error("Failed to fetch");
                          const blob = await response.blob();
                          const date = parseToDate(c.timestamp)?.toISOString().split('T')[0] || 'fecha_desconocida';
                          folder?.file(`${date}_llamada_${patientCalls.length - i}.mp3`, blob);
                        } catch (err) {
                          console.error(`Error downloading call ${c.id}:`, err);
                        }
                      });

                      await Promise.all(downloadPromises);
                      const content = await zip.generateAsync({ type: "blob" });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(content);
                      link.download = `historial_llamadas_${selectedPatientForInfo?.name?.replace(/\s+/g, '_')}.zip`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      toast({
                        title: "Descarga completada",
                        description: "El archivo ZIP se ha generado correctamente.",
                      });
                    } catch (error) {
                      console.error("Error generating ZIP:", error);
                      toast({
                        title: "Error en la descarga",
                        description: "No se pudieron procesar algunos archivos.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="h-7 px-3 rounded-lg bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                >
                  <Download className="h-3 w-3" />
                  Descargar todo
                </Button>
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto no-scrollbar pr-1 space-y-4">
              {(() => {
                const cleanPatientPhone = selectedPatientForInfo?.phone?.replace(/\D/g, '') || "";
                const patientCallsRaw = (calls || [])
                  .filter(c => {
                    if (selectedPatientForInfo && c.patient_id === selectedPatientForInfo.id) return true;
                    const cleanCallPhone = c.phone_number?.replace(/\D/g, '') || "";
                    return cleanCallPhone && cleanPatientPhone && (cleanCallPhone.endsWith(cleanPatientPhone) || cleanPatientPhone.endsWith(cleanCallPhone));
                  })
                  .sort((a, b) => (parseToDate(b.timestamp)?.getTime() || 0) - (parseToDate(a.timestamp)?.getTime() || 0));

                const patientCalls = patientCallsRaw;

                return patientCalls.map((call, idx) => (
                  <div key={call.id} className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 space-y-4 group hover:border-blue-600/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-0.5">
                          {idx === 0 ? "Última llamada" : `Llamada #${patientCalls.length - idx}`}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {parseToDate(call.timestamp)?.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) || '---'}
                        </span>
                      </div>
                      {(() => {
                        const d = Number(call.duration);
                        if (!d || isNaN(d)) return null;
                        const mins = Math.floor(d / 60);
                        const secs = Math.floor(d % 60);
                        return (
                          <div className="text-[10px] font-black text-slate-400 tabular-nums bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">
                            {mins}:{secs.toString().padStart(2, '0')}
                          </div>
                        );
                      })()}
                    </div>

                    <CallAudioPlayer url={call.recording_url} />
                  </div>
                ));
              })()}
            </div>

            <DialogFooter className="mt-6 shrink-0">
              <Button
                className="w-full bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/20 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white shadow-none border-none"
                onClick={() => setIsCallHistoryDialogOpen(false)}
              >
                Cerrar Historial
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
  )
}

"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Settings,
  User,
  Building,
  Bell,
  Globe,
  Save,
  Trash2,
  Paintbrush,
  Sun,
  Moon,
  Laptop,
  Smartphone,
  Plus,
  MessageSquare,
  LogOut,
  ShieldCheck,
  Cpu,
  Info,
  Clock,
  Calendar,
  X
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "@/hooks/use-toast"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { useData } from "@/context/data-context"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/context/auth-context"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Search, Globe as GlobeIcon, KeyRound, Terminal } from "lucide-react"

// Optimized Logs Modal Component
const SystemLogsModal = ({ 
  isOpen, 
  onClose, 
  logs,
  clinicId
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  logs: any[];
  clinicId: string;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-24">
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={onClose}
             className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
           />
           <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95, y: 20 }}
             className="relative w-full max-w-2xl bg-white dark:bg-[#0B0F17] rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/5"
           >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                      <Terminal className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50">Logs del Sistema</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Actividad técnica</p>
                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <p className="text-[9px] font-mono text-blue-500 uppercase font-bold">{clinicId}</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={onClose}
                    className="h-10 w-10 rounded-full p-0 hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </Button>
                </div>

                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 no-scrollbar scroll-smooth">
                   {logs.length === 0 ? (
                     <div className="py-20 text-center">
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Esperando actividad...</p>
                     </div>
                   ) : (
                     logs.map((log) => (
                       <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={log.id} 
                        className="p-5 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex flex-col gap-3 group transition-all hover:border-blue-500/20"
                       >
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-2 w-2 rounded-full shadow-sm",
                                  log.type === 'error' ? "bg-red-500 shadow-red-500/50" : log.type === 'success' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-blue-500 shadow-blue-500/50"
                                )} />
                                <p className="text-xs font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">{log.action}</p>
                             </div>
                             <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{log.date}</span>
                          </div>
                          <div className="flex flex-col gap-2 pl-5 border-l-2 border-slate-200 dark:border-white/10">
                             <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500 break-all leading-relaxed">
                                TX_ID: <span className="text-slate-500 dark:text-slate-300">{log.id}</span>
                             </p>
                             {log.details && (
                               <div className="mt-1 p-3 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
                                 <p className="text-[9px] font-mono text-blue-600 dark:text-blue-400 break-all overflow-hidden text-ellipsis line-clamp-3 leading-relaxed">
                                    {JSON.stringify(log.details)}
                                 </p>
                               </div>
                             )}
                          </div>
                       </motion.div>
                     ))
                   )}
                </div>
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function SettingsPage() {
  const [isUpdating, setIsUpdating] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { 
    settings, 
    updateSettings, 
    addTeamMember, 
    deleteTeamMember, 
    updateTeamMember,
    adminViewUid, 
    switchClinic, 
    getClinics,
    logs,
    logActivity
  } = useData()
  const [pendingAutoSave, setPendingAutoSave] = useState(settings.autoSaveProfile)
  const [pendingAutoSaveFromDate, setPendingAutoSaveFromDate] = useState<string | null>(settings.autoSaveFromDate || null)
  const [pendingAutoUpdatePatientName, setPendingAutoUpdatePatientName] = useState(settings.autoUpdatePatientName || false)
  const [pendingAutoUpdateConversationNames, setPendingAutoUpdateConversationNames] = useState(settings.autoUpdateConversationNames || false)
  const [isAutoSavePromptOpen, setIsAutoSavePromptOpen] = useState(false)
  const [selectedAutoSaveMode, setSelectedAutoSaveMode] = useState<'all' | 'new'>('all')
  const [modalAutoUpdatePatientName, setModalAutoUpdatePatientName] = useState(false)
  const [modalAutoUpdateConversationNames, setModalAutoUpdateConversationNames] = useState(false)
  const [pendingOpeningHour, setPendingOpeningHour] = useState(settings.openingHour || 9)
  const [pendingClosingHour, setPendingClosingHour] = useState(settings.closingHour || 18)
  const [pendingAllowBookingAtClosingHour, setPendingAllowBookingAtClosingHour] = useState(settings.allowBookingAtClosingHour || false)
  const [pendingAppointmentInterval, setPendingAppointmentInterval] = useState(settings.appointmentInterval || 30)
  const [pendingShowWeekends, setPendingShowWeekends] = useState(settings.showWeekends ?? true)
  const { user, isAdmin, updateDisplayName } = useAuth()

  // Combined effect: wait for BOTH user AND Firebase settings before updating clinic data.
  // This avoids the timing race where clinicProfile arrives before user is loaded.
  // Sync all other settings into pending states when settings object changes
  useEffect(() => {
    setPendingAutoSave(settings.autoSaveProfile);
    setPendingAutoSaveFromDate(settings.autoSaveFromDate || null);
    setPendingAutoUpdatePatientName(settings.autoUpdatePatientName || false);
    setPendingAutoUpdateConversationNames(settings.autoUpdateConversationNames || false);
    setPendingOpeningHour(settings.openingHour || 9);
    setPendingClosingHour(settings.closingHour || 18);
    setPendingAllowBookingAtClosingHour(settings.allowBookingAtClosingHour || false);
    setPendingAppointmentInterval(settings.appointmentInterval || 30);
    setPendingShowWeekends(settings.showWeekends ?? true);
    setUseLoginEmailForComms(settings.useLoginEmailForComms ?? true);
    setCommsEmail(settings.commsEmail || "");
  }, [settings])

  const [clinics, setClinics] = useState<{uid: string, name: string, email: string}[]>([])
  const [searchClinic, setSearchClinic] = useState("")
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isShowingLogs, setIsShowingLogs] = useState(false)

  // Clinic Profile State — fiscalId is intentionally NOT stored here to avoid Firebase overwriting it
  const [clinicData, setClinicData] = useState<{
    name: string; fiscalId?: string; address: string; email: string; phone: string;
  }>(settings.clinicProfile || {
    name: "",
    address: "",
    email: "",
    phone: ""
  })

  // Computed at render time from user.uid — immutable and independent of Firebase state
  const computedFiscalId = user
    ? `AMX-${user.uid.substring(0, 4).toUpperCase()}-${user.uid.substring(4, 8).toUpperCase()}`
    : "";

  // Sync Firebase clinic data into local state (name, address, email, phone) — NOT fiscalId
  useEffect(() => {
    if (settings.clinicProfile) {
      setClinicData(prev => ({
        ...prev,
        name: settings.clinicProfile!.name || prev.name,
        address: settings.clinicProfile!.address || prev.address,
        email: settings.clinicProfile!.email || prev.email || user?.email || "",
        phone: settings.clinicProfile!.phone || prev.phone,
        // fiscalId is intentionally excluded — use computedFiscalId
      }));
    }
  }, [settings.clinicProfile])

  const [useLoginEmailForComms, setUseLoginEmailForComms] = useState(settings.useLoginEmailForComms ?? true)
  const [commsEmail, setCommsEmail] = useState(settings.commsEmail || "")

  useEffect(() => {
    if (isAdmin) {
      getClinics().then(setClinics)
    }
  }, [isAdmin])

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: "Email Enviado",
        description: `Se ha enviado un enlace de recuperación a ${user.email}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el email de recuperación.",
        variant: "destructive"
      });
    } finally {
      setIsResettingPassword(false);
    }
  }

  const handleSaveAll = async () => {
    setIsUpdating(true)
    try {
      await updateSettings({
        ...settings,
        clinicProfile: { ...clinicData, fiscalId: computedFiscalId },
        openingHour: pendingOpeningHour,
        closingHour: pendingClosingHour,
        allowBookingAtClosingHour: pendingAllowBookingAtClosingHour,
        appointmentInterval: pendingAppointmentInterval,
        showWeekends: pendingShowWeekends,
        useLoginEmailForComms,
        commsEmail: useLoginEmailForComms ? "" : commsEmail
      })
      await logActivity("Cambio de configuración", "info", { section: "General" });
      
      // Sincronizar con Retell
      try {
        const idToken = await user?.getIdToken();
        await fetch("/api/retell/sync", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({
            openingHour: pendingOpeningHour,
            closingHour: pendingClosingHour,
            allowBookingAtClosingHour: pendingAllowBookingAtClosingHour,
            appointmentInterval: pendingAppointmentInterval
          })
        });
      } catch (e) {
        console.error("Error syncing with Retell in handleSaveAll:", e);
      }
      toast({
        title: "¡Configuración actualizada!",
        description: "Todos los cambios se han guardado correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Team Member State
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false)
  const [newMember, setNewMember] = useState({ name: "", role: "", email: "", color: "bg-blue-600" })

  // Sincronizar el estado local con los ajustes globales cuando estos carguen de la DB
  useEffect(() => {
    setPendingAutoSave(settings.autoSaveProfile)
    setPendingAutoUpdateConversationNames(settings.autoUpdateConversationNames || false)
    if (settings.clinicProfile) setClinicData(settings.clinicProfile)
    if (settings.openingHour !== undefined) setPendingOpeningHour(settings.openingHour)
    if (settings.closingHour !== undefined) setPendingClosingHour(settings.closingHour)
    if (settings.allowBookingAtClosingHour !== undefined) setPendingAllowBookingAtClosingHour(settings.allowBookingAtClosingHour)
    if (settings.appointmentInterval !== undefined) setPendingAppointmentInterval(settings.appointmentInterval)
    if (settings.showWeekends !== undefined) setPendingShowWeekends(settings.showWeekends)
  }, [settings.autoSaveProfile, settings.autoUpdateConversationNames, settings.clinicProfile, settings.openingHour, settings.closingHour, settings.allowBookingAtClosingHour, settings.appointmentInterval, settings.showWeekends])

  const handleSave = async (section: string) => {
    setIsUpdating(true)
    try {
      if (section === "Clínica") {
        await updateSettings({ clinicProfile: clinicData })
      } else if (section === "Comportamiento") {
        // La actualización de settings ya se hizo en el onClick del botón
        // Ahora sincronizamos con Retell
        try {
          const idToken = await user?.getIdToken();
          await fetch("/api/retell/sync", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({
              openingHour: pendingOpeningHour,
              closingHour: pendingClosingHour,
              allowBookingAtClosingHour: pendingAllowBookingAtClosingHour,
              appointmentInterval: pendingAppointmentInterval
            })
          });
          console.log("Retell sync triggered");
        } catch (e) {
          console.error("Error syncing with Retell:", e);
        }
      }
      toast({
        title: "Guardado",
        description: `Configuración de ${section} actualizada.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <main className="flex-1 px-12 py-10 overflow-y-auto no-scrollbar">
      <div className="max-w-4xl mx-auto">
        {/* Header — matches Dashboard style exactly */}
        <div className="flex items-end justify-between border-b border-slate-100 dark:border-border pb-6 mb-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">Configuración</h1>
            <p className="text-sm font-medium text-slate-400 mt-0.5">Administra las preferencias globales de tu clínica</p>
          </motion.div>
          <button 
            onClick={() => setIsShowingLogs(true)}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-500 transition-colors"
          >
            Ver Logs del Sistema
          </button>
        </div>

        <Tabs defaultValue="clinica" className="space-y-8">
          <TabsList className="bg-slate-100/50 dark:bg-transparent p-1.5 rounded-[24px] h-auto flex gap-1 w-fit border border-slate-100 dark:border-white/10">
            <TabsTrigger value="clinica" className="rounded-[18px] gap-2 px-6 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 data-[state=active]:bg-white data-[state=active]:dark:bg-blue-600 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm dark:data-[state=active]:shadow-none transition-all dark:bg-transparent shadow-none dark:shadow-none">
              <Building className="h-3.5 w-3.5" /> Clínica
            </TabsTrigger>
            <TabsTrigger value="equipo" className="rounded-[18px] gap-2 px-6 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 data-[state=active]:bg-white data-[state=active]:dark:bg-blue-600 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm dark:data-[state=active]:shadow-none transition-all dark:bg-transparent shadow-none dark:shadow-none">
              <User className="h-3.5 w-3.5" /> Equipo
            </TabsTrigger>
            <TabsTrigger value="apariencia" className="rounded-[18px] gap-2 px-6 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 data-[state=active]:bg-white data-[state=active]:dark:bg-blue-600 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm dark:data-[state=active]:shadow-none transition-all dark:bg-transparent shadow-none dark:shadow-none">
              <Paintbrush className="h-3.5 w-3.5" /> Tema
            </TabsTrigger>
            <TabsTrigger value="notificaciones" className="rounded-[18px] gap-2 px-6 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 data-[state=active]:bg-white data-[state=active]:dark:bg-blue-600 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm dark:data-[state=active]:shadow-none transition-all dark:bg-transparent shadow-none dark:shadow-none">
              <Bell className="h-3.5 w-3.5" /> Alertas
            </TabsTrigger>
            <TabsTrigger value="comportamiento" className="rounded-[18px] gap-2 px-6 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 data-[state=active]:bg-white data-[state=active]:dark:bg-blue-600 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm dark:data-[state=active]:shadow-none transition-all dark:bg-transparent shadow-none dark:shadow-none">
              <Cpu className="h-3.5 w-3.5" /> Comportamiento
            </TabsTrigger>
            <TabsTrigger value="seguridad" className="rounded-[18px] gap-2 px-6 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 data-[state=active]:bg-white data-[state=active]:dark:bg-blue-600 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm dark:data-[state=active]:shadow-none transition-all dark:bg-transparent shadow-none dark:shadow-none">
              <ShieldCheck className="h-3.5 w-3.5" /> Seguridad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clinica" className="mt-0">
            <div className="bg-white dark:bg-background rounded-[40px] shadow-sm shadow-none border border-slate-50 dark:border-border overflow-hidden">
              <div className="p-10 border-b border-slate-50 dark:border-border">
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50">Perfil de la Clínica</h2>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Información corporativa y de contacto</p>
              </div>
              <div className="p-10">
                <div className="mb-10">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nombre Comercial de la Clínica</Label>
                    <Input 
                      value={clinicData.name}
                      onChange={(e) => setClinicData({...clinicData, name: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-50 dark:bg-accent/10 border-slate-100 dark:border-border font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1">
                      ID Fiscal / Registro <ShieldCheck className="h-3 w-3 text-blue-500" />
                    </Label>
                    <Input 
                      value={computedFiscalId}
                      readOnly
                      className="h-14 rounded-2xl bg-slate-100 dark:bg-accent/5 border-slate-100 dark:border-border font-black text-slate-400 cursor-not-allowed uppercase tracking-widest"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Dirección Principal</Label>
                    <Input 
                      value={clinicData.address}
                      onChange={(e) => setClinicData({...clinicData, address: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-50 dark:bg-accent/10 border-slate-100 dark:border-border font-bold"
                      placeholder="Calle, Ciudad, CP"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Corporativo</Label>
                    <Input 
                      value={clinicData.email}
                      onChange={(e) => setClinicData({...clinicData, email: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-50 dark:bg-accent/10 border-slate-100 dark:border-border font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Teléfono</Label>
                    <Input 
                      value={clinicData.phone}
                      onChange={(e) => setClinicData({...clinicData, phone: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-50 dark:bg-accent/10 border-slate-100 dark:border-border font-bold"
                    />
                  </div>
                </div>

                <div className="p-8 rounded-[32px] bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 mb-10">
                  <div className="flex items-start gap-4">
                    <Checkbox 
                      id="comms-email" 
                      checked={useLoginEmailForComms}
                      onCheckedChange={(checked) => setUseLoginEmailForComms(checked as boolean)}
                      className="mt-1 rounded-md border-blue-200 dark:border-blue-500/30 data-[state=checked]:bg-blue-600"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="comms-email" className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight cursor-pointer">
                        Usar el mismo correo para comunicaciones de AllenMax
                      </Label>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Recibirás avisos importantes, actualizaciones y novedades en tu email principal.
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {!useLoginEmailForComms && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 24 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email de Comunicaciones Preferido</Label>
                          <Input 
                            value={commsEmail}
                            onChange={(e) => setCommsEmail(e.target.value)}
                            placeholder="comunicaciones@tuclinica.com"
                            className="h-14 rounded-2xl bg-white dark:bg-background border-blue-100 dark:border-blue-500/20 font-bold"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="px-10 py-6 bg-slate-50 dark:bg-background border-t border-slate-50 dark:border-border flex justify-end">
                <Button
                  className="rounded-2xl bg-blue-600 hover:bg-blue-700 h-12 px-10 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-none transition-all active:scale-95"
                  onClick={handleSaveAll}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="equipo" className="mt-0">
            <div className="bg-white dark:bg-background rounded-[40px] shadow-sm shadow-none border border-slate-50 dark:border-border p-10">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50 mb-8">Gestión de Equipo</h2>
              <div className="space-y-4">
                {(settings.team || []).map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-5 rounded-3xl border border-slate-50 dark:border-border/50 bg-white dark:bg-accent/10 hover:border-slate-100 dark:hover:border-slate-700 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-inner", member.color)}>
                        {member.name ? member.name.split(' ').map(n => n[0]).join('') : '??'}
                      </div>
                      <div>
                         <p className="font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight text-sm">{member.name || 'Sin Nombre'}</p>
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300">
                        {member.role}
                      </span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl"
                        onClick={() => {
                          setNewMember(member);
                          setIsTeamDialogOpen(true);
                        }}
                      >
                        <Paintbrush className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"
                        onClick={() => {
                          if (confirm(`¿Eliminar a ${member.name} del equipo?`)) {
                            deleteTeamMember(member.id);
                            toast({ title: "Miembro eliminado", description: `${member.name} ya no forma parte del equipo.` });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full h-16 border-2 border-dashed border-slate-100 dark:border-border rounded-[28px] text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all"
                  onClick={() => setIsTeamDialogOpen(true)}
                >
                  + Añadir Miembro
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="apariencia" className="mt-0">
            <div className="bg-white dark:bg-background rounded-[40px] shadow-sm shadow-none border border-slate-50 dark:border-border p-10">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50 mb-8">Interfaz Visual</h2>
              <div className="grid grid-cols-3 gap-8">
                {[
                  { id: 'light', name: 'LIGHT', icon: Sun },
                  { id: 'dark', name: 'DARK', icon: Moon },
                  { id: 'elite-dark', name: 'ELITE DARK', icon: Cpu },
                  { id: 'system', name: 'AUTO SYSTEM', icon: Laptop },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setTheme(mode.id)}
                    className={cn(
                      "group flex flex-col items-center gap-6 p-10 rounded-[40px] border-2 transition-all relative overflow-hidden",
                      theme === mode.id
                        ? "border-blue-500 bg-blue-50/10"
                        : "border-slate-50 dark:border-border/50 hover:border-blue-100 dark:hover:border-blue-500/30 hover:bg-blue-50/20 dark:hover:bg-blue-500/10"
                    )}
                  >
                    <div className={cn(
                      "h-20 w-20 rounded-3xl flex items-center justify-center transition-all shadow-inner",
                      theme === mode.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-50 dark:bg-accent/10 text-slate-400 dark:text-slate-500 group-hover:bg-blue-600 group-hover:text-white"
                    )}>
                      <mode.icon className="h-10 w-10" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-colors",
                      theme === mode.id
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-50"
                    )}>
                      {mode.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notificaciones" className="mt-0">
            <div className="bg-white dark:bg-background rounded-[40px] shadow-sm shadow-none border border-slate-50 dark:border-border p-10">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50 mb-8">Canales de Alerta</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-accent/10 border border-slate-50 dark:border-border/50 transition-all hover:bg-white dark:hover:bg-accent group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-accent/50 text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">Email Diario</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Resumen matutino de agenda</p>
                    </div>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
                </div>
                <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-accent/10 border border-slate-50 dark:border-border/50 transition-all hover:bg-white dark:hover:bg-accent group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 transition-all group-hover:bg-emerald-600 group-hover:text-white">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">WhatsApp Admin</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Notificación de citas nuevas</p>
                    </div>
                  </div>
                  <Switch className="data-[state=checked]:bg-emerald-500" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comportamiento" className="mt-0">
              <div className="bg-white dark:bg-background rounded-[40px] shadow-sm shadow-none border border-slate-50 dark:border-border p-10">
                <div className="flex items-center justify-between mb-8 h-9">
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50">Comportamiento del Sistema</h2>
                  
                  <div className="min-w-[140px] flex justify-end">
                    <AnimatePresence>
                    {(pendingAutoSave !== settings.autoSaveProfile || 
                      pendingAutoUpdatePatientName !== (settings.autoUpdatePatientName || false) || 
                      pendingAutoUpdateConversationNames !== (settings.autoUpdateConversationNames || false) ||
                      pendingOpeningHour !== (settings.openingHour ?? 9) ||
                      pendingClosingHour !== (settings.closingHour ?? 18) ||
                      pendingAllowBookingAtClosingHour !== (settings.allowBookingAtClosingHour ?? false) ||
                      pendingAppointmentInterval !== (settings.appointmentInterval ?? 30) ||
                      pendingShowWeekends !== (settings.showWeekends ?? true)) && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          size="sm"
                          className="h-9 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/30 transition-all active:scale-95"
                          onClick={async () => {
                            await updateSettings({ 
                              autoSaveProfile: pendingAutoSave,
                              autoSaveFromDate: pendingAutoSaveFromDate,
                              autoUpdatePatientName: pendingAutoUpdatePatientName,
                              autoUpdateConversationNames: pendingAutoUpdateConversationNames,
                              openingHour: pendingOpeningHour,
                              closingHour: pendingClosingHour,
                              allowBookingAtClosingHour: pendingAllowBookingAtClosingHour,
                              appointmentInterval: pendingAppointmentInterval,
                              showWeekends: pendingShowWeekends
                            });
                            await handleSave("Comportamiento");
                          }}
                        >
                          Aplicar Cambios
                        </Button>
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-accent/10 border border-slate-50 dark:border-border/50 transition-all hover:bg-white dark:hover:bg-accent group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-blue-50 dark:bg-accent/50 text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white">
                        <Save className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">Guardado automático de perfil de cliente</p>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="text-slate-300 hover:text-blue-500 transition-colors cursor-help p-1">
                                  <Info className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-slate-900 text-white border-none p-4 rounded-2xl max-w-xs shadow-2xl animate-in fade-in zoom-in duration-150">
                                <p className="text-[11px] font-bold leading-relaxed">
                                  Si está activo, el sistema creará una ficha de paciente automáticamente al recibir un mensaje. <br/><br/>
                                  <span className="text-blue-400">Nota:</span> Se ignorarán los contactos identificados como "Pacientes Desconocidos" para mantener la base de datos limpia.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Guarda automáticamente los nuevos contactos como pacientes.</p>
                      </div>
                    </div>
                    <Switch 
                      checked={pendingAutoSave} 
                      onCheckedChange={(checked) => {
                        if (checked && !settings.autoSaveProfile) {
                          setModalAutoUpdatePatientName(pendingAutoUpdatePatientName);
                          setModalAutoUpdateConversationNames(pendingAutoUpdateConversationNames);
                          setIsAutoSavePromptOpen(true);
                        } else {
                          setPendingAutoSave(checked);
                          if (!checked) {
                            setPendingAutoSaveFromDate(settings.autoSaveFromDate || null);
                            setPendingAutoUpdatePatientName(settings.autoUpdatePatientName || false);
                            setPendingAutoUpdateConversationNames(settings.autoUpdateConversationNames || false);
                          }
                        }
                      }}
                      className="data-[state=checked]:bg-blue-600" 
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-accent/10 border border-slate-50 dark:border-border/50 transition-all hover:bg-white dark:hover:bg-accent group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 transition-all group-hover:bg-indigo-600 group-hover:text-white">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">Mostrar Fines de Semana</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Muestra sábados y domingos en las vistas del calendario.</p>
                      </div>
                    </div>
                    <Switch 
                      checked={pendingShowWeekends} 
                      onCheckedChange={setPendingShowWeekends}
                      className="data-[state=checked]:bg-indigo-600" 
                    />
                  </div>

                  <div className="p-10 rounded-[32px] bg-slate-50 dark:bg-accent/10 border border-slate-100 dark:border-border mt-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 rounded-2xl bg-blue-50 dark:bg-accent/50 text-blue-600">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">Horario de la Clínica</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Define el rango de horas disponibles en el calendario.</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Hora de Apertura</Label>
                        <Select value={pendingOpeningHour.toString()} onValueChange={(v) => setPendingOpeningHour(parseInt(v))}>
                          <SelectTrigger className="w-full h-12 rounded-2xl bg-white dark:bg-background border border-slate-200 dark:border-border font-bold px-4 text-sm shadow-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-slate-100 dark:border-border shadow-2xl p-1 max-h-60">
                            {Array.from({ length: 24 }).map((_, i) => (
                              <SelectItem key={i} value={i.toString()} className="rounded-xl py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:bg-blue-50 dark:focus:bg-blue-500/10 focus:text-blue-700">
                                {i.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Hora de Cierre</Label>
                        <Select value={pendingClosingHour.toString()} onValueChange={(v) => setPendingClosingHour(parseInt(v))}>
                          <SelectTrigger className="w-full h-12 rounded-2xl bg-white dark:bg-background border border-slate-200 dark:border-border font-bold px-4 text-sm shadow-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-slate-100 dark:border-border shadow-2xl p-1 max-h-60">
                            {Array.from({ length: 24 }).map((_, i) => (
                              <SelectItem key={i} value={i.toString()} className="rounded-xl py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:bg-blue-50 dark:focus:bg-blue-500/10 focus:text-blue-700">
                                {i.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-border/50">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            pendingAllowBookingAtClosingHour ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                          )}>
                            <Clock className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">Permitir citas en la hora de cierre</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                              {pendingAllowBookingAtClosingHour 
                                ? `Se pueden agendar citas a las ${pendingClosingHour.toString().padStart(2, '0')}:00` 
                                : `La última cita permitida será a las ${(pendingClosingHour - 1).toString().padStart(2, '0')}:00`}
                            </p>
                          </div>
                        </div>
                        <Switch 
                          checked={pendingAllowBookingAtClosingHour} 
                          onCheckedChange={setPendingAllowBookingAtClosingHour}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>

                      <div className="flex flex-col gap-4 p-6 rounded-2xl bg-white dark:bg-background border border-slate-100 dark:border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Duración / Intervalo de Cita</Label>
                            <p className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">Define el salto de tiempo entre cada espacio disponible</p>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <div className="flex bg-slate-100/50 dark:bg-accent/10 p-1 rounded-2xl border border-slate-100 dark:border-border/50">
                              {[
                                { label: "15m", value: 15 },
                                { label: "30m", value: 30 },
                                { label: "45m", value: 45 },
                                { label: "1h", value: 60 },
                                { label: "1.5h", value: 90 },
                              ].map((interval) => (
                                <button
                                  key={interval.value}
                                  onClick={() => setPendingAppointmentInterval(interval.value)}
                                  className={cn(
                                    "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    pendingAppointmentInterval === interval.value
                                      ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm"
                                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5"
                                  )}
                                >
                                  {interval.label}
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-accent/5 border border-slate-100 dark:border-border/50">
                              <span className="text-[9px] font-black uppercase text-slate-400 mr-2">Personalizado:</span>
                              
                              <div className="flex items-center gap-1">
                                <Select 
                                  value={Math.floor(pendingAppointmentInterval / 60).toString()} 
                                  onValueChange={(h) => setPendingAppointmentInterval(parseInt(h) * 60 + (pendingAppointmentInterval % 60))}
                                >
                                  <SelectTrigger className="w-12 h-7 rounded-lg bg-white dark:bg-background border-none font-black text-[10px] p-0 flex justify-center shadow-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl p-1 min-w-[60px]">
                                    {[0,1,2,3,4,5,6,7,8].map(h => (
                                      <SelectItem key={h} value={h.toString()} className="text-[10px] font-black">{h}h</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center gap-1">
                                <Select 
                                  value={(pendingAppointmentInterval % 60).toString()} 
                                  onValueChange={(m) => setPendingAppointmentInterval(Math.floor(pendingAppointmentInterval / 60) * 60 + parseInt(m))}
                                >
                                  <SelectTrigger className="w-12 h-7 rounded-lg bg-white dark:bg-background border-none font-black text-[10px] p-0 flex justify-center shadow-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl p-1 min-w-[60px]">
                                    {[0,5,10,15,20,25,30,35,40,45,50,55].map(m => (
                                      <SelectItem key={m} value={m.toString()} className="text-[10px] font-black">{m}m</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </TabsContent>

          <TabsContent value="seguridad" className="mt-0">
            <div className="bg-white dark:bg-background rounded-[40px] shadow-sm shadow-none border border-slate-50 dark:border-border p-10">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50 mb-4">Seguridad y Sesión</h2>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-8">Administra el acceso a tu cuenta clínica</p>
              
              <div className="space-y-6">
                <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-accent/10 border border-slate-100 dark:border-border flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5 text-center sm:text-left">
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <KeyRound className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">Cambiar Contraseña</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Recibirás un enlace seguro para establecer una nueva clave.</p>
                    </div>
                  </div>
                  <Button 
                    className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 transition-all active:scale-95 whitespace-nowrap"
                    onClick={handlePasswordReset}
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? "Enviando..." : "Enviar Enlace de Cambio"}
                  </Button>
                </div>

                <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-accent/10 border border-slate-100 dark:border-border flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5 text-center sm:text-left">
                    <div className="h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                      <LogOut className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">Cerrar Sesión</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Finaliza tu sesión actual de forma segura en este dispositivo.</p>
                    </div>
                  </div>
                  <Button 
                    variant="destructive"
                    className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 font-black uppercase tracking-widest text-xs shadow-xl shadow-red-500/20 transition-all active:scale-95 whitespace-nowrap"
                    onClick={() => {
                      toast({ title: "Cerrando sesión...", description: "Redirigiendo a la página de inicio." });
                      setTimeout(() => router.push('/login'), 1000);
                    }}
                  >
                    Salir del Sistema
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      <SystemLogsModal 
        isOpen={isShowingLogs} 
        onClose={() => setIsShowingLogs(false)} 
        logs={logs}
        clinicId={adminViewUid || user?.uid || "unknown"}
      />

      <Dialog open={isAutoSavePromptOpen} onOpenChange={(open) => {
        if (!open) {
          setPendingAutoSave(false);
          setIsAutoSavePromptOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-[460px] rounded-[32px] p-8 border-none bg-white dark:bg-background shadow-2xl">
          <DialogTitle className="sr-only">Confirmar Actualización de CRM</DialogTitle>
          <DialogHeader className="flex flex-col items-center mb-0">
            <div className="h-16 w-16 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center" style={{ marginBottom: '28px' }}>
              <Save className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50 text-center" style={{ marginBottom: '16px' }}>Configurar Autoguardado</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center px-4" style={{ marginBottom: '20px' }}>
              Estás a punto de activar el guardado automático de pacientes. Configura las siguientes opciones:
            </DialogDescription>
            
            <div className="flex flex-col gap-4 w-full text-left bg-slate-50 dark:bg-accent/10 p-6 rounded-2xl border border-slate-100 dark:border-border" style={{ marginBottom: '32px' }}>
              <div className="flex items-center space-x-4">
                <Switch 
                  id="update-names" 
                  checked={modalAutoUpdatePatientName} 
                  onCheckedChange={(c) => setModalAutoUpdatePatientName(c as boolean)} 
                  className="data-[state=checked]:bg-blue-600 mt-1 self-start"
                />
                <label htmlFor="update-names" className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer flex-1 flex flex-col">
                  Actualizar nombre en el CRM
                  <span className="text-[10px] text-slate-400 font-medium normal-case mt-1">El perfil del CRM se actualizará si el usuario envía un nombre distinto en el chat.</span>
                </label>
              </div>

              <div className="h-[1px] w-full bg-slate-200 dark:bg-border/50 my-2"></div>

              <div className="flex items-center space-x-4">
                <Switch 
                  id="update-conv-names" 
                  checked={modalAutoUpdateConversationNames} 
                  onCheckedChange={(c) => setModalAutoUpdateConversationNames(c as boolean)} 
                  className="data-[state=checked]:bg-indigo-600 mt-1 self-start"
                />
                <label htmlFor="update-conv-names" className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer flex-1 flex flex-col">
                  Actualizar nombres en conversaciones
                  <span className="text-[10px] text-slate-400 font-medium normal-case mt-1">Sobrescribe el nombre en el historial de chats cuando introduce uno nuevo.</span>
                </label>
              </div>
            </div>

            <p className="text-xs font-black uppercase tracking-widest text-slate-400 text-center w-full" style={{ marginBottom: '16px' }}>¿Cómo deseas aplicar el autoguardado?</p>

            <div className="flex gap-3 w-full" style={{ marginBottom: '24px' }}>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 h-auto p-4 flex flex-col items-center gap-3 justify-center rounded-2xl whitespace-normal text-center transition-all",
                  selectedAutoSaveMode === 'all' 
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-blue-500/20" 
                    : "border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-[#0F172A]"
                )}
                onClick={() => setSelectedAutoSaveMode('all')}
              >
                <div className={cn(
                  "p-2 rounded-full transition-colors",
                  selectedAutoSaveMode === 'all' 
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-500/30" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}>
                  <Save className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className={cn(
                    "font-bold text-sm leading-tight transition-colors",
                    selectedAutoSaveMode === 'all' ? "text-blue-700 dark:text-blue-400" : "text-slate-900 dark:text-slate-100"
                  )}>Historial Pasado</span>
                  <span className="text-[9px] text-slate-400 font-medium normal-case leading-tight">Guarda los chats pasados como pacientes.</span>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className={cn(
                  "flex-1 h-auto p-4 flex flex-col items-center gap-3 justify-center rounded-2xl whitespace-normal text-center transition-all",
                  selectedAutoSaveMode === 'new' 
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-blue-500/20" 
                    : "border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-[#0F172A]"
                )}
                onClick={() => setSelectedAutoSaveMode('new')}
              >
                <div className={cn(
                  "p-2 rounded-full transition-colors",
                  selectedAutoSaveMode === 'new' 
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-500/30" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}>
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className={cn(
                    "font-black text-sm uppercase tracking-tight leading-tight transition-colors",
                    selectedAutoSaveMode === 'new' ? "text-blue-700 dark:text-blue-400" : "text-slate-900 dark:text-slate-100"
                  )}>Solo Nuevos</span>
                  <span className="text-[9px] opacity-80 font-medium normal-case leading-tight text-slate-400">Ignora el historial y aplica desde hoy.</span>
                </div>
              </Button>
            </div>
            
            <div className="flex flex-col w-full gap-2 mt-2">
              <Button 
                className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                onClick={() => {
                  setPendingAutoSave(true);
                  setPendingAutoUpdatePatientName(modalAutoUpdatePatientName);
                  setPendingAutoUpdateConversationNames(modalAutoUpdateConversationNames);
                  if (selectedAutoSaveMode === 'all') {
                    setPendingAutoSaveFromDate(null);
                  } else {
                    setPendingAutoSaveFromDate(new Date().toISOString());
                  }
                  setIsAutoSavePromptOpen(false);
                }}
              >
                Guardar Opciones
              </Button>
              <Button variant="ghost" onClick={() => {
                setPendingAutoSave(false);
                setIsAutoSavePromptOpen(false);
              }} className="text-xs font-bold text-slate-400 hover:text-slate-600 h-10 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50">
                Cancelar
              </Button>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-[32px] p-8 border-none bg-white dark:bg-background shadow-2xl">
          <DialogTitle className="sr-only">Confirmar Sincronización de Conversaciones</DialogTitle>
          <DialogHeader className="flex flex-col items-center mb-0">
            <div className="h-16 w-16 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center" style={{ marginBottom: '28px' }}>
              <User className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50 text-center" style={{ marginBottom: '16px' }}>
              {(newMember as any).id ? "Editar Perfil" : "Añadir Miembro"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center px-4" style={{ marginBottom: '20px' }}>
              {(newMember as any).id 
                ? "Actualiza la información de este miembro del equipo." 
                : "Añade un nuevo miembro a tu equipo de gestión para que pueda acceder al sistema."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nombre Completo</Label>
              <Input 
                placeholder="Ej. Administrador de Gestión" 
                className="h-12 rounded-2xl bg-slate-50 dark:bg-accent/10 border-slate-100 dark:border-border font-bold"
                value={newMember.name}
                onChange={(e) => setNewMember({...newMember, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Rol / Función</Label>
                <Input 
                  placeholder="Ej. Administración" 
                  className="h-12 rounded-2xl bg-slate-50 dark:bg-accent/10 border-slate-100 dark:border-border font-bold"
                  value={newMember.role}
                  onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Color de Perfil</Label>
                <select 
                  className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-accent/10 border border-slate-100 dark:border-border font-bold px-4 text-sm appearance-none"
                  value={newMember.color}
                  onChange={(e) => setNewMember({...newMember, color: e.target.value})}
                >
                  <option value="bg-blue-600">Azul</option>
                  <option value="bg-emerald-500">Esmeralda</option>
                  <option value="bg-amber-500">Ámbar</option>
                  <option value="bg-purple-600">Púrpura</option>
                  <option value="bg-rose-500">Rosa</option>
                  <option value="bg-slate-700">Gris Oscuro</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Correo Electrónico</Label>
              <Input 
                type="email" 
                placeholder="email@clinica.com" 
                className="h-12 rounded-2xl bg-slate-50 dark:bg-accent/10 border-slate-100 dark:border-border font-bold"
                value={newMember.email}
                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button 
              variant="ghost" 
              onClick={() => setIsTeamDialogOpen(false)}
              className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400"
            >
              Cancelar
            </Button>
              <Button 
                className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                onClick={async () => {
                  if (!newMember.name || !newMember.email) {
                    toast({ title: "Faltan datos", description: "Por favor, completa el nombre y email.", variant: "destructive" });
                    return;
                  }
                  
                  if ((newMember as any).id) {
                    await updateTeamMember((newMember as any).id, newMember);
                    toast({ title: "Perfil Actualizado", description: `Los cambios en ${newMember.name} han sido guardados.` });
                  } else {
                    await addTeamMember(newMember);
                    toast({ title: "Miembro Añadido", description: `${newMember.name} ha sido añadido al equipo.` });
                  }
                  
                  setIsTeamDialogOpen(false);
                  setNewMember({ name: "", role: "", email: "", color: "bg-blue-600" });
                }}
              >
                {(newMember as any).id ? "Guardar Cambios" : "Añadir al Equipo"}
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

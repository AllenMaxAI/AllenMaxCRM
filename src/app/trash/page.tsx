"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useData } from "@/context/data-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Trash2, 
  RotateCcw, 
  Users, 
  Calendar, 
  MessageSquare,
  Clock,
  Eye,
  Phone,
  Headphones
} from "lucide-react"
import { CallAudioPlayer } from "@/components/conversations/call-audio-player"

import { cn, parseToDate } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { resolvePatientName, cleanSummary } from "@/lib/patient-utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Tab = 'patients' | 'appointments' | 'conversations'

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

const formatPhone = (phone: string | undefined | null) => {
  if (!phone) return "";
  let cleaned = phone.trim().replace(/\s+/g, "");
  let prefix = "";
  
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
    formatted = `${raw.slice(0, 3)} ${raw.slice(3, 5)} ${raw.slice(5, 7)} ${raw.slice(7)}`;
  } else if (raw.length === 10) {
    formatted = `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
  } else if (raw.length === 8) {
    formatted = `${raw.slice(0, 4)} ${raw.slice(4)}`;
  }
  
  return (prefix + formatted).trim();
};

export default function TrashPage() {
  const { trash, restorePatient, restoreAppointment, restoreConversation, restoreCall, deletePermanently, clearTrash, patients, settings, effectiveUid } = useData()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('patients')
  const [isClearing, setIsClearing] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Restore Patient Dialog state
  const [restorePatientId, setRestorePatientId] = useState<string | null>(null)
  const [restoreApps, setRestoreApps] = useState(true)
  const [restoreConvs, setRestoreConvs] = useState(true)

  // Delete Confirm Dialog state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // View Conversation Dialog state
  const [viewingConversation, setViewingConversation] = useState<any | null>(null)
  const [viewingMessages, setViewingMessages] = useState<any[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  const handleViewConversation = async (conversation: any) => {
    setViewingConversation(conversation)
    setIsLoadingMessages(true)
    try {
      const idToken = await user?.getIdToken()
      const res = await fetch(`/api/conversations/${conversation.id}/messages?clinicId=${effectiveUid}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })
      const data = await res.json()
      setViewingMessages(data)
    } catch (err) {
      console.error("Error fetching messages:", err)
      setViewingMessages([])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const patientTrash = trash.filter(t => t.type === 'patient')
  const appointmentTrash = trash.filter(t => t.type === 'appointment')
  const conversationTrash = trash.filter(t => t.type === 'conversation' || t.type === 'call')

  const tabs = [
    { id: 'patients' as Tab, label: 'Pacientes', icon: Users, count: patientTrash.length },
    { id: 'appointments' as Tab, label: 'Citas', icon: Calendar, count: appointmentTrash.length },
    { id: 'conversations' as Tab, label: 'Conversaciones', icon: MessageSquare, count: conversationTrash.length },
  ]

  const formatDate = (date: any) => {
    const d = parseToDate(date);
    if (!d) return "---";
    return d.toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const getDaysLeft = (deletedAt: any) => {
    const date = parseToDate(deletedAt);
    if (!date) return 30;
    const diff = Date.now() - date.getTime();
    return Math.max(0, 30 - Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  const handleConfirmRestorePatient = async () => {
    if (!restorePatientId) return
    await restorePatient(restorePatientId, { restoreAppointments: restoreApps, restoreConversations: restoreConvs })
    toast({ title: "Paciente restaurado", description: "El paciente ha vuelto a la lista de pacientes." })
    setRestorePatientId(null)
  }

  const handleRestoreAppointment = async (trashId: string) => {
    await restoreAppointment(trashId)
    toast({ title: "Cita restaurada", description: "La cita ha sido recuperada correctamente." })
  }

  const handleRestoreConversation = async (trashId: string) => {
    await restoreConversation(trashId)
    toast({ title: "Conversación restaurada", description: "La conversación ha sido recuperada correctamente." })
  }

  const handleRestoreCall = async (trashId: string) => {
    await restoreCall(trashId)
    toast({ title: "Llamada restaurada", description: "El registro de llamada ha sido recuperado correctamente." })
  }

  const handleDeletePermanently = async () => {
    if (!deleteConfirmId) return
    await deletePermanently(deleteConfirmId)
    toast({ title: "Eliminado permanentemente", description: "El elemento ha sido borrado para siempre.", variant: "destructive" })
    setDeleteConfirmId(null)
  }

  const handleClearTrash = async () => {
    setIsClearing(true)
    try {
      const typeMap: Record<Tab, 'patient' | 'appointment' | 'conversation'> = {
        'patients': 'patient',
        'appointments': 'appointment',
        'conversations': 'conversation'
      }
      await clearTrash(typeMap[activeTab])
      toast({ 
        title: "Papelera vaciada", 
        description: `Se han eliminado todos los elementos de ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}.`,
        variant: "destructive"
      })
    } catch (err) {
      console.error("Error clearing trash:", err)
      toast({ title: "Error", description: "No se pudo vaciar la papelera.", variant: "destructive" })
    } finally {
      setIsClearing(false)
      setShowClearConfirm(false)
    }
  }

  const currentItems = activeTab === 'patients' ? patientTrash : activeTab === 'appointments' ? appointmentTrash : conversationTrash

  return (
    <>
      <main className="flex-1 px-12 py-10 overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-6 mb-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">Papelera de Reciclaje</h1>
            <p className="text-sm font-medium text-slate-400 mt-0.5">Los elementos se eliminan permanentemente después de 30 días</p>
          </motion.div>

          {currentItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="h-10 px-6 rounded-xl border-red-100 hover:bg-red-50 text-red-500 font-bold text-xs gap-2 shadow-none"
            >
              <Trash2 className="h-4 w-4" />
              Vaciar {tabs.find(t => t.id === activeTab)?.label}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-100/60 dark:bg-accent/10 p-1.5 rounded-2xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200",
                activeTab === tab.id
                  ? "bg-white dark:bg-background text-slate-900 dark:text-slate-50 shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "h-5 min-w-5 px-1.5 rounded-full text-[9px] font-black flex items-center justify-center",
                  activeTab === tab.id
                    ? "bg-red-500 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {currentItems.length > 0 ? (
              <div className="space-y-3 max-w-3xl">
                {currentItems.map((item) => {
                  const patientName = item.type === 'patient'
                    ? resolvePatientName(item.data.patient?.phone, item.data.patient?.name, "", patients, settings?.preferredDisplayName)
                    : item.type === 'appointment'
                    ? resolvePatientName(item.data.appointment?.patient_phone, item.data.appointment?.patient_name, "", patients, settings?.preferredDisplayName)
                    : item.type === 'call'
                    ? resolvePatientName(item.data.call?.phone_number, "", item.data.call?.patient_name_collected, patients, settings?.preferredDisplayName)
                    : resolvePatientName(item.data.conversation?.contact_identifier, item.data.conversation?.patient_name, "", patients, settings?.preferredDisplayName)

                  const name = item.type === 'patient'
                    ? patientName
                    : item.type === 'appointment'
                    ? `Cita — ${patientName}`
                    : item.type === 'call'
                    ? `Voz — ${patientName}`
                    : `Conversación — ${patientName}`

                  const convCount = (item.data.conversations?.length || 0) + (item.data.calls?.length || 0);
                  const sub = item.type === 'patient'
                    ? `${item.data.appointments?.length || 0} ${item.data.appointments?.length === 1 ? 'cita' : 'citas'} • ${convCount} ${convCount === 1 ? 'conversación' : 'conversaciones'}`
                    : item.type === 'appointment'
                    ? item.data.appointment?.start_time 
                      ? new Date(item.data.appointment.start_time).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : ''
                    : item.type === 'call'
                    ? `Agente de voz`
                    : item.data.conversation?.channel ? normalizeChannel(item.data.conversation.channel) : ''


                  const Icon = item.type === 'patient' 
                    ? Users 
                    : item.type === 'appointment' 
                    ? Calendar 
                    : item.type === 'call'
                    ? Phone
                    : MessageSquare

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-5 bg-white dark:bg-background rounded-[24px] border border-slate-100 dark:border-border shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black text-sm text-slate-800 dark:text-slate-100">{name}</p>
                          {sub && (
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{sub}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5 text-slate-300" />
                              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                Eliminado el {formatDate(item.deleted_at)}
                              </p>
                            </div>
                            {(() => {
                              const days = getDaysLeft(item.deleted_at)
                              const color = days <= 5
                                ? 'bg-red-50 dark:bg-red-500/10 text-red-500 border-red-200 dark:border-red-500/30'
                                : days <= 15
                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 border-amber-200 dark:border-amber-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                              return (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${color}`}>
                                  {days === 0 ? 'Expira hoy' : `${days}d restantes`}
                                </span>
                              )
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.type === 'conversation' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all"
                            onClick={() => handleViewConversation(item.data.conversation)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {item.type === 'call' && item.data.call?.recording_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 rounded-xl text-blue-500 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 transition-all"
                            onClick={() => handleViewConversation({ ...item.data.call, isCall: true })}
                          >
                            <Headphones className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 px-4 rounded-xl text-blue-600 font-bold text-xs hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 gap-1.5"
                          onClick={() => {
                            if (item.type === 'patient') {
                              setRestoreApps(true)
                              setRestoreConvs(true)
                              setRestorePatientId(item.id)
                            } else if (item.type === 'appointment') {
                              handleRestoreAppointment(item.id)
                            } else if (item.type === 'call') {
                              handleRestoreCall(item.id)
                            } else {
                              handleRestoreConversation(item.id)
                            }
                          }}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Restaurar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-all"
                          onClick={() => setDeleteConfirmId(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center max-w-xs mx-auto">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-5">
                  <Trash2 className="h-9 w-9 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="font-black text-slate-400 dark:text-slate-500 text-sm">Esta sección está vacía</p>
                <p className="text-xs font-medium text-slate-300 dark:text-slate-600 mt-1">
                  Los elementos eliminados aparecerán aquí
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      
      {/* ── RESTORE PATIENT DIALOG ─────────────────────────────── */}
      <Dialog open={!!restorePatientId} onOpenChange={(open) => !open && setRestorePatientId(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[32px] p-8 border-slate-100 dark:border-border bg-white dark:bg-background text-center">
          <DialogTitle className="sr-only">Confirmar Restauración</DialogTitle>
          <DialogHeader className="flex flex-col items-center">
            <div className="h-16 w-16 bg-blue-50 dark:bg-accent/50 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <RotateCcw className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50">
              Restaurar Paciente
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 mb-4">
              ¿Qué datos asociados deseas restaurar junto al paciente?
            </DialogDescription>

            <div className="flex flex-col gap-3 w-full text-left bg-slate-50 dark:bg-accent/10 p-4 rounded-2xl border border-slate-100 dark:border-border">
              {/* Restore Appointments checkbox */}
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                  restoreApps
                    ? "bg-blue-50 dark:bg-accent/50 border-blue-200 dark:border-blue-500/30"
                    : "bg-white dark:bg-background border-slate-200 dark:border-slate-700"
                )}
                onClick={() => setRestoreApps(!restoreApps)}
              >
                <div className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-all border-2",
                  restoreApps
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-slate-300 dark:border-slate-600"
                )}>
                  {restoreApps && (
                    <svg className="h-2.5 w-2.5" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Restaurar citas asociadas</p>
                  <p className="text-[10px] font-medium text-slate-400">
                    {restorePatientId ? (trash.find(t => t.id === restorePatientId)?.data.appointments.length ?? 0) : 0} cita(s) guardada(s)
                  </p>
                </div>
              </div>

              {/* Restore Conversations checkbox */}
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                  restoreConvs
                    ? "bg-blue-50 dark:bg-accent/50 border-blue-200 dark:border-blue-500/30"
                    : "bg-white dark:bg-background border-slate-200 dark:border-slate-700"
                )}
                onClick={() => setRestoreConvs(!restoreConvs)}
              >
                <div className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-all border-2",
                  restoreConvs
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-slate-300 dark:border-slate-600"
                )}>
                  {restoreConvs && (
                    <svg className="h-2.5 w-2.5" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Restaurar conversaciones asociadas</p>
                  <p className="text-[10px] font-medium text-slate-400">
                    {restorePatientId ? (trash.find(t => t.id === restorePatientId)?.data.conversations.length ?? 0) : 0} { (trash.find(t => t.id === restorePatientId)?.data.conversations.length ?? 0) === 1 ? 'conversación' : 'conversaciones' } guardada(s)
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <DialogFooter className="flex gap-3 mt-6 sm:justify-center">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:text-slate-900 border-slate-200 dark:border-slate-700"
              onClick={() => setRestorePatientId(null)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 h-12 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-none"
              onClick={handleConfirmRestorePatient}
            >
              Restaurar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE PERMANENTLY CONFIRM DIALOG ─────────────────── */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[32px] p-8 border-slate-100 dark:border-border bg-white dark:bg-background text-center">
          <DialogTitle className="sr-only">Confirmar Eliminación Permanente</DialogTitle>
          <DialogHeader className="flex flex-col items-center">
            <div className="h-16 w-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50">
              ¿Eliminar permanentemente?
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
              Esta acción no se puede deshacer. El elemento será borrado de forma definitiva.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 mt-6 sm:justify-center">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:text-slate-900 border-slate-200 dark:border-slate-700"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-12 rounded-2xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
              onClick={handleDeletePermanently}
            >
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CLEAR TRASH CONFIRM DIALOG ────────────────────────── */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="sm:max-w-[400px] rounded-[32px] p-8 border-slate-100 dark:border-border bg-white dark:bg-background text-center">
          <DialogTitle className="sr-only">Confirmar Vaciado de Papelera</DialogTitle>
          <DialogHeader className="flex flex-col items-center">
            <div className="h-16 w-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50">
              ¿Vaciar papelera de {tabs.find(t => t.id === activeTab)?.label.toLowerCase()}?
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
              Se eliminarán permanentemente los <b>{currentItems.length}</b> elementos de esta sección. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 mt-6 sm:justify-center">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:text-slate-900 border-slate-200 dark:border-slate-700"
              onClick={() => setShowClearConfirm(false)}
              disabled={isClearing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-12 rounded-2xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
              onClick={handleClearTrash}
              disabled={isClearing}
            >
              {isClearing ? "Vaciando..." : "Sí, vaciar todo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── VIEW CONVERSATION / CALL DIALOG ─────────────────── */}
      <Dialog open={!!viewingConversation} onOpenChange={(open) => !open && setViewingConversation(null)}>
        <DialogContent className="sm:max-w-[500px] h-[80vh] sm:h-auto sm:max-h-[80vh] rounded-[32px] p-6 border-slate-100 dark:border-border bg-white dark:bg-background flex flex-col">
          <DialogTitle className="sr-only">Detalles del Elemento</DialogTitle>
          <DialogHeader className="pb-4 border-b border-slate-100 dark:border-border/50 flex-shrink-0">
            <div className="flex items-center gap-3 mb-1">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${viewingConversation?.isCall ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' : 'bg-slate-100 dark:bg-muted text-slate-500'}`}>
                {viewingConversation?.isCall ? <Headphones className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
              </div>
              <div>
                <DialogTitle className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-slate-50">
                  {viewingConversation?.isCall
                    ? (viewingConversation?.patient_name_collected || 'Llamada')
                    : (viewingConversation?.patient_name || 'Conversación')}
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {viewingConversation?.isCall ? 'Agente de voz' : (viewingConversation?.channel ? normalizeChannel(viewingConversation.channel) : 'Desconocido')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {viewingConversation?.isCall ? (
            /* ── Call detail view ── */
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 mt-4">
              {viewingConversation.recording_url && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 px-1">Grabación</p>
                  <CallAudioPlayer url={viewingConversation.recording_url} />
                </div>
              )}
              {viewingConversation.summary && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Resumen IA</p>
                  <div className="bg-slate-50 dark:bg-accent/10 rounded-2xl p-4 border border-slate-100 dark:border-border">
                    <p className="text-sm font-medium italic text-slate-600 dark:text-slate-300">
                      "{cleanSummary(viewingConversation.summary)}"
                    </p>
                  </div>
                </div>
              )}
              {viewingConversation.intent && (
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-accent/10 rounded-2xl p-4 border border-slate-100 dark:border-border">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intención:</span>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200">{viewingConversation.intent}</span>
                </div>
              )}
            </div>
          ) : (
            /* ── Chat conversation view ── */
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mt-4 space-y-4">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center py-10">
                  <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
                </div>
              ) : viewingMessages.length > 0 ? (
                viewingMessages.map((msg: any, i: number) => {
                  const isBot = msg.sender !== 'paciente';
                  return (
                    <div key={i} className={`flex ${isBot ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-[24px] p-4 text-sm whitespace-pre-wrap leading-relaxed ${
                        !isBot
                          ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-tl-sm border border-slate-100 dark:border-border'
                          : 'bg-blue-600 text-white rounded-tr-sm shadow-md font-medium'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-sm font-medium text-slate-400 py-10">No hay mensajes disponibles</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </main>
    </>
  )
}

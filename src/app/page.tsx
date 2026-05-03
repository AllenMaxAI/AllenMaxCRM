"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Clock,
  ArrowRight,
  TrendingDown,
  Activity,
  Plus
} from "lucide-react"
import { MOCK_APPOINTMENTS, MOCK_CONVERSATIONS, MOCK_PATIENTS } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { cn, parseToDate } from "@/lib/utils"
import { useData } from "@/context/data-context"
import { resolvePatientName } from "@/lib/patient-utils"

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
};

const normalizeChannel = (channel: string): string =>
  CHANNEL_MAP[channel] ?? channel;

export default function Dashboard() {
  const { appointments, patients, conversations, settings } = useData()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const todayAppointments = (appointments || [])
    .filter(a => {
      const d = parseToDate(a.start_time);
      if (!d) return false;
      const today = new Date().toDateString();
      return d.toDateString() === today;
    })
    .sort((a, b) => {
      const dateA = parseToDate(a.start_time)?.getTime() || 0;
      const dateB = parseToDate(b.start_time)?.getTime() || 0;
      return dateA - dateB;
    });

  const stats = [
    { label: "Pacientes Totales", value: (patients || []).length.toString(), icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-accent/50 dark:bg-blue-500/10", trend: "+12%", trendUp: true },
    { label: "Citas de Hoy", value: todayAppointments.length.toString(), icon: Calendar, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10 dark:bg-emerald-500/10", trend: "Normal", trendUp: true },
    { label: "Mensajes Hoy", value: (conversations || []).length.toString(), icon: MessageSquare, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10 dark:bg-purple-500/10", trend: "+8%", trendUp: true },
    { label: "Rendimiento", value: "92%", icon: Activity, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10 dark:bg-amber-500/10", trend: "-2%", trendUp: false },
  ]

  if (!mounted) return null

  return (
    <main className="flex-1 flex flex-col px-12 py-10 overflow-hidden">
      {/* Header — Standard Premium Header */}
      <div className="flex shrink-0 items-end justify-between border-b border-slate-100 dark:border-border pb-6 mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">Tablero General</h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">Bienvenido al Panel de Gestión. Resumen operativo de hoy.</p>
        </motion.div>
        <Button 
          className="rounded-xl bg-blue-600 hover:bg-blue-700 h-10 px-6 font-bold text-xs shadow-md shadow-none shadow-none transition-all active:scale-95 gap-2 text-white dark:text-white"
          onClick={() => router.push('/calendar')}
        >
          <Plus className="h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10 shrink-0">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-background p-6 rounded-[32px] border border-slate-50 dark:border-border shadow-sm shadow-none hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className={cn("flex items-center gap-1 text-[10px] font-black uppercase tracking-widest", stat.trendUp ? "text-emerald-500" : "text-amber-500")}>
                {stat.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-2 flex-1 min-h-0">
        {/* Citas de Hoy */}
        <div className="bg-white dark:bg-background rounded-[40px] border border-slate-50 dark:border-border shadow-sm shadow-none overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 dark:border-border flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-900 dark:text-slate-50 uppercase tracking-tight">Citas de Hoy</h3>
            <Button variant="ghost" size="sm" className="text-blue-600 font-bold text-xs hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl px-4" onClick={() => router.push('/calendar')}>
              Ver Calendario <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto no-scrollbar flex-1 min-h-0">
            {todayAppointments.length > 0 ? todayAppointments.map((app) => (
              <div 
                key={app.id} 
                className="flex items-center justify-between rounded-3xl border border-slate-50 dark:border-border p-4 transition-all hover:bg-slate-50 dark:hover:bg-accent dark:bg-accent/10 hover:border-blue-100 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-2xl bg-slate-50 dark:bg-accent/10 text-slate-900 dark:text-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {(() => {
                      const d = parseToDate(app.start_time);
                      return (
                        <>
                          <span className="text-[10px] font-black uppercase tracking-tighter">
                            {d ? d.toLocaleTimeString([], { hour: '2-digit', hour12: false }).split(':')[0] : '--'}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-tighter opacity-60 group-hover:opacity-100">
                            {d ? d.toLocaleTimeString([], { minute: '2-digit' }) : '--'}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-50 group-hover:text-blue-600 transition-colors uppercase tracking-tight text-sm">
                      {resolvePatientName(app.patient_phone, app.patient_name, "", patients, settings?.preferredDisplayName)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.title}</p>
                  </div>
                </div>
                <Badge className={cn("rounded-xl px-3 py-1 text-[9px] font-black uppercase tracking-widest border-none", 
                  app.status === 'confirmada' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-accent/50 text-blue-600 dark:text-blue-400'
                )}>
                  {app.status}
                </Badge>
              </div>
            )) : (
              <div className="text-center py-20">
                <Calendar className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                <p className="text-slate-400 text-sm font-bold italic">No hay citas para hoy.</p>
              </div>
            )}
          </div>
        </div>

        {/* Conversaciones IA */}
        <div className="bg-white dark:bg-background rounded-[40px] border border-slate-50 dark:border-border shadow-sm shadow-none overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 dark:border-border flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-900 dark:text-slate-50 uppercase tracking-tight">Actividad IA</h3>
            <Button variant="ghost" size="sm" className="text-blue-600 font-bold text-xs hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl px-4" onClick={() => router.push('/conversations')}>
              Ver Chats <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto no-scrollbar flex-1 min-h-0">
            {(conversations || []).slice(0, 5).map((conv) => (
              <div 
                key={conv.id} 
                className="group relative flex flex-col gap-1 rounded-3xl bg-slate-50 dark:bg-accent/10 border border-slate-100 dark:border-border p-5 transition-all hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-100 dark:hover:border-blue-900 cursor-pointer"
                onClick={() => router.push('/conversations')}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-black uppercase tracking-tight text-sm text-blue-600">
                    {resolvePatientName(conv.contact_identifier, conv.patient_name, "", patients, settings?.preferredDisplayName)}
                  </p>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {(() => {
                      const d = parseToDate(conv.updated_at);
                      return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente';
                    })()}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs font-medium text-slate-700 leading-relaxed italic mb-3">"{conv.last_message}"</p>
                <div className="flex items-center justify-between">
                  <Badge className="text-[8px] bg-white dark:bg-background text-slate-500 border-slate-100 dark:border-border font-black uppercase tracking-[2px] px-2 h-5">
                    {normalizeChannel(conv.channel)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

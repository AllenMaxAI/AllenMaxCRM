"use client"

import { motion } from "framer-motion"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Code, 
  Copy, 
  Smartphone, 
  Globe, 
  Phone, 
  MessageSquare, 
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { useData } from "@/context/data-context"
import { useEffect, useState } from "react"

export default function IntegrationsPage() {
  const { user } = useAuth()
  const { adminViewUid } = useData()
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const effectiveUid = adminViewUid || user?.uid || "UID_NOT_FOUND"
  const apiKey = `amx_live_${effectiveUid.substring(0, 8)}_${effectiveUid.substring(effectiveUid.length - 8)}`
  
  const retellWebhookUrl = `${origin}/api/webhook/retell/${effectiveUid}?api_key=${apiKey}`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado",
      description: "El identificador se ha copiado al portapapeles.",
    })
  }

  const platforms = [
    { name: "Chatbot Web", icon: MessageSquare, status: "Activo", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { name: "Chatbot WhatsApp", icon: Smartphone, status: "Activo", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { name: "Agente de Voz", icon: Phone, status: "Configurando", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
  ]

  return (
    <main className="flex-1 px-12 py-10 overflow-y-auto no-scrollbar">
      {/* Header */}
        <div className="flex items-end justify-between border-b border-slate-100 dark:border-border pb-6 mb-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">Integraciones</h1>
            <p className="text-sm font-medium text-slate-400 mt-0.5">Conecta tus agentes de IA externos con el ecosistema de Gestión IA</p>
          </motion.div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* API Credentials Card - Premium Look */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white dark:bg-background p-10 rounded-[40px] border border-slate-50 dark:border-border shadow-sm shadow-none relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck className="h-32 w-32 text-blue-600" />
              </div>
              
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-none">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">Credenciales de API</h3>
              </div>
              
              <div className="space-y-6 max-w-lg">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[2px] ml-1">Clave de Acceso (Bearer Token)</label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-accent/10 p-4 rounded-2xl border border-slate-100 dark:border-border font-mono text-xs text-slate-600 dark:text-slate-300 group/input hover:border-blue-200 transition-all">
                    <span className="flex-1 truncate">{apiKey}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-600 hover:text-white rounded-lg transition-all" onClick={() => copyToClipboard(apiKey)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[2px] ml-1">Clinic ID</label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-accent/10 p-4 rounded-2xl border border-slate-100 dark:border-border font-mono text-xs text-slate-600 dark:text-slate-300 hover:border-blue-200 transition-all">
                    <span className="flex-1">{effectiveUid}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-600 hover:text-white rounded-lg transition-all" onClick={() => copyToClipboard(effectiveUid)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>


            </div>

            {/* Retell AI Webhook Configuration */}
            <div className="bg-white dark:bg-background p-10 rounded-[40px] border border-slate-50 dark:border-border shadow-sm shadow-none relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-none">
                  <Phone className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">Retell AI Webhook</h3>
              </div>
              
              <div className="space-y-6 max-w-lg">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[2px] ml-1">Webhook URL para Retell</label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-accent/10 p-4 rounded-2xl border border-slate-100 dark:border-border font-mono text-xs text-slate-600 dark:text-slate-300 group/input hover:border-blue-200 transition-all">
                    <span className="flex-1 truncate">{retellWebhookUrl}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-600 hover:text-white rounded-lg transition-all" onClick={() => copyToClipboard(retellWebhookUrl)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium ml-1">Copia esta URL y pégala en el campo "Webhook URL" de tu Agente en Retell AI.</p>
                </div>
              </div>
            </div>

            {/* n8n Webhook Configuration - Updated with Proxy */}
            <div className="bg-white dark:bg-background p-10 rounded-[40px] border border-slate-50 dark:border-border shadow-sm shadow-none relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-none">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">n8n Conversation Proxy</h3>
              </div>
              
              <div className="space-y-6 max-w-lg">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[2px] ml-1">Endpoint de Registro (Proxy)</label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-accent/10 p-4 rounded-2xl border border-slate-100 dark:border-border font-mono text-xs text-slate-600 dark:text-slate-300 group/input hover:border-blue-200 transition-all">
                    <span className="flex-1 truncate">{origin}/api/n8n-proxy</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-600 hover:text-white rounded-lg transition-all" onClick={() => copyToClipboard(`${origin}/api/n8n-proxy`)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium ml-1">Usa este endpoint en tus widgets para que el CRM capture todas las conversaciones automáticamente.</p>
                </div>
              </div>
            </div>

            {/* Endpoints Table Modernized */}
            <div className="bg-white dark:bg-background rounded-[40px] border border-slate-50 dark:border-border shadow-sm shadow-none overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-50 dark:border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-none">
                    <Layers className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">REST Endpoints</h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { method: 'POST', path: `/api/webhook/retell/${effectiveUid}`, desc: 'Webhook dinámico de Retell AI (Recomendado)' },
                  { method: 'POST', path: '/api/webhook/n8n', desc: 'Sincronización de eventos n8n' },
                  { method: 'POST', path: '/api/n8n-proxy', desc: 'Proxy para registro de mensajes' },
                ].map((endpoint) => (
                  <div key={endpoint.path} className="p-6 rounded-3xl border border-transparent hover:border-slate-100 dark:border-border hover:bg-slate-50 dark:hover:bg-accent dark:bg-accent/10 flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-5">
                      <div className="bg-blue-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg tracking-widest shadow-sm shadow-none shadow-none">{endpoint.method}</div>
                      <div>
                        <code className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">{endpoint.path}</code>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{endpoint.desc}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                      Docs <ExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Connected Platforms Side Card */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white dark:bg-background rounded-[40px] p-8 shadow-sm shadow-none border border-slate-100 dark:border-border overflow-hidden relative">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight mb-8">Canales Conectados</h3>
              
              <div className="space-y-4 relative">
                {platforms.map((platform) => (
                  <div key={platform.name} className="flex items-center justify-between p-5 rounded-[28px] bg-slate-50 dark:bg-accent/10 border border-slate-100 dark:border-border hover:bg-blue-50 dark:bg-accent/50 dark:hover:bg-blue-50 dark:bg-accent/500/10/50 hover:border-blue-100 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white dark:bg-background border border-slate-100 dark:border-border flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all shadow-sm shadow-none">
                        <platform.icon className={cn("h-6 w-6 text-slate-400 transition-colors", "group-hover:text-white")} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight">{platform.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", platform.status === 'Activo' ? "bg-emerald-50 dark:bg-emerald-500/100" : "bg-amber-50 dark:bg-amber-500/100")} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{platform.status}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-blue-50 dark:bg-accent/50 dark:hover:bg-blue-50 dark:bg-accent/500/10 text-slate-400 hover:text-blue-600">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-6 rounded-3xl bg-slate-50 dark:bg-accent/10 border border-slate-100 dark:border-border text-center">
                <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 mb-4 text-center">Inyectar Nuevo Agente</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-none">
                  Añadir Plataforma
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
  )
}

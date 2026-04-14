"use client"

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  ExternalLink
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function IntegrationsPage() {
  const apiKey = "df_live_550e8400_e29b_41d4_a716_446655440000"

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "¡Copiado!",
      description: "Texto copiado al portapapeles.",
    })
  }

  const platforms = [
    { name: "Chatbot WhatsApp", icon: Smartphone, status: "Conectado", color: "bg-green-100 text-green-700" },
    { name: "Chatbot Web", icon: Globe, status: "Conectado", color: "bg-green-100 text-green-700" },
    { name: "Agente de Voz", icon: Phone, status: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
    { name: "Chatbot Instagram", icon: MessageSquare, status: "Disponible", color: "bg-gray-100 text-gray-700" },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Integraciones</h1>
          <p className="text-muted-foreground">Conecta tus chatbots de IA y agentes de voz a DentalFlow CRM.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Configuración de API
              </CardTitle>
              <CardDescription>Tus credenciales únicas de API para la ingesta segura de datos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Clave API</label>
                <div className="flex items-center gap-2 bg-secondary/30 p-3 rounded-lg border font-mono text-sm group">
                  <span className="flex-1 truncate">{apiKey}</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(apiKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">ID de Clínica</label>
                <div className="flex items-center gap-2 bg-secondary/30 p-3 rounded-lg border font-mono text-sm">
                  <span className="flex-1">clinica_001</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard('clinica_001')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-primary font-medium leading-relaxed">
                  Usa estas credenciales en tus plataformas de chatbot (ManyChat, Vapi, Retell, etc.) para enviar registros de conversación y datos de citas directamente a tu CRM.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Plataformas Conectadas</CardTitle>
              <CardDescription>Estado de tus canales de comunicación de IA.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {platforms.map((platform) => (
                <div key={platform.name} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                      <platform.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{platform.name}</p>
                      <Badge className={`text-[10px] ${platform.color} border-none`}>{platform.status}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Configurar</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Endpoints de Webhook</CardTitle>
              <CardDescription>Endpoints de API REST disponibles para sistemas de IA.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { method: 'POST', path: '/api/new-message', desc: 'Sincroniza un nuevo mensaje de chat a una conversación.' },
                  { method: 'POST', path: '/api/new-call', desc: 'Sincroniza la transcripción y el resumen de una llamada de voz.' },
                  { method: 'POST', path: '/api/create-appointment', desc: 'Crea una nueva cita en el calendario.' },
                ].map((endpoint) => (
                  <div key={endpoint.path} className="p-4 rounded-xl border bg-white flex items-center justify-between group hover:border-primary transition-colors">
                    <div className="flex items-start gap-4">
                      <Badge className="bg-primary text-white font-mono">{endpoint.method}</Badge>
                      <div>
                        <code className="text-sm font-bold text-primary">{endpoint.path}</code>
                        <p className="text-xs text-muted-foreground mt-1">{endpoint.desc}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Docs
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

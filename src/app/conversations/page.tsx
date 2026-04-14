"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MOCK_CONVERSATIONS, 
  MOCK_MESSAGES, 
  MOCK_VOICE_CALLS 
} from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Phone, 
  Search, 
  Send,
  User,
  Bot,
  Calendar,
  Smartphone,
  Globe,
  Instagram,
  Facebook
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default function ConversationsPage() {
  const [selectedConv, setSelectedConv] = useState(MOCK_CONVERSATIONS[0])
  const [tab, setTab] = useState<'chats' | 'llamadas'>('chats')

  const channelIcons: Record<string, any> = {
    'Chatbot Web': Globe,
    'Chatbot WhatsApp': Smartphone,
    'Chatbot Instagram': Instagram,
    'Chatbot Facebook': Facebook,
    'Agente de Voz': Phone,
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <main className="flex-1 flex overflow-hidden">
        {/* Left List */}
        <div className="w-80 border-r bg-white flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold mb-4">Interacciones</h1>
            <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg mb-4">
              <button 
                onClick={() => setTab('chats')}
                className={cn("flex-1 py-1.5 text-xs font-medium rounded-md transition-all", tab === 'chats' ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
              >
                Chats
              </button>
              <button 
                onClick={() => setTab('llamadas')}
                className={cn("flex-1 py-1.5 text-xs font-medium rounded-md transition-all", tab === 'llamadas' ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
              >
                Llamadas de Voz
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="w-full bg-secondary/20 rounded-md py-2 pl-9 pr-4 text-sm outline-none border focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {tab === 'chats' ? (
              MOCK_CONVERSATIONS.map((conv) => {
                const Icon = channelIcons[conv.channel] || MessageSquare
                return (
                  <div 
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={cn(
                      "p-4 border-b cursor-pointer transition-colors",
                      selectedConv.id === conv.id ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-secondary/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{conv.patient_name}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(conv.updated_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{conv.last_message}</p>
                    <div className="flex items-center gap-1">
                      <Icon className="h-3 w-3 text-primary" />
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{conv.channel}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              MOCK_VOICE_CALLS.map((call) => (
                <div key={call.id} className="p-4 border-b hover:bg-secondary/30 cursor-pointer">
                   <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{call.phone_number}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(call.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{call.summary}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-accent" />
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">AGENTE DE VOZ</span>
                      </div>
                      <Badge variant="outline" className="text-[8px] h-4">{call.duration}</Badge>
                    </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Conversation Thread */}
        <div className="flex-1 flex flex-col bg-secondary/10">
          {tab === 'chats' ? (
            <>
              <div className="h-16 bg-white border-b flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">{selectedConv.patient_name}</h2>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">{selectedConv.channel} • {selectedConv.contact_identifier}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-white">
                    <Calendar className="h-4 w-4 mr-2" />
                    Historial
                  </Button>
                  <Button size="sm" className="bg-accent">Perfil</Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {MOCK_MESSAGES.map((msg) => (
                  <div key={msg.id} className={cn(
                    "flex flex-col max-w-[70%]",
                    msg.sender === 'paciente' ? "mr-auto items-start" : "ml-auto items-end"
                  )}>
                    <div className={cn(
                      "rounded-2xl px-4 py-2 text-sm shadow-sm",
                      msg.sender === 'paciente' 
                        ? "bg-white text-foreground rounded-tl-none border" 
                        : "bg-primary text-primary-foreground rounded-tr-none"
                    )}>
                      {msg.message}
                    </div>
                    <span className="text-[10px] mt-1 text-muted-foreground flex items-center gap-1">
                      {msg.sender === 'IA' && <Bot className="h-3 w-3" />}
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white border-t">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Este es un historial de IA de solo lectura. Intervención directa próximamente..." 
                    disabled
                    className="w-full bg-secondary/20 rounded-lg py-3 pl-4 pr-12 text-sm italic"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <Card className="w-full max-w-2xl border-none shadow-md overflow-hidden">
                <CardHeader className="bg-primary text-primary-foreground">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Transcripción de Llamada
                    </CardTitle>
                    <Badge variant="outline" className="border-white text-white">2023-12-07</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h4 className="text-xs uppercase font-bold text-muted-foreground mb-2">Resumen IA</h4>
                    <p className="text-sm bg-accent/5 p-4 rounded-lg border border-accent/20 italic">
                      "{MOCK_VOICE_CALLS[0].summary}"
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase font-bold text-muted-foreground mb-4">Transcripción</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-4 text-sm leading-relaxed">
                      {MOCK_VOICE_CALLS[0].transcript.split('. ').map((sentence, i) => (
                        <p key={i} className="border-l-2 border-secondary pl-4 py-1">
                          {sentence.includes('Miguel:') ? (
                            <span className="font-bold text-primary">Paciente: </span>
                          ) : (
                            <span className="font-bold text-accent">IA: </span>
                          )}
                          {sentence.replace(/Miguel:|IA:/, '')}.
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      Duración: <span className="font-bold">{MOCK_VOICE_CALLS[0].duration}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Intención Detectada: <Badge variant="secondary" className="ml-2">{MOCK_VOICE_CALLS[0].intent}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

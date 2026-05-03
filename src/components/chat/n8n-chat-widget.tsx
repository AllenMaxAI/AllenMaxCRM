"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Bot, User, RefreshCw, X, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"

interface Message {
  id: string
  sender: 'paciente' | 'IA'
  text: string
  timestamp: Date
}

export function N8nChatWidget({ sessionId: initialSessionId }: { sessionId?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sessionId] = useState(initialSessionId || `session_${Date.now()}`)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Fetch welcome message on mount if no messages yet
  useEffect(() => {
    const fetchWelcome = async () => {
      if (messages.length === 0 && !isLoading) {
        setIsLoading(true)
        try {
          const idToken = await user?.getIdToken()
          const response = await fetch('/api/n8n-proxy', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              message: "hola", // Trigger welcome message
              sessionId: sessionId,
              userProfile: { name: user?.displayName || "Admin CRM", role: "admin" }
            })
          })
          const data = await response.json()
          let botText = typeof data === 'string' ? data : data.output || data.message || data.response || ""
          
          if (botText) {
            setMessages([{
              id: `welcome_${Date.now()}`,
              sender: 'IA',
              text: botText,
              timestamp: new Date()
            }])
          }
        } catch (err) {
          console.error("Error fetching welcome message:", err)
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchWelcome()
  }, [sessionId])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg: Message = {
      id: `m_${Date.now()}`,
      sender: 'paciente',
      text: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      const idToken = await user?.getIdToken()
      const response = await fetch('/api/n8n-proxy', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          message: input,
          sessionId: sessionId,
          userProfile: {
            name: user?.displayName || "Admin CRM",
            role: "admin"
          }
        })
      })

      const data = await response.json()
      
      let botText = ""
      if (typeof data === 'string') botText = data
      else botText = data.output || data.message || data.response || "No response"

      const botMsg: Message = {
        id: `b_${Date.now()}`,
        sender: 'IA',
        text: botText,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMsg])
    } catch (error) {
      console.error("Chat error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-secondary/30 rounded-3xl overflow-hidden border border-slate-100 dark:border-border shadow-inner">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-background border-b border-slate-100 dark:border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-50">Chat en Vivo</h4>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-500">n8n Agent Active</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[8px] font-black border-slate-200 dark:border-border uppercase tracking-widest">
          {sessionId.slice(-6)}
        </Badge>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Bot className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inicia una conversación con el Agente de n8n</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex flex-col max-w-[85%]",
                msg.sender === 'paciente' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "rounded-2xl px-4 py-2.5 text-xs font-medium shadow-sm",
                msg.sender === 'paciente' 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-white dark:bg-background text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-border"
              )}>
                {msg.text}
              </div>
              <span className="text-[8px] mt-1.5 font-black uppercase tracking-widest text-slate-300 opacity-60">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-1 items-center p-2"
            >
              <div className="h-1 w-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-1 w-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-1 w-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 bg-white dark:bg-background border-t border-slate-100 dark:border-border">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-slate-50 dark:bg-accent/10 border border-slate-100 dark:border-border rounded-xl py-2.5 px-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-none"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-md text-[9px] font-bold border",
      variant === 'outline' ? "border-slate-200 text-slate-400" : "bg-blue-600 text-white",
      className
    )}>
      {children}
    </span>
  )
}

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  Mail, 
  CheckCircle2,
  Stethoscope,
  ShieldAlert
} from "lucide-react"

export default function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsSent(true)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060D1A] flex items-center justify-center p-6 font-outfit relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-background rounded-[40px] shadow-2xl shadow-none border border-slate-100 dark:border-border p-10 relative z-10"
      >
        <div className="flex justify-center mb-10">
          <div className="h-14 w-14 bg-white dark:bg-secondary rounded-2xl flex items-center justify-center shadow-xl shadow-none overflow-hidden border border-slate-100 dark:border-border">
            <img src="/logo-allenmax.png" alt="AllenMax Logo" className="h-full w-full object-cover" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isSent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Recuperar Acceso</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                  Introduce tu email y te enviaremos las instrucciones para restablecer tu contraseña.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Registrado</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                      type="email" 
                      required 
                      placeholder="doctor@clinica.com" 
                      className="h-14 rounded-2xl bg-slate-50 dark:bg-accent/10 border-slate-200 dark:border-border pl-11 pr-4 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-14 rounded-[20px] bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-none transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white dark:border-border/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Enviar Instrucciones"
                  )}
                </Button>
              </form>

              <div className="pt-2 text-center">
                <Link href="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Volver al Inicio
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-4"
            >
              <div className="flex justify-center">
                <div className="h-20 w-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">¡Email Enviado!</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                  Hemos enviado un enlace de recuperación a tu bandeja de entrada. Por favor, revisa también tu carpeta de spam.
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10 flex items-start gap-3 text-left">
                <ShieldAlert className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 leading-relaxed uppercase tracking-tight">
                  El enlace caducará en 60 minutos por motivos de seguridad.
                </p>
              </div>

              <Button 
                variant="outline"
                className="w-full h-14 rounded-[20px] border-slate-100 dark:border-border font-black text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                onClick={() => setIsSent(false)}
              >
                Reintentar
              </Button>

              <Link href="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Volver al Inicio
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

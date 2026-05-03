"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ArrowRight, 
  Mail, 
  Lock, 
  Chrome, 
  Github, 
  ShieldCheck,
  Loader2,
  Shield,
  FileText,
  X
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "¡Bienvenido de nuevo!",
        description: "Accediendo a tu panel de control...",
      })
      router.push('/')
    } catch (error: any) {
      console.error(error)
      let message = "Email o contraseña incorrectos."
      if (error.code === 'auth/user-not-found') message = "Usuario no encontrado."
      toast({
        variant: "destructive",
        title: "Error de acceso",
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (providerName: 'google' | 'github') => {
    setIsLoading(true)
    try {
      const provider = providerName === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider()
      await signInWithPopup(auth, provider)
      router.push('/')
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: `Error con ${providerName}`,
        description: "No se pudo iniciar sesión con este proveedor.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#060D1A] overflow-hidden font-outfit">
      {/* Left Section: Visual & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/premium_dental_login_bg_1777056128843.png" 
            alt="Dental Clinic" 
            className="h-full w-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full h-full flex flex-col justify-between p-16">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white dark:bg-secondary rounded-2xl flex items-center justify-center shadow-2xl shadow-none overflow-hidden border border-white dark:border-border/10">
              <img src="/logo-allenmax.png" alt="AllenMax Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase">AllenMax <span className="text-blue-500">Elite</span></span>
          </div>

          <div className="max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-5xl font-black text-white leading-tight mb-6">
                La gestión dental <br /> 
                <span className="text-blue-500">del futuro</span>, hoy.
              </h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Optimiza cada aspecto de tu clínica con nuestra suite inteligente de CRM, automatización de citas y agentes de voz con IA.
              </p>
            </motion.div>
            
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                +2,500 Clínicas confían en nosotros
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-widest">
            <span>© 2026 ALLENMAX CRM</span>
            <div className="flex gap-6">
              <button onClick={() => setShowPrivacy(true)} className="hover:text-white transition-colors">Privacidad</button>
              <button onClick={() => setShowTerms(true)} className="hover:text-white transition-colors">Términos</button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md space-y-10"
        >
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Bienvenido</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Introduce tus credenciales para acceder al panel de control.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Corporativo</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input 
                    type="email" 
                    required 
                    placeholder="doctor@clinica.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 rounded-2xl bg-slate-50 dark:bg-background border-slate-200 dark:border-border pl-11 pr-4 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contraseña</Label>
                  <Link href="/forgot-password" title="Recuperar contraseña" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 tracking-widest">¿La has olvidado?</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input 
                    type="password" 
                    required 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 rounded-2xl bg-slate-50 dark:bg-background border-slate-200 dark:border-border pl-11 pr-4 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="rounded-md border-slate-200 dark:border-border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                <label htmlFor="remember" className="text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer select-none">Recordar sesión</label>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 rounded-[20px] bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-none transition-all active:scale-[0.98] group"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Entrar al Dashboard <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-xs font-bold text-slate-500">
            ¿Necesitas acceso a AllenMax? {" "}
            <a href="mailto:agency@allenmax.com" className="text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest ml-1">Contacta con Soporte</a>
          </p>

          <div className="pt-4 flex items-center justify-center gap-2 opacity-50">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Conexión Segura SSL 256-bit</span>
          </div>
        </motion.div>
      </div>

      {/* Privacy Dialog */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-[32px] border-slate-100 dark:border-slate-800 p-8 sm:p-10 font-outfit">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <Shield className="h-6 w-6" />
              <span className="text-xs font-black uppercase tracking-widest">Seguridad AllenMax</span>
            </div>
            <DialogTitle className="text-3xl font-black text-slate-900 dark:text-slate-50">Política de Privacidad</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium pt-2">
              Última actualización: 3 de Mayo, 2026
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <section>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 mb-2 uppercase tracking-widest">1. Protección de Datos</h3>
              <p>En AllenMax CRM, la privacidad es nuestra prioridad. Implementamos cifrado de grado bancario para proteger toda la información clínica y personal.</p>
            </section>
            <section>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 mb-2 uppercase tracking-widest">2. Uso de Información</h3>
              <p>Tus datos se utilizan exclusivamente para proveer el servicio de CRM, automatizar citas y mejorar la precisión de nuestros agentes de voz con IA.</p>
            </section>
            <section>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 mb-2 uppercase tracking-widest">3. Derechos del Usuario</h3>
              <p>Como propietario de la cuenta, tienes derecho total a acceder, rectificar o eliminar tu información y la de tus pacientes en cualquier momento.</p>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-[32px] border-slate-100 dark:border-slate-800 p-8 sm:p-10 font-outfit">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <FileText className="h-6 w-6" />
              <span className="text-xs font-black uppercase tracking-widest">Legal AllenMax</span>
            </div>
            <DialogTitle className="text-3xl font-black text-slate-900 dark:text-slate-50">Términos de Servicio</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium pt-2">
              Aceptación del contrato de uso de software
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <section>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 mb-2 uppercase tracking-widest">1. Licencia de Software</h3>
              <p>AllenMax otorga una licencia de uso limitada para la gestión de clínicas dentales según el plan suscrito.</p>
            </section>
            <section>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 mb-2 uppercase tracking-widest">2. Responsabilidad</h3>
              <p>La clínica es responsable de la legalidad de los datos introducidos. AllenMax garantiza la disponibilidad del 99.9% del servicio.</p>
            </section>
            <section>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 mb-2 uppercase tracking-widest">3. Propiedad Intelectual</h3>
              <p>Todo el software y algoritmos de IA son propiedad de AllenMax y protegidos por leyes de propiedad intelectual internacionales.</p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

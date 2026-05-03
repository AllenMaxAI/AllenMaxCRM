"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Lock, 
  Mail,
  ShieldCheck,
  ArrowLeft,
  Crown
} from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen bg-white dark:bg-[#060D1A] overflow-hidden font-outfit">
      {/* Visual Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/premium_dental_register_bg_1777056163732.png" 
            alt="Dental Technology" 
            className="h-full w-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full h-full flex flex-col justify-between p-16">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white dark:bg-secondary rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden">
              <img src="/logo-allenmax.png" alt="AllenMax Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase">AllenMax <span className="text-blue-500">Elite</span></span>
          </div>

          <div className="max-w-md">
            <h2 className="text-5xl font-black text-white leading-tight mb-6">
              El acceso a la excelencia es <span className="text-blue-500">exclusivo</span>.
            </h2>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              AllenMax CRM gestiona las clínicas dentales más prestigiosas. Solo clientes verificados pueden acceder a nuestra infraestructura.
            </p>
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
            <span>Certificado por Global Health Standards</span>
          </div>
        </div>
      </div>

      {/* Message Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center space-y-10"
        >
          <div className="flex justify-center">
            <div className="h-24 w-24 bg-blue-50 dark:bg-blue-500/10 rounded-[32px] flex items-center justify-center text-blue-500 ring-8 ring-blue-50 dark:ring-blue-500/5">
              <Lock className="h-10 w-10" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20">
              <Crown className="h-3.5 w-3.5" /> Acceso Restringido
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Registro Cerrado</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Actualmente, las nuevas cuentas solo pueden ser creadas por el equipo de administración de AllenMax.
            </p>
          </div>

          <div className="p-8 rounded-[40px] bg-slate-50 dark:bg-accent/5 border border-slate-100 dark:border-border/50 space-y-6">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              ¿Deseas implementar AllenMax en tu clínica?
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                asChild
                className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20"
              >
                <a href="mailto:agency@allenmax.com">
                  <Mail className="h-4 w-4 mr-2" /> Solicitar Acceso
                </a>
              </Button>
              <Button 
                asChild
                variant="ghost"
                className="h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Login
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
              <ShieldCheck className="h-4 w-4" /> Encriptación AES-256
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

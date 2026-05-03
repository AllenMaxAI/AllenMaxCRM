"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060D1A] font-outfit py-12 px-6 sm:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex items-center justify-between"
        >
          <Link href="/login">
            <Button variant="ghost" className="gap-2 font-bold text-slate-500 hover:text-blue-600 rounded-xl">
              <ArrowLeft className="h-4 w-4" /> Volver al Login
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-blue-600 font-black tracking-tighter uppercase">
            <FileText className="h-5 w-5" />
            <span>AllenMax Terms</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-[32px] p-8 sm:p-12 shadow-xl border border-slate-100 dark:border-slate-800"
        >
          <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 mb-8 tracking-tight">Términos de Servicio</h1>
          
          <div className="space-y-8 text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-4 uppercase tracking-widest text-sm">1. Aceptación del Servicio</h2>
              <p>
                Al acceder y utilizar AllenMax CRM, usted acepta estar sujeto a estos términos y condiciones. Nuestra plataforma está diseñada específicamente para profesionales del sector dental y clínico.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-4 uppercase tracking-widest text-sm">2. Licencia de Uso</h2>
              <p>
                AllenMax otorga una licencia limitada, no exclusiva e intransferible para utilizar el software de gestión según el plan de suscripción contratado. Queda prohibida la ingeniería inversa o reventa del servicio sin autorización expresa.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-4 uppercase tracking-widest text-sm">3. Responsabilidad de los Datos</h2>
              <p>
                La clínica es la única responsable de la veracidad y legalidad de los datos de pacientes introducidos en el sistema. AllenMax actúa como encargado del tratamiento de datos, proporcionando las herramientas de seguridad necesarias para cumplir con la normativa vigente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-4 uppercase tracking-widest text-sm">4. Disponibilidad y Soporte</h2>
              <p>
                Nos esforzamos por mantener un tiempo de actividad del 99.9%. El soporte técnico está disponible para todas las clínicas activas a través de los canales oficiales proporcionados en el panel de control.
              </p>
            </section>

            <section className="pt-8 border-t border-slate-100 dark:border-slate-800">
              <p className="text-sm italic">Última actualización: 3 de Mayo, 2026</p>
              <p className="text-sm font-black text-slate-900 dark:text-slate-50 mt-2">© 2026 ALLENMAX CRM - Todos los derechos reservados.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

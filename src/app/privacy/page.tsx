"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
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
            <Shield className="h-5 w-5" />
            <span>AllenMax Privacy</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-[32px] p-8 sm:p-12 shadow-xl border border-slate-100 dark:border-slate-800"
        >
          <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 mb-8 tracking-tight">Política de Privacidad</h1>
          
          <div className="space-y-8 text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-4 uppercase tracking-widest text-sm">1. Introducción</h2>
              <p>
                En AllenMax CRM, la privacidad de nuestros usuarios es nuestra prioridad. Esta política detalla cómo recopilamos, usamos y protegemos su información personal dentro de nuestra plataforma de gestión dental.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-4 uppercase tracking-widest text-sm">2. Recopilación de Datos</h2>
              <p>
                Recopilamos información necesaria para la gestión de su clínica, incluyendo:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Datos de contacto corporativos (email, teléfono).</li>
                <li>Información de pacientes gestionada por la clínica.</li>
                <li>Logs de actividad del sistema para seguridad y auditoría.</li>
                <li>Grabaciones de voz y transcripciones gestionadas por nuestros agentes de IA.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-4 uppercase tracking-widest text-sm">3. Uso de la Información</h2>
              <p>
                Su información se utiliza exclusivamente para:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Proveer y mejorar los servicios del CRM.</li>
                <li>Automatizar la comunicación con sus pacientes.</li>
                <li>Garantizar la seguridad de su cuenta y prevenir fraudes.</li>
                <li>Cumplir con obligaciones legales y sanitarias (GDPR).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-4 uppercase tracking-widest text-sm">4. Seguridad SSL 256-bit</h2>
              <p>
                Implementamos estándares de seguridad de grado bancario. Toda la comunicación está cifrada mediante certificados SSL de 256 bits y los datos se almacenan en servidores seguros con redundancia geográfica.
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

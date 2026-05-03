"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  Users, 
  Settings, 
  Share2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Trash2
} from "lucide-react"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { useData } from "@/context/data-context"
import { ShieldCheck, X } from "lucide-react"

const navItems = [
  { name: 'Tablero', href: '/', icon: LayoutDashboard },
  { name: 'Calendario', href: '/calendar', icon: Calendar },
  { name: 'Conversaciones', href: '/conversations', icon: MessageSquare },
  { name: 'Pacientes', href: '/patients', icon: Users },
  { name: 'Integraciones', href: '/integrations', icon: Share2 },
  { name: 'Configuración', href: '/settings', icon: Settings },
  { name: 'Papelera', href: '/trash', icon: Trash2 },
]

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const { adminViewUid, switchClinic, settings } = useData()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Clean transition for the sidebar width ONLY
  const transition = { type: "spring", stiffness: 220, damping: 28 }

  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return "AM"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={transition}
      className="flex h-screen flex-col border-r border-slate-100 dark:border-border/50 sticky top-0 z-40 shrink-0 overflow-hidden dark:bg-background"
    >
      {/* Logo Section - Static 80px Icon Slot */}
      <div className="flex h-20 items-center shrink-0">
        <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center overflow-hidden p-4">
          <img src="/logo-allenmax.png" alt="AllenMax Logo" className="h-full w-full object-cover rounded-xl" />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span 
              key="logo-text"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight whitespace-nowrap"
            >
              AllenMax
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      
      {/* Navigation - Static 80px Icon Slots */}
      <nav className="flex-1 space-y-2 py-4 overflow-y-auto no-scrollbar overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href} className="block px-3">
              <div
                className={cn(
                  "group relative flex items-center h-[52px] rounded-2xl transition-all duration-300",
                  isActive 
                    ? "bg-blue-50 dark:bg-accent/50 text-blue-600" 
                    : "text-slate-400 hover:bg-slate-50 dark:hover:bg-accent dark:bg-accent/10 hover:text-slate-900 dark:text-slate-50",
                )}
              >
                {/* 56px wrapper (w-14) centered at 28px. 12px (px-3) + 28px = 40px (Sidebar Center) */}
                <div className="w-14 flex-shrink-0 flex items-center justify-center">
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors duration-300",
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"
                  )} />
                </div>
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span 
                      key={`nav-text-${item.name}`}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-bold truncate whitespace-nowrap ml-1"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isCollapsed && (
                  <div className="absolute left-16 invisible group-hover:visible bg-blue-600 text-white text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap z-[100] opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl shadow-none">
                    {item.name}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Toggle Button - Static Axis */}
      <div className="h-16 flex items-center shrink-0">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="group flex items-center w-full h-[52px] px-3 outline-none"
        >
          <div className="w-14 flex-shrink-0 flex items-center justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-50 dark:bg-accent/10 group-hover:bg-blue-600 group-hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all duration-300 shadow-sm shadow-none">
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </div>
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                key="collapse-text"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ duration: 0.2 }}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 whitespace-nowrap ml-1"
              >
                Colapsar
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Logout Button */}
      <div className="h-16 flex items-center shrink-0">
        <button
          onClick={handleLogout}
          className="group flex items-center w-full h-[52px] px-3 outline-none"
        >
          <div className="w-14 flex-shrink-0 flex items-center justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-50 dark:bg-accent/10 group-hover:bg-red-500 group-hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all duration-300">
              <LogOut className="h-4 w-4" />
            </div>
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                key="logout-text"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ duration: 0.2 }}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-500 whitespace-nowrap ml-1"
              >
                Cerrar Sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Profile Section - Static Axis */}
      <div className="shrink-0 h-24 flex items-center relative group/profile">
        <div className="w-20 flex-shrink-0 flex items-center justify-center">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg shadow-none border-2 transition-all",
            adminViewUid 
              ? "bg-emerald-600 border-emerald-400 ring-4 ring-emerald-500/10 animate-pulse" 
              : "bg-blue-600 border-white dark:border-border"
          )}>
            {adminViewUid ? "AD" : getInitials(user?.displayName || user?.email || "Admin")}
          </div>
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              key="profile-data"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col truncate flex-1 pr-4"
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-black truncate whitespace-nowrap",
                  adminViewUid ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-50"
                )}>
                  {adminViewUid 
                    ? (settings.clinicProfile?.name || "Clínica Externa") 
                    : (settings.clinicProfile?.name || user?.displayName || user?.email?.split('@')[0] || "Administrador")}
                </span>
                {adminViewUid && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      switchClinic(null);
                    }}
                    className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100 transition-all"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
              <span className={cn(
                "text-[9px] font-black truncate uppercase tracking-widest whitespace-nowrap",
                adminViewUid ? "text-emerald-500" : "text-slate-400"
              )}>
                {adminViewUid ? "MODO SUPERVISIÓN" : "Elite Account"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Tooltip for collapsed mode or additional info */}
        {adminViewUid && isCollapsed && (
           <div className="absolute left-2 top-2 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-background z-50 shadow-sm" />
        )}
      </div>
    </motion.div>
  )
}

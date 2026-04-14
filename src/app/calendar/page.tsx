"use client"

import { useState, useEffect } from "react"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Search,
  MoreVertical,
  Filter
} from "lucide-react"
import { MOCK_APPOINTMENTS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<'día' | 'semana' | 'mes'>('semana')
  // Inicializamos con una fecha estática para evitar el error de hidratación
  const [currentDate, setCurrentDate] = useState(new Date('2024-05-20'))
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setMounted(true)
    // Una vez montado, podemos usar la fecha actual real si quisiéramos
    // setCurrentDate(new Date()) 
  }, [])

  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    return day
  })

  const handleAction = (action: string) => {
    toast({
      title: "Acción activada",
      description: `Has pulsado en: ${action}. Funcionalidad en desarrollo.`,
    })
  }

  const filteredAppointments = MOCK_APPOINTMENTS.filter(app => 
    app.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b bg-white px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Calendario
            </h1>
            <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-md ml-4">
              {(['día', 'semana', 'mes'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded transition-all capitalize",
                    view === v ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-md px-2 py-1 bg-secondary/20">
              <Search className="h-4 w-4 text-muted-foreground mr-2" />
              <input 
                type="text" 
                placeholder="Buscar citas..." 
                className="bg-transparent text-sm outline-none w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="sm" variant="outline" onClick={() => handleAction("Filtrar")}>
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-accent hover:bg-accent/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Cita
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Programar Nueva Cita</DialogTitle>
                  <DialogDescription>
                    Introduce los detalles para la nueva cita dental.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Paciente</Label>
                    <Input id="name" placeholder="Nombre completo" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Tratamiento</Label>
                    <Input id="type" placeholder="Ej: Limpieza" className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={() => handleAction("Guardar Cita")}>Guardar Cita</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Toolbar */}
        <div className="h-14 bg-white border-b px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => {
                const newDate = new Date(currentDate)
                newDate.setDate(currentDate.getDate() - (view === 'semana' ? 7 : 1))
                setCurrentDate(newDate)
              }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => {
                const newDate = new Date(currentDate)
                newDate.setDate(currentDate.getDate() + (view === 'semana' ? 7 : 1))
                setCurrentDate(newDate)
              }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="font-semibold text-lg">
              {mounted ? currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : "..."}
            </h2>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date('2024-05-20'))}>Hoy</Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent"></span> Confirmada</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary"></span> Programada</span>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="flex-1 overflow-auto p-8">
          <Card className="border-none shadow-sm overflow-hidden min-w-[800px]">
            <CardContent className="p-0">
              {/* Grid Header */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b bg-secondary/10">
                <div className="border-r h-12 flex items-center justify-center text-[10px] uppercase tracking-widest text-muted-foreground font-bold">GMT-5</div>
                {weekDays.map((day, i) => (
                  <div key={i} className={cn(
                    "h-12 flex flex-col items-center justify-center border-r last:border-r-0",
                    mounted && day.toDateString() === new Date('2024-05-20').toDateString() ? "bg-primary/5 text-primary" : ""
                  )}>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{days[i]}</span>
                    <span className="text-lg font-bold">{day.getDate()}</span>
                  </div>
                ))}
              </div>

              {/* Grid Body */}
              <div className="relative">
                {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                  <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b h-20 group">
                    <div className="border-r flex items-start justify-center pt-2 text-xs text-muted-foreground font-medium">
                      {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                    </div>
                    {Array.from({ length: 7 }, (_, dayIndex) => (
                      <div key={dayIndex} className="border-r last:border-r-0 relative group-hover:bg-secondary/5">
                        {mounted && filteredAppointments.map((app) => {
                          const appDate = new Date(app.start_time)
                          const appHour = appDate.getHours()
                          const isSameDay = appDate.toDateString() === weekDays[dayIndex].toDateString()
                          
                          if (isSameDay && appHour === hour) {
                            return (
                              <div key={app.id} className={cn(
                                "absolute inset-1 rounded p-2 text-[10px] border-l-4 shadow-sm z-10",
                                app.status === 'confirmada' ? "bg-accent/10 border-accent text-accent-foreground" : "bg-primary/10 border-primary text-primary-foreground"
                              )}>
                                <div className="font-bold flex justify-between items-start">
                                  <span className="truncate">{app.patient_name}</span>
                                  <MoreVertical className="h-3 w-3 opacity-50 cursor-pointer" onClick={() => handleAction("Opciones de cita")} />
                                </div>
                                <div className="truncate opacity-80">{app.title}</div>
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    ))}
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
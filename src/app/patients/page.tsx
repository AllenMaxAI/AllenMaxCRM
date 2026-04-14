"use client"

import { useState, useEffect } from "react"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { MOCK_PATIENTS } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Plus, User, MoreHorizontal, Mail, Phone, Calendar } from "lucide-react"

export default function PatientsPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
            <p className="text-muted-foreground">Gestiona la base de datos e historial de pacientes de tu clínica.</p>
          </div>
          <Button className="bg-accent hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" />
            Añadir Paciente
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar pacientes por nombre, email, teléfono..." 
              className="w-full bg-white border rounded-md py-2 pl-10 pr-4 outline-none focus:border-primary transition-all shadow-sm"
            />
          </div>
          <Button variant="outline" className="bg-white">Filtrar</Button>
          <Button variant="outline" className="bg-white">Exportar</Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow>
                <TableHead className="w-[300px]">Paciente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Etiquetas</TableHead>
                <TableHead>Ingreso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_PATIENTS.map((patient) => (
                <TableRow key={patient.id} className="cursor-pointer hover:bg-secondary/10 group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold transition-transform group-hover:scale-110">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{patient.name}</p>
                        <p className="text-[10px] text-muted-foreground">ID: {patient.id.toUpperCase()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {patient.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-white font-medium">
                      {patient.first_contact_channel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {patient.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[9px] h-4 bg-primary/10 text-primary border-none">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {mounted ? new Date(patient.created_at).toLocaleDateString() : "---"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Calendar className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><MoreHorizontal className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  )
}
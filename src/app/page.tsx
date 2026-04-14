"use client"

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Clock,
  ArrowRight
} from "lucide-react"
import { MOCK_APPOINTMENTS, MOCK_CONVERSATIONS, MOCK_PATIENTS } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const todayAppointments = MOCK_APPOINTMENTS.filter(a => {
    const today = new Date().toDateString()
    return new Date(a.start_time).toDateString() === today
  })

  const stats = [
    { label: "Total Patients", value: MOCK_PATIENTS.length.toString(), icon: Users, color: "text-blue-600" },
    { label: "Today's Appointments", value: todayAppointments.length.toString(), icon: Calendar, color: "text-green-600" },
    { label: "Messages Today", value: "12", icon: MessageSquare, color: "text-purple-600" },
    { label: "Growth", value: "+12%", icon: TrendingUp, color: "text-teal-600" },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, Dr. Doe. Here's what's happening today.</p>
          </div>
          <Button className="bg-accent hover:bg-accent/90">
            <Calendar className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Today's Appointments</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.length > 0 ? todayAppointments.map((app) => (
                  <div key={app.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/20">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-md bg-secondary text-primary font-bold">
                        <span className="text-xs uppercase">{new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).split(':')[0]}</span>
                        <span className="text-[10px]">{new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).split(':')[1]}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{app.patient_name}</p>
                        <p className="text-xs text-muted-foreground">{app.title}</p>
                      </div>
                    </div>
                    <Badge variant={app.status === 'confirmed' ? 'default' : 'secondary'} className={app.status === 'confirmed' ? 'bg-accent' : ''}>
                      {app.status}
                    </Badge>
                  </div>
                )) : (
                  <p className="text-center py-8 text-muted-foreground italic">No appointments for today.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent AI Conversations</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary">
                History <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_CONVERSATIONS.map((conv) => (
                  <div key={conv.id} className="group relative flex flex-col gap-1 rounded-lg border p-4 transition-colors hover:bg-secondary/20">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-primary">{conv.patient_name}</p>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{conv.last_message}</p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                        {conv.channel}
                      </Badge>
                    </div>
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

"use client"

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Code, 
  Copy, 
  Smartphone, 
  Globe, 
  Phone, 
  MessageSquare, 
  CheckCircle2,
  ExternalLink
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function IntegrationsPage() {
  const apiKey = "df_live_550e8400_e29b_41d4_a716_446655440000"

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    })
  }

  const platforms = [
    { name: "WhatsApp Chatbot", icon: Smartphone, status: "Connected", color: "bg-green-100 text-green-700" },
    { name: "Website Chatbot", icon: Globe, status: "Connected", color: "bg-green-100 text-green-700" },
    { name: "Voice Agent", icon: Phone, status: "Pending", color: "bg-yellow-100 text-yellow-700" },
    { name: "Instagram Chatbot", icon: MessageSquare, status: "Available", color: "bg-gray-100 text-gray-700" },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Integrations</h1>
          <p className="text-muted-foreground">Connect your AI chatbots and voice agents to DentalFlow CRM.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                API Configuration
              </CardTitle>
              <CardDescription>Your unique API credentials for secure data ingestion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">API Key</label>
                <div className="flex items-center gap-2 bg-secondary/30 p-3 rounded-lg border font-mono text-sm group">
                  <span className="flex-1 truncate">{apiKey}</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(apiKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Clinic ID</label>
                <div className="flex items-center gap-2 bg-secondary/30 p-3 rounded-lg border font-mono text-sm">
                  <span className="flex-1">clinic_001</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard('clinic_001')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-primary font-medium leading-relaxed">
                  Use these credentials in your chatbot platforms (ManyChat, Vapi, Retell, etc.) to push conversation logs and appointment data directly into your CRM.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Connected Platforms</CardTitle>
              <CardDescription>Status of your AI communication channels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {platforms.map((platform) => (
                <div key={platform.name} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                      <platform.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{platform.name}</p>
                      <Badge className={`text-[10px] ${platform.color} border-none`}>{platform.status}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Configure</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Webhook Endpoints</CardTitle>
              <CardDescription>Available REST API endpoints for AI systems.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { method: 'POST', path: '/api/new-message', desc: 'Syncs a new chat message to a conversation.' },
                  { method: 'POST', path: '/api/new-call', desc: 'Syncs a voice call transcript and summary.' },
                  { method: 'POST', path: '/api/create-appointment', desc: 'Creates a new appointment in the calendar.' },
                ].map((endpoint) => (
                  <div key={endpoint.path} className="p-4 rounded-xl border bg-white flex items-center justify-between group hover:border-primary transition-colors">
                    <div className="flex items-start gap-4">
                      <Badge className="bg-primary text-white font-mono">{endpoint.method}</Badge>
                      <div>
                        <code className="text-sm font-bold text-primary">{endpoint.path}</code>
                        <p className="text-xs text-muted-foreground mt-1">{endpoint.desc}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Docs
                    </Button>
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

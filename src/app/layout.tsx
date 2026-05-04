"use client"

import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider, useAuth } from "@/context/auth-context"
import { DataProvider } from "@/context/data-context"
import { Toaster } from "@/components/ui/toaster"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"
import { LayoutWrapper } from "@/components/layout/layout-wrapper"

const inter = Inter({ subsets: ["latin"] })

function RouteGuardian({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && mounted) {
      const authRoutes = ['/login', '/register', '/forgot-password', '/privacy', '/terms']
      const isAuthRoute = authRoutes.includes(pathname || '')
      
      if (!user && !isAuthRoute) {
        router.push('/login')
      } else if (user && isAuthRoute) {
        router.push('/')
      }
    }
  }, [user, loading, pathname, router, mounted])

  const authRoutes = ['/login', '/register', '/forgot-password', '/privacy', '/terms']
  const isAuthRoute = authRoutes.includes(pathname || '')

  const shouldShowLoader = !mounted || loading || (!user && !isAuthRoute) || (user && isAuthRoute);

  if (shouldShowLoader) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a] gap-4">
        <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            AllenMax<span className="text-blue-500">CRM</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/40 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          Verificando acceso seguro...
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        {/* UHJvcGllZGFkIGludGVsZWN0dWFsOiBKYXZpZXIgUGVkcmF6YSBUYWJvYWRh */}
        <meta name="x-build-author" content="UHJvcGllZGFkIGludGVsZWN0dWFsOiBKYXZpZXIgUGVkcmF6YSBUYWJvYWRh" />
      </head>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          themes={['light', 'dark', 'elite-dark', 'system']}
        >
          <AuthProvider>
            <RouteGuardian>
              <DataProvider>
                <LayoutWrapper>{children}</LayoutWrapper>
                <Toaster />
              </DataProvider>
            </RouteGuardian>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

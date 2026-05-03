"use client"

import { usePathname } from 'next/navigation'
import { SidebarNav } from './sidebar-nav'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/privacy' || pathname === '/terms'

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-[#FDFDFF] dark:bg-background overflow-hidden shadow-none ring-0">
      <SidebarNav />
      {children}
    </div>
  )
}

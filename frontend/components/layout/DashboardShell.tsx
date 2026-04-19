'use client'

import { ThemeProvider } from './ThemeContext'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import type { User } from '@/types'

function Shell({ user, children }: { user: User | null; children: React.ReactNode }) {
  const { isOpen, close } = useSidebar()

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-400/14 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-violet-500/12 blur-3xl" />
        <div className="absolute bottom-[-9rem] left-1/3 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.34)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.34)_1px,transparent_1px)] bg-[size:42px_42px] opacity-[0.18] dark:opacity-[0.06]" />
      </div>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}

      <Sidebar role={user?.role ?? 'student'} />

      <div className="relative z-10 flex flex-1 min-w-0 flex-col overflow-hidden">
        <Navbar user={user} />
        <main className="flex-1 overflow-y-auto p-4 animate-fade-up md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function DashboardShell({
  user,
  children,
}: {
  user: User | null
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <Shell user={user}>{children}</Shell>
      </SidebarProvider>
    </ThemeProvider>
  )
}

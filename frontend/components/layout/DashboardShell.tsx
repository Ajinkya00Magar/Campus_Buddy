'use client'

import { ThemeProvider } from './ThemeContext'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { usePathname } from 'next/navigation'
import { useChannels } from '@/hooks/useChannels'
import { cn } from '../../../backend/lib/utils'
import type { User, Channel } from '@/types'

function Shell({ user, channels: initialChannels, children }: { user: User | null; channels: Channel[]; children: React.ReactNode }) {
  const { isOpen, close } = useSidebar()
  const pathname = usePathname()
  const isChannelPage = pathname.startsWith('/channels/')
  const isEmbeddedResourcePage = pathname === '/notes' || pathname === '/pyqs'
  const isFullBleedPage = isChannelPage || isEmbeddedResourcePage
  
  // Realtime channels for the sidebar
  const channels = useChannels(initialChannels, user)

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/45 md:hidden"
          onClick={close}
        />
      )}

      <Sidebar role={user?.role ?? 'student'} channels={channels} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar user={user} />
        <main className={cn(
          "flex-1 overflow-hidden",
          isFullBleedPage ? "p-0" : "overflow-y-auto p-3 md:p-4"
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default function DashboardShell({
  user,
  channels = [],
  children,
}: {
  user: User | null
  channels?: Channel[]
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <Shell user={user} channels={channels}>{children}</Shell>
      </SidebarProvider>
    </ThemeProvider>
  )
}

'use client'
import { ThemeProvider } from './ThemeContext'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { useProfileSync } from '@/hooks/useProfileSync'

import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { usePathname } from 'next/navigation'
import { cn } from '../../../backend/lib/utils'
import MotionProvider from '@/components/motion/MotionProvider'
import PageTransition from '@/components/motion/PageTransition'
import AiAssistant from '@/components/ai/AiAssistant'
import type { User, Channel } from '@/types'

const AI_ENABLED = process.env.NEXT_PUBLIC_AI_ENABLED === 'true'

function Shell({ user, channels: initialChannels, children }: { user: User | null; channels: Channel[]; children: React.ReactNode }) {
  const { isOpen, close } = useSidebar()
  const pathname = usePathname()
  // Live-sync this user's profile (role/year/dept) when an admin edits it.
  useProfileSync(user?.id)
  const isChannelPage = pathname.startsWith('/channels/')
  const isEmbeddedResourcePage = pathname === '/notes' || pathname === '/pyqs'
  const isCourseDetailPage = pathname.startsWith('/courses/')
  const isFullBleedPage = isChannelPage || isEmbeddedResourcePage || isCourseDetailPage
  
  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-background">
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/45 md:hidden"
          onClick={close}
        />
      )}


      <Sidebar role={user?.role ?? 'student'} channels={initialChannels} userId={user?.id} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar user={user} />
        <main className={cn(
          "flex-1 overflow-hidden",
          isFullBleedPage ? "p-0" : "overflow-y-auto p-3 md:p-4"
        )}>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {AI_ENABLED && <AiAssistant />}
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
      <MotionProvider>
        <SidebarProvider>
          <Shell user={user} channels={channels}>{children}</Shell>
        </SidebarProvider>
      </MotionProvider>
    </ThemeProvider>
  )
}

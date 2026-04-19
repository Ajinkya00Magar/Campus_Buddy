'use client'

import { SidebarProvider } from '@/contexts/SidebarContext'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import type { UserRole } from '@/types'
import type { User } from '@/types'

export default function DashboardLayoutClient({
  children,
  role,
  user,
}: {
  children: React.ReactNode
  role: UserRole
  user: User | null
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar role={role} />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Navbar user={user} />
          <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

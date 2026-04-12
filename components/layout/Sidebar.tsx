'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Calendar, Users2, BookOpen,
  MessageSquare, Bell, Settings, GraduationCap, Shield, Hash
} from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import type { UserRole } from '@/types'

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/events',        label: 'Events',       icon: Calendar },
  { href: '/clubs',         label: 'Clubs',        icon: Users2 },
  { href: '/courses',       label: 'Courses',      icon: BookOpen },
  { href: '/channels',      label: 'Channels',     icon: Hash },
  { href: '/notifications', label: 'Notifications', icon: Bell },
]

const adminItems = [
  { href: '/admin', label: 'Admin Panel', icon: Shield },
]

export default function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const { isOpen } = useSidebar()
  const items = role === 'admin' ? [...navItems, ...adminItems] : navItems

  return (
    <aside className={cn('bg-[#1E3A8A] flex flex-col h-full shadow-xl shrink-0 transition-all duration-300 ease-in-out overflow-hidden', isOpen ? 'w-64' : 'w-0')}>
      {/* Brand */}
      <div className={cn('flex items-center gap-3 px-5 py-5 border-b border-white/10', !isOpen && 'justify-center')}>
        <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        {isOpen && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">Campus Buddy</p>
            <p className="text-blue-300 text-xs">MITAOE</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href.length > 1 && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              title={!isOpen ? label : ''}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                !isOpen && 'justify-center px-0',
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-blue-200 hover:bg-white/8 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {isOpen && label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className={cn('px-3 py-3 border-t border-white/10', !isOpen && 'flex justify-center px-0')}>
        <Link href="/settings"
          title={!isOpen ? 'Settings' : ''}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white text-sm font-medium transition-all',
            !isOpen && 'justify-center px-0'
          )}
        >
          <Settings className="h-4 w-4" />
          {isOpen && 'Settings'}
        </Link>
      </div>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/contexts/SidebarContext'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Calendar, Users2, BookOpen,
  Hash, Bell, Settings, GraduationCap, Shield, ChevronLeft,
} from 'lucide-react'
import type { UserRole } from '@/types'

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/events',        label: 'Events',        icon: Calendar },
  { href: '/clubs',         label: 'Clubs',         icon: Users2 },
  { href: '/courses',       label: 'Courses',       icon: BookOpen },
  { href: '/channels',      label: 'Channels',      icon: Hash },
  { href: '/notifications', label: 'Notifications', icon: Bell },
]
const adminItems = [{ href: '/admin', label: 'Admin Panel', icon: Shield }]

export default function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const { isOpen, toggle, close } = useSidebar()
  const items = role === 'admin' ? [...navItems, ...adminItems] : navItems

  return (
    <>
      {/* ── Desktop: in-flow, width animates ── */}
      <aside
        style={{ width: isOpen ? '240px' : '64px' }}
        className="relative z-20 hidden h-full shrink-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.28),transparent_32%),linear-gradient(180deg,#0f2f70,#111827)] shadow-[18px_0_60px_rgba(15,23,42,0.20)] transition-[width] duration-300 ease-in-out md:flex dark:bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.16),transparent_32%),linear-gradient(180deg,#0f172a,#020617)]"
      >
        <SidebarInner items={items} pathname={pathname} isOpen={isOpen} toggle={toggle} onNavClick={() => {}} />
      </aside>

      {/* ── Mobile: fixed overlay, slides in ── */}
      <aside className={cn(
        'flex md:hidden flex-col bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.28),transparent_32%),linear-gradient(180deg,#0f2f70,#111827)] dark:bg-[#0f1929] h-full shadow-2xl',
        'fixed top-0 left-0 z-40 w-[240px]',
        'transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <SidebarInner items={items} pathname={pathname} isOpen={true} toggle={toggle} onNavClick={close} />
      </aside>
    </>
  )
}

function SidebarInner({
  items, pathname, isOpen, toggle, onNavClick,
}: {
  items: typeof navItems
  pathname: string
  isOpen: boolean
  toggle: () => void
  onNavClick: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand row */}
      <div className="flex h-16 shrink-0 items-center border-b border-white/10">
        {isOpen ? (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-2.5 px-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/15 shadow-inner backdrop-blur">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="whitespace-nowrap text-sm font-extrabold leading-tight tracking-tight text-white">Campus Buddy</p>
                <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200/80">MITAOE</p>
              </div>
            </div>
            <button
              onClick={toggle}
              title="Collapse sidebar"
              className="interactive-control mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            onClick={toggle}
            title="Expand sidebar"
            className="flex h-full w-full items-center justify-center text-white/70 transition-colors hover:bg-white/8 hover:text-white"
          >
            <GraduationCap className="h-5 w-5 text-white" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2 py-4">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href.length > 1 && pathname.startsWith(href))
          return (
            <div key={href} className="relative group/tip">
              <Link
                href={href}
                onClick={onNavClick}
                className={cn(
                  'interactive-control flex items-center rounded-xl text-sm font-bold transition-all duration-200',
                  isOpen ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5',
                  isActive
                    ? 'bg-white/18 text-white shadow-lg shadow-black/10'
                    : 'text-blue-100/72 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon className={cn('shrink-0', isActive ? 'h-4 w-4' : 'h-4 w-4')} />
                {isOpen && <span className="leading-none truncate">{label}</span>}
                {/* Active indicator dot */}
                {isActive && isOpen && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60 shrink-0" />
                )}
              </Link>

              {/* Tooltip when collapsed */}
              {!isOpen && (
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150">
                  <span className="block bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                    {label}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom — settings */}
      <div className="shrink-0 border-t border-white/10 px-2 py-3">
        <div className="relative group/tip">
          <Link
            href="/settings"
            onClick={onNavClick}
            className={cn(
              'interactive-control flex items-center rounded-xl text-sm font-bold transition-all',
              isOpen ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5',
              pathname.startsWith('/settings')
                ? 'bg-white/15 text-white'
                : 'text-blue-100/70 hover:bg-white/8 hover:text-white',
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {isOpen && <span>Settings</span>}
          </Link>
          {!isOpen && (
            <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity">
              <span className="block bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-xl">
                Settings
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

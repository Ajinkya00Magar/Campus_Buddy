'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/contexts/SidebarContext'
import { useUnreadBadges } from '@/hooks/useUnreadBadges'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Calendar, Users2, BookOpen,
  Hash, Bell, Settings, GraduationCap, Shield, ChevronLeft, ChevronRight,
  Lock, ChevronDown, FileText, Archive
} from 'lucide-react'
import type { UserRole, Channel } from '@/types'

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/channels',      label: 'Channels',      icon: Hash, isChannelParent: true },
  { href: '/events',        label: 'Events',        icon: Calendar },
  { href: '/clubs',         label: 'Clubs',         icon: Users2 },
  { href: '/courses',       label: 'Courses',       icon: BookOpen },
  { href: '/pyqs',  label: 'PYQs',  icon: Archive },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/notifications', label: 'Notifications', icon: Bell },
]
const adminItems = [{ href: '/admin', label: 'Admin Panel', icon: Shield }]
const courseManagerItems = [{ href: '/admin/courses', label: 'Manage Courses', icon: BookOpen }]

export default function Sidebar({ role, channels = [], userId }: { role: UserRole, channels?: Channel[], userId?: string }) {
  const pathname = usePathname()
  const { isOpen, toggle, close } = useSidebar()
  const { unreadCounts, mutedChannels } = useUnreadBadges(userId, channels)
  const items = role === 'admin'
    ? [...navItems, ...adminItems]
    : ['professor', 'cr'].includes(role)
      ? [...navItems, ...courseManagerItems]
      : navItems

  return (
    <>
      {/* ── Desktop: in-flow, width animates ── */}
      <aside
        style={{ width: isOpen ? '232px' : '60px' }}
        className="relative z-20 hidden h-full shrink-0 flex-col overflow-hidden border-r border-border bg-slate-100 transition-[width] duration-150 ease-in-out dark:border-slate-800 dark:bg-slate-950 md:flex"
      >
        <SidebarInner items={items} pathname={pathname} isOpen={isOpen} toggle={toggle} onNavClick={() => {}} channels={channels} unreadCounts={unreadCounts} mutedChannels={mutedChannels} />
      </aside>

      {/* ── Mobile: fixed overlay, slides in ── */}
      <aside className={cn(
        'flex md:hidden h-full flex-col border-r border-border bg-slate-100 dark:border-slate-800 dark:bg-slate-950',
        'fixed top-0 left-0 z-40 w-[232px]',
        'transition-transform duration-150 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <SidebarInner items={items} pathname={pathname} isOpen={true} toggle={toggle} onNavClick={close} channels={channels} unreadCounts={unreadCounts} mutedChannels={mutedChannels} />
      </aside>
    </>
  )
}

function SidebarInner({
  items, pathname, isOpen, toggle, onNavClick, channels, unreadCounts, mutedChannels
}: {
  items: any[]
  pathname: string
  isOpen: boolean
  toggle: () => void
  onNavClick: () => void
  channels: Channel[]
  unreadCounts: Record<string, number>
  mutedChannels: Set<string>
}) {
  const [channelsExpanded, setChannelsExpanded] = useState(pathname.startsWith('/channels'))
  
  useEffect(() => {
    if (pathname.startsWith('/channels')) {
      setChannelsExpanded(true)
    }
  }, [pathname])

  const official = channels.filter(c => c.type === 'official')
  const curriculum = channels.filter(c => c.type === 'academic' || c.type === 'subject')
  const clubs = channels.filter(c => c.type === 'club')

  // Calculate total unread channels count for the Channels nav item
  const totalUnread = channels.reduce((acc, ch) => acc + (unreadCounts[ch.id] ? 1 : 0), 0)

  return (
    <div className="flex flex-col h-full">
      {/* Brand row */}
      <div className="flex h-14 shrink-0 items-center border-b border-border dark:border-slate-800">
        {isOpen ? (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                <GraduationCap className="h-5 w-5 text-slate-700 dark:text-slate-100" />
              </div>
              <div>
                <p className="whitespace-nowrap text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">Campus Buddy</p>
                <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">MITAOE</p>
              </div>
            </div>
            <button
              onClick={toggle}
              title="Collapse sidebar"
              className="interactive-control mr-2 flex h-8 w-8 shrink-0 items-center justify-center text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            onClick={toggle}
            title="Expand sidebar"
            className="group flex h-full w-full items-center justify-center text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <GraduationCap className="h-5 w-5 transition-opacity group-hover:opacity-0" />
            <ChevronRight className="absolute h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2 py-3 custom-scrollbar">
        {items.map((item) => {
          const { href, label, icon: Icon, isChannelParent, external } = item
          const isActive = pathname === href || (href.length > 1 && pathname.startsWith(href))
          const isChannelsOpen = isChannelParent && channelsExpanded && isOpen
          
          return (
            <div key={href} className="space-y-0.5">
              <div className="relative group/tip">
                <Link
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  onClick={(e) => {
                    if (isChannelParent) {
                      setChannelsExpanded(!channelsExpanded)
                      if (pathname.startsWith('/channels')) {
                        e.preventDefault()
                        return // Do not close the mobile sidebar if we're just toggling the menu
                      }
                    }
                    if (!external) onNavClick()
                  }}
                  className={cn(
                    'interactive-control flex items-center text-sm font-medium transition-colors',
                    isOpen ? 'gap-3 px-2.5 py-2' : 'justify-center py-2',
                    isActive
                      ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {isOpen && <span className="leading-none truncate flex-1">{label}</span>}
                  {isActive && isOpen && !isChannelParent && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-slate-500 dark:bg-slate-300 shrink-0" />
                  )}
                  {isChannelParent && isOpen && (
                    <ChevronDown className={cn("h-3 w-3 opacity-40 transition-transform", channelsExpanded ? "rotate-0" : "-rotate-90")} />
                  )}
                </Link>

                {!isOpen && (
                  <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150">
                    <span className="block border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-sm whitespace-nowrap">
                      {label}
                    </span>
                  </div>
                )}
              </div>

              {/* Sub-channels under Channels */}
              {isChannelsOpen && (
                <div className="mt-1 space-y-4 pl-4 pb-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  {official.length > 0 && (
                    <div className="space-y-0.5">
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">General</p>
                      {official.map(ch => <SidebarChannelLink key={ch.id} channel={ch} pathname={pathname} onNavClick={onNavClick} unreadCount={unreadCounts[ch.id]} isMuted={mutedChannels.has(ch.id)} />)}
                    </div>
                  )}
                  {curriculum.length > 0 && (
                    <div className="space-y-0.5">
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Curriculum</p>
                      {curriculum.map(ch => <SidebarChannelLink key={ch.id} channel={ch} pathname={pathname} onNavClick={onNavClick} unreadCount={unreadCounts[ch.id]} isMuted={mutedChannels.has(ch.id)} />)}
                    </div>
                  )}
                  {clubs.length > 0 && (
                    <div className="space-y-0.5">
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Clubs</p>
                      {clubs.map(ch => <SidebarChannelLink key={ch.id} channel={ch} pathname={pathname} onNavClick={onNavClick} unreadCount={unreadCounts[ch.id]} isMuted={mutedChannels.has(ch.id)} />)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom — settings */}
      <div className="shrink-0 border-t border-border px-2 py-2 dark:border-slate-800">
        <div className="relative group/tip">
          <Link
            href="/settings"
            onClick={onNavClick}
            className={cn(
              'interactive-control flex items-center text-sm font-medium transition-colors',
              isOpen ? 'gap-3 px-2.5 py-2' : 'justify-center py-2',
              pathname.startsWith('/settings')
                ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {isOpen && <span>Settings</span>}
          </Link>
          {!isOpen && (
            <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity">
              <span className="block border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-sm">
                Settings
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SidebarChannelLink({ channel, pathname, onNavClick, unreadCount = 0, isMuted = false }: { channel: Channel, pathname: string, onNavClick: () => void, unreadCount?: number, isMuted?: boolean }) {
  const isActive = pathname === `/channels/${channel.id}`
  
  return (
    <Link
      href={`/channels/${channel.id}`}
      onClick={onNavClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium transition-colors justify-between",
        isActive 
          ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100" 
          : "text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {channel.is_private ? (
          <Lock className="h-3 w-3 shrink-0 opacity-60" />
        ) : (
          <Hash className="h-3 w-3 shrink-0 opacity-60" />
        )}
        <span className={cn("truncate", !isActive && unreadCount > 0 && !isMuted && "font-bold text-slate-900 dark:text-slate-100")}>{channel.name}</span>
      </div>
      {unreadCount > 0 && (
        <span className={cn(
          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
          isMuted ? "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400" : "bg-blue-600 text-white"
        )}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

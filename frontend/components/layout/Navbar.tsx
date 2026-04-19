'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSidebar } from '@/contexts/SidebarContext'
import { useTheme } from './ThemeContext'
import { getInitials, getRoleBadgeColor, cn } from '@/lib/utils'
import NotificationDropdown from './NotificationDropdown'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Settings, Menu, Sun, Moon } from 'lucide-react'
import type { User as UserType } from '@/types'

export default function Navbar({ user }: { user: UserType | null }) {
  const router       = useRouter()
  const supabase     = createClient()
  const { toggle: toggleSidebar } = useSidebar()
  const { theme, toggle: toggleTheme } = useTheme()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!user) return null

  return (
    <header className="z-20 mx-3 mt-3 flex h-16 shrink-0 items-center gap-3 rounded-2xl border bg-card/78 px-4 shadow-[0_18px_50px_hsl(222_47%_11%_/_0.08)] backdrop-blur-xl md:mx-5">

      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="interactive-control flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:-translate-y-0.5 hover:bg-accent hover:text-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden min-w-0 md:block">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Campus Buddy</p>
        <p className="truncate text-sm font-semibold text-muted-foreground">MIT Academy of Engineering workspace</p>
      </div>

      <div className="flex-1" />

      {/* Dark mode toggle */}
      <button
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="interactive-control flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:-translate-y-0.5 hover:bg-accent hover:text-foreground"
      >
        {theme === 'dark'
          ? <Sun  className="h-4.5 w-4.5" />
          : <Moon className="h-4.5 w-4.5" />
        }
      </button>

      {/* Notifications */}
      <NotificationDropdown userId={user.id} />

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="interactive-control flex items-center gap-2.5 rounded-2xl border border-transparent px-2 py-1.5 outline-none transition hover:-translate-y-0.5 hover:border-border hover:bg-accent/70">
            <Avatar className="h-9 w-9 ring-2 ring-primary/12">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold leading-tight text-foreground">{user.name}</p>
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-semibold border',
                getRoleBadgeColor(user.role)
              )}>
                {user.role}
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer gap-2">
            <User className="h-4 w-4" /> Profile & Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

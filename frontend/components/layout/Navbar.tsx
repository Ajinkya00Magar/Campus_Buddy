'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSidebar } from '@/contexts/SidebarContext'
import { useTheme } from './ThemeContext'
import { getInitials, getRoleBadgeColor, cn } from '@/lib/utils'
import NotificationDropdown from './NotificationDropdown'
import GlobalSearch from './GlobalSearch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Settings, Menu, Sun, Moon, Palette } from 'lucide-react'
import { getProfileDepartmentDisplay, STUDENT_DEPARTMENT_SHORT } from '@/utils/department'
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

  const departmentLabel = getProfileDepartmentDisplay(user)

  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-card px-3 md:px-4">

      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="interactive-control flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground transition hover:bg-accent hover:text-foreground md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden min-w-0 md:block">
        <p className="text-sm font-semibold text-foreground">Campus Buddy</p>
        <p className="truncate text-xs text-muted-foreground">MIT Academy of Engineering workspace</p>
      </div>

      <div className="flex-1" />

      {/* Global search (⌘K) */}
      <GlobalSearch />

      {/* Theme toggle — cycles light → dark → charcoal */}
      <button
        onClick={toggleTheme}
        aria-label={`Theme: ${theme}. Click to switch.`}
        title={`Theme: ${theme}`}
        className="interactive-control lift flex h-9 w-9 items-center justify-center text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        {theme === 'light'    && <Sun     className="h-4.5 w-4.5" />}
        {theme === 'dark'     && <Moon    className="h-4.5 w-4.5" />}
        {theme === 'charcoal' && <Palette className="h-4.5 w-4.5 text-primary" />}
      </button>

      {/* Notifications */}
      <NotificationDropdown userId={user.id} />

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="interactive-control lift flex items-center gap-2 rounded-lg border border-transparent px-2 py-1 outline-none transition hover:border-border hover:bg-accent">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium leading-tight text-foreground">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 font-medium border',
                  getRoleBadgeColor(user.role)
                )}>
                  {user.role}
                </span>
                {departmentLabel && (
                  <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[140px]">
                    {STUDENT_DEPARTMENT_SHORT}
                  </span>
                )}
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              {departmentLabel && (
                <p className="text-[11px] text-muted-foreground">{departmentLabel}</p>
              )}
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

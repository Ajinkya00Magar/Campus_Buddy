'use client'

import { useNotifications } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Bell, CheckCheck, MessageSquare, Calendar, BookOpen, Info } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import type { NotifType } from '@/types'

const typeIcon: Record<NotifType, React.ReactNode> = {
  message: <MessageSquare className="h-3.5 w-3.5 text-blue-500" />,
  event:   <Calendar className="h-3.5 w-3.5 text-green-500" />,
  course:  <BookOpen className="h-3.5 w-3.5 text-purple-500" />,
  info:    <Info className="h-3.5 w-3.5 text-gray-500" />,
}

export default function NotificationDropdown({ userId }: { userId: string }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem key={n.id} onClick={() => markRead(n.id)}
              className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer ${!n.is_read ? 'bg-blue-50/60' : ''}`}>
              <div className="mt-0.5 shrink-0">{typeIcon[n.type]}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-tight ${!n.is_read ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

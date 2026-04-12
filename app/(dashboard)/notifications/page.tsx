'use client'

import { useUser } from '@/hooks/useUser'
import { useNotifications } from '@/hooks/useNotifications'
import { Bell, MessageSquare, Calendar, BookOpen, Info, CheckCheck } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { NotifType } from '@/types'

const typeConfig: Record<NotifType, { icon: any; color: string; bg: string }> = {
  message: { icon: MessageSquare, color: 'text-blue-600',   bg: 'bg-blue-50' },
  event:   { icon: Calendar,      color: 'text-green-600',  bg: 'bg-green-50' },
  course:  { icon: BookOpen,      color: 'text-violet-600', bg: 'bg-violet-50' },
  info:    { icon: Info,          color: 'text-gray-600',   bg: 'bg-gray-50' },
}

export default function NotificationsPage() {
  const { user } = useUser()
  const { notifications, loading, unreadCount, markRead, markAllRead } = useNotifications(user?.id)

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-20 w-20 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Bell className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="font-semibold text-gray-700">No notifications</h3>
          <p className="text-sm text-muted-foreground mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = typeConfig[n.type]
            const Icon = config.icon
            return (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left hover:shadow-sm ${
                  !n.is_read ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-50' : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className={`h-10 w-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-tight ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0 mt-1" />
                    )}
                  </div>
                  {n.body && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-xs text-muted-foreground mt-1.5">{timeAgo(n.created_at)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { markAsRead, markAllAsRead } from '@/services/notifications.service'
import { Bell, MessageSquare, Calendar, BookOpen, Info, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { timeAgo } from '@/lib/utils'
import type { Notification, NotifType } from '@/types'

const typeConfig: Record<NotifType, { icon: any; color: string; bg: string; darkBg: string }> = {
  message: { icon: MessageSquare, color: 'text-blue-600',   bg: 'bg-blue-50',   darkBg: 'dark:bg-blue-900/30' },
  event:   { icon: Calendar,      color: 'text-green-600',  bg: 'bg-green-50',  darkBg: 'dark:bg-green-900/30' },
  course:  { icon: BookOpen,      color: 'text-violet-600', bg: 'bg-violet-50', darkBg: 'dark:bg-violet-900/30' },
  info:    { icon: Info,          color: 'text-gray-500',   bg: 'bg-gray-100',  darkBg: 'dark:bg-gray-800' },
}

export default function NotificationsClient({
  userId,
  initialNotifications,
}: {
  userId: string
  initialNotifications: Notification[]
}) {
  const supabase = createClient()
  const [notifs, setNotifs] = useState<Notification[]>(initialNotifications)

  // Subscribe to new notifications in real-time
  useEffect(() => {
    const channel = supabase
      .channel(`notifs-page:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifs(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const unread = notifs.filter(n => !n.is_read).length

  const handleMarkRead = async (id: string) => {
    await markAsRead(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const handleMarkAll = async () => {
    await markAllAsRead(userId)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unread > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                {unread} unread
              </span>
            ) : 'All caught up!'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAll} className="gap-1.5 text-xs">
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {/* Empty */}
      {notifs.length === 0 ? (
        <div className="text-center py-24">
          <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Bell className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h3 className="font-semibold text-foreground">No notifications</h3>
          <p className="text-sm text-muted-foreground mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const cfg = typeConfig[n.type] ?? typeConfig.info
            const Icon = cfg.icon
            return (
              <button
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={[
                  'w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all',
                  !n.is_read
                    ? 'bg-primary/5 border-primary/20 hover:bg-primary/8 dark:bg-primary/10 dark:border-primary/30'
                    : 'bg-card border-border hover:bg-accent',
                ].join(' ')}
              >
                <div className={`h-10 w-10 rounded-xl ${cfg.bg} ${cfg.darkBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                  {n.body && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                  )}
                  <p className="text-xs text-muted-foreground/70 mt-1.5">{timeAgo(n.created_at)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

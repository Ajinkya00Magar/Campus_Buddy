'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getNotifications, markAsRead, markAllAsRead } from '@/services/notifications.service'
import type { Notification } from '@/types'

export function useNotifications(userId: string | undefined) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('Service Worker registration successful with scope: ', registration.scope);
          // Future: Implement PushManager subscription here
          // registration.pushManager.subscribe({ ... })
        },
        (err) => {
          console.log('Service Worker registration failed: ', err);
        }
      );
    }
  }, [])

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    getNotifications(userId).then((data) => {
      setNotifications(data)
      setLoading(false)
    })

    const channelIdSuffix = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`notifs:${userId}:${channelIdSuffix}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications((prev) => [newNotif, ...prev])
          
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotif.title, {
              body: newNotif.body,
              icon: '/icon.svg'
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const handleMarkRead = async (id: string) => {
    await markAsRead(id)
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
    )
  }

  const handleMarkAllRead = async () => {
    if (!userId) return
    await markAllAsRead(userId)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return { notifications, loading, unreadCount, markRead: handleMarkRead, markAllRead: handleMarkAllRead }
}

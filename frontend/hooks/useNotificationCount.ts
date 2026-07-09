'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Lightweight unread-notification counter for badges (e.g. the sidebar item).
 * Shares the `notifications` table with the Navbar bell, so both stay in sync —
 * but without the bell's service-worker / push side effects.
 */
export function useNotificationCount(userId: string | undefined) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    let active = true

    const refresh = async () => {
      const { count: c } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
      if (active) setCount(c ?? 0)
    }

    refresh()

    const suffix = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`notif-count:${userId}:${suffix}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, refresh)
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [userId])

  return count
}

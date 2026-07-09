'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Keeps the signed-in user's view in sync when an admin edits their profile
 * (role, academic year, department, name, …). Subscribes to this user's own
 * `users` row and re-runs the server components on any change, so the sidebar
 * channels, permissions, and profile everywhere update instantly — no refresh.
 */
export function useProfileSync(userId: string | undefined) {
  const router = useRouter()
  const debounce = useRef<number | null>(null)

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()

    const suffix = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`profile-sync:${userId}:${suffix}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        () => {
          if (debounce.current) window.clearTimeout(debounce.current)
          // Small debounce so a burst of edits triggers a single refresh.
          debounce.current = window.setTimeout(() => router.refresh(), 300)
        }
      )
      .subscribe()

    return () => {
      if (debounce.current) window.clearTimeout(debounce.current)
      supabase.removeChannel(channel)
    }
  }, [userId, router])
}

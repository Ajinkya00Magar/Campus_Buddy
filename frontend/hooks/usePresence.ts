'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type PresenceUser = { id: string; name: string }

/**
 * Per-channel presence + typing over a single Supabase Realtime channel.
 *  - Presence: who is currently viewing the channel (online dots / count).
 *  - Typing: ephemeral broadcast of who is composing a message.
 * No database tables involved — all transient.
 */
export function usePresence(channelId: string, user: PresenceUser | null) {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  if (!supabaseRef.current) supabaseRef.current = createClient()
  const channelRef = useRef<ReturnType<NonNullable<typeof supabaseRef.current>['channel']> | null>(null)
  const typingTimeoutRef = useRef<number | null>(null)

  const [onlineIds, setOnlineIds] = useState<string[]>([])
  const [typingUsers, setTypingUsers] = useState<PresenceUser[]>([])
  // Clears a typing entry after inactivity so a dropped "stop" never sticks.
  const typingExpiry = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (!channelId || !user) return
    const client = supabaseRef.current
    if (!client) return

    const channel = client.channel(`presence:${channelId}`, {
      config: { presence: { key: user.id } },
    })
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>()
        setOnlineIds(Object.keys(state))
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const p = payload as PresenceUser & { typing: boolean }
        if (p.id === user.id) return
        setTypingUsers((prev) => {
          const others = prev.filter((u) => u.id !== p.id)
          if (p.typing) {
            typingExpiry.current.set(p.id, Date.now() + 4000)
            return [...others, { id: p.id, name: p.name }]
          }
          typingExpiry.current.delete(p.id)
          return others
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ id: user.id, name: user.name })
        }
      })

    // Sweep expired typing indicators (covers missed "stop" broadcasts).
    const sweep = window.setInterval(() => {
      const now = Date.now()
      let changed = false
      typingExpiry.current.forEach((expiry, id) => {
        if (expiry < now) {
          typingExpiry.current.delete(id)
          changed = true
        }
      })
      if (changed) {
        setTypingUsers((prev) => prev.filter((u) => typingExpiry.current.has(u.id)))
      }
    }, 2000)

    return () => {
      window.clearInterval(sweep)
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current)
      channel.untrack()
      client.removeChannel(channel)
      channelRef.current = null
      setOnlineIds([])
      setTypingUsers([])
      typingExpiry.current.clear()
    }
  }, [channelId, user?.id, user?.name])

  const sendTyping = useCallback(() => {
    const channel = channelRef.current
    if (!channel || !user) return
    channel.send({ type: 'broadcast', event: 'typing', payload: { ...user, typing: true } })
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = window.setTimeout(() => {
      channel.send({ type: 'broadcast', event: 'typing', payload: { ...user, typing: false } })
    }, 2500)
  }, [user])

  const stopTyping = useCallback(() => {
    const channel = channelRef.current
    if (!channel || !user) return
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current)
    channel.send({ type: 'broadcast', event: 'typing', payload: { ...user, typing: false } })
  }, [user])

  return { onlineIds, onlineCount: onlineIds.length, typingUsers, sendTyping, stopTyping }
}

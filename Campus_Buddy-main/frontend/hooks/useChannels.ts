'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Channel, User } from '@/types'

export function useChannels(initialChannels: Channel[], profile: User | null) {
  const [channels, setChannels] = useState<Channel[]>(initialChannels)
  const supabase = createClient()

  useEffect(() => {
    setChannels(initialChannels)
  }, [initialChannels])

  useEffect(() => {
    const channelIdSuffix = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`public:channels:${channelIdSuffix}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'channels' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newChannel = payload.new as Channel
            // Apply filtering logic locally
            if (shouldShowChannel(newChannel, profile)) {
              setChannels((prev) => [...prev, newChannel].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)))
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Channel
            if (shouldShowChannel(updated, profile)) {
              setChannels((prev) => prev.map((ch) => (ch.id === updated.id ? updated : ch)))
            } else {
              setChannels((prev) => prev.filter((ch) => ch.id !== updated.id))
            }
          } else if (payload.eventType === 'DELETE') {
            setChannels((prev) => prev.filter((ch) => ch.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile])

  return channels
}

function shouldShowChannel(ch: Channel, profile: User | null): boolean {
  if (!profile) return false
  
  // Admin/Professor/CR see everything
  if (['admin', 'professor', 'cr'].includes(profile.role)) return true
  
  // Official channels are visible to everyone
  if (ch.type === 'official') return true
  
  // Academic/Subject channels are visible if year matches
  if (ch.type === 'academic' || ch.type === 'subject') {
    return ch.year === profile.year
  }
  
  // Private channels are hidden (RLS handles fetch, but we filter here for safety)
  if (ch.is_private) return false

  return true
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { shouldShowChannelForUser } from '@/utils/channelVisibility'
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
            if (shouldShowChannelForUser(newChannel, profile)) {
              setChannels((prev) => [...prev, newChannel].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)))
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Channel
            if (shouldShowChannelForUser(updated, profile)) {
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

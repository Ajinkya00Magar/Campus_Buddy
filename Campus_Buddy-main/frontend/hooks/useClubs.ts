'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Club } from '@/types'

export function useClubs(initialClubs: Club[]) {
  const [clubs, setClubs] = useState<Club[]>(initialClubs)
  const supabase = createClient()

  useEffect(() => {
    setClubs(initialClubs)
  }, [initialClubs])

  useEffect(() => {
    const channelIdSuffix = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`public:clubs:${channelIdSuffix}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clubs' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newClub = payload.new as Club
            setClubs((prev) => [...prev, { ...newClub, _members_count: 0 }].sort((a, b) => a.name.localeCompare(b.name)))
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Club
            setClubs((prev) => prev.map((c) => (c.id === updated.id ? { ...updated, _members_count: c._members_count } : c)))
          } else if (payload.eventType === 'DELETE') {
            setClubs((prev) => prev.filter((c) => c.id !== payload.old.id))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'club_members' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const cid = (payload.new as any).club_id
            setClubs((prev) => prev.map(c => c.id === cid ? { ...c, _members_count: (c._members_count ?? 0) + 1 } : c))
          } else if (payload.eventType === 'DELETE') {
            const cid = (payload.old as any).club_id
            if (cid) {
              setClubs((prev) => prev.map(c => c.id === cid ? { ...c, _members_count: Math.max(0, (c._members_count ?? 0) - 1) } : c))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return clubs
}

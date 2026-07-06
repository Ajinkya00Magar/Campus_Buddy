'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/types'

export function useEvents(initialEvents: Event[]) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const supabase = createClient()

  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents.map(e => e.id).join(',')])

  useEffect(() => {
    const channelIdSuffix = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`public:events:${channelIdSuffix}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newEvent = payload.new as Event
            if (newEvent.is_published) {
              setEvents((prev) => [...prev, { ...newEvent, _participants_count: 0 }].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()))
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Event
            if (updated.is_published) {
              setEvents((prev) => prev.map((e) => (e.id === updated.id ? { ...updated, _participants_count: e._participants_count } : e)))
            } else {
              setEvents((prev) => prev.filter((e) => e.id !== updated.id))
            }
          } else if (payload.eventType === 'DELETE') {
            setEvents((prev) => prev.filter((e) => e.id !== payload.old.id))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_participants' },
        (payload) => {
          // Update counts locally when someone RSVPs
          if (payload.eventType === 'INSERT') {
            const pid = (payload.new as any).event_id
            setEvents((prev) => prev.map(e => e.id === pid ? { ...e, _participants_count: (e._participants_count ?? 0) + 1 } : e))
          } else if (payload.eventType === 'DELETE') {
            const pid = (payload.old as any).event_id
            if (pid) {
              setEvents((prev) => prev.map(e => e.id === pid ? { ...e, _participants_count: Math.max(0, (e._participants_count ?? 0) - 1) } : e))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return events
}

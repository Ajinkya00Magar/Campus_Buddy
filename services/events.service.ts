import { createClient } from '@/lib/supabase/client'
import type { Event, EventParticipant, EventStatus } from '@/types'

export async function getEvents(category?: string): Promise<Event[]> {
  const supabase = createClient()
  let query = supabase
    .from('events')
    .select('*, event_participants(count), users(name)')
    .eq('is_published', true)
    .order('event_date', { ascending: true })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data } = await query
  return (data ?? []).map((e: any) => ({
    ...e,
    _participants_count: e.event_participants?.[0]?.count ?? 0,
  }))
}

export async function getEvent(id: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('events')
    .select('*, users(name, avatar_url), event_participants(count)')
    .eq('id', id)
    .single()
  return data
}

export async function getUserRsvp(
  eventId: string,
  userId: string
): Promise<EventParticipant | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

export async function rsvpEvent(
  eventId: string,
  userId: string,
  status: EventStatus
) {
  const supabase = createClient()
  const { error } = await supabase.from('event_participants').upsert(
    { event_id: eventId, user_id: userId, status },
    { onConflict: 'event_id,user_id' }
  )
  return { error }
}

export async function createEvent(payload: {
  title: string
  description?: string
  category: string
  location?: string
  event_date: string
  created_by: string
  max_capacity?: number
  is_published?: boolean
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function updateEvent(id: string, payload: Partial<Event>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteEvent(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('events').delete().eq('id', id)
  return { error }
}

export async function getEventParticipants(eventId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('event_participants')
    .select('*, users(name, avatar_url, role, department)')
    .eq('event_id', eventId)
  return data ?? []
}

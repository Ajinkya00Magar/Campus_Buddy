import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EventDetailClient from './EventDetailClient'

export default async function EventDetailPage({ params }: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: event }, { data: profile }, { data: rsvp }, { data: participants }] = await Promise.all([
    supabase.from('events').select('*, users(name, avatar_url), event_participants(count)').eq('id', params.id).single(),
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('event_participants').select('*').eq('event_id', params.id).eq('user_id', user.id).maybeSingle(),
    supabase.from('event_participants').select('*, users(name, avatar_url)').eq('event_id', params.id).eq('status', 'going').limit(20),
  ])

  if (!event) notFound()

  return (
    <EventDetailClient
      event={{ ...event, _participants_count: event.event_participants?.[0]?.count ?? 0 }}
      currentUser={profile}
      initialRsvp={rsvp}
      participants={participants ?? []}
    />
  )
}

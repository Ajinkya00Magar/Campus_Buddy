import { createClient } from '@/lib/supabase/server'
import EventsClient from './EventsClient'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('*, event_participants(count)')
    .eq('is_published', true)
    .order('event_date', { ascending: true })

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user!.id).single()

  const mapped = (events ?? []).map((e: any) => ({
    ...e,
    _participants_count: e.event_participants?.[0]?.count ?? 0,
  }))

  return <EventsClient events={mapped} userRole={profile?.role ?? 'student'} userId={user!.id} />
}

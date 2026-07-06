import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'
import { filterChannelsForUser } from '@/utils/channelVisibility'
import { getUserProfile, getChannels } from '@/lib/data'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const profile = await getUserProfile(user.id)

  const [
    { count: eventsCount },
    { count: clubsCount },
    { count: coursesCount },
    { data: events },
    { data: courses },
    channels,
    { data: completions },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('clubs').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('events')
      .select('*, event_participants(count)')
      .eq('is_published', true)
      .order('event_date', { ascending: true })
      .limit(10),
    supabase.from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(10),
    getChannels(),
    supabase.from('course_completions').select('course_id').eq('user_id', user.id),
  ])

  // Map participant counts for initial state
  const mappedEvents = (events ?? []).map((e: any) => ({
    ...e,
    _participants_count: e.event_participants?.[0]?.count ?? 0,
  }))

  const completedIds = new Set((completions ?? []).map((c: any) => c.course_id))

  const filteredChannels = filterChannelsForUser(channels ?? [], profile)
    .sort((a, b) => (a.type === 'official' ? -1 : 1))

  return (
    <DashboardClient
      profile={profile}
      initialEvents={mappedEvents}
      initialCourses={courses ?? []}
      initialChannels={filteredChannels}
      completedIds={completedIds}
      counts={{
        events: eventsCount ?? 0,
        clubs: clubsCount ?? 0,
        courses: coursesCount ?? 0
      }}
    />
  )
}

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ClubDetailClient from './ClubDetailClient'

export default async function ClubDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: club }, { data: membership }] = await Promise.all([
    supabase.from('clubs').select('*, club_members(count, users(name, avatar_url, role))').eq('id', params.id).single(),
    supabase.from('club_members').select('id').eq('club_id', params.id).eq('user_id', user.id).maybeSingle(),
  ])

  if (!club) notFound()

  return (
    <ClubDetailClient
      club={{ ...club, _members_count: club.club_members?.[0]?.count ?? 0 }}
      isMember={!!membership}
      userId={user.id}
    />
  )
}

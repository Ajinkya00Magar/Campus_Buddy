import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ClubDetailClient from './ClubDetailClient'
import { getMitaoeClub } from '@/data/mitaoeClubs'

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const officialClub = getMitaoeClub(id)
  if (officialClub) {
    return (
      <ClubDetailClient
        club={officialClub}
        isMember={false}
        userId={user.id}
      />
    )
  }

  const [{ data: club }, { data: membership }] = await Promise.all([
    supabase.from('clubs').select('*, club_members(count, users(name, avatar_url, role))').eq('id', id).single(),
    supabase.from('club_members').select('id').eq('club_id', id).eq('user_id', user.id).maybeSingle(),
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

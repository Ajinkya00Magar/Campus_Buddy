import { createClient } from '@/lib/supabase/server'
import ClubsClient from './ClubsClient'
import { mitaoeClubs } from '@/data/mitaoeClubs'

export default async function ClubsPage() {
  const supabase = await createClient()
  const { data: clubs } = await supabase
    .from('clubs')
    .select('*, club_members(count)')
    .order('name')

  const dbClubs = (clubs ?? []).map((c: any) => ({
    ...c,
    _members_count: c.club_members?.[0]?.count ?? 0,
  }))

  const clubMap = new Map<string, any>([
    ...mitaoeClubs.map((club) => [club.id, club]),
    ...dbClubs.map((club) => [club.id, club]),
  ])

  const mapped = Array.from(clubMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  return <ClubsClient initialClubs={mapped} />
}

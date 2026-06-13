import { createClient } from '@/lib/supabase/server'
import ClubsClient from './ClubsClient'
import { mitaoeClubs } from '@/data/mitaoeClubs'

export default async function ClubsPage() {
  const supabase = await createClient()
  const { data: clubs } = await supabase
    .from('clubs')
    .select('*, club_members(count)')
    .order('name')

  const mapped = (clubs ?? []).map((c: any) => ({
    ...c,
    _members_count: c.club_members?.[0]?.count ?? 0,
  }))

  const dbNames = new Set(mapped.map((club: any) => club.name.toLowerCase()))
  const combinedClubs = [
    ...mitaoeClubs.filter((club) => !dbNames.has(club.name.toLowerCase())),
    ...mapped,
  ].sort((a: any, b: any) => a.name.localeCompare(b.name))

  return <ClubsClient initialClubs={combinedClubs} />
}

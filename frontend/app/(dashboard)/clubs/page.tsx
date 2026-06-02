import { createClient } from '@/lib/supabase/server'
import ClubsClient from './ClubsClient'

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

  return <ClubsClient initialClubs={mapped} />
}

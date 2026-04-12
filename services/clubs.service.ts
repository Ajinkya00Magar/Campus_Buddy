import { createClient } from '@/lib/supabase/client'
import type { Club } from '@/types'

export async function getClubs(): Promise<Club[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('clubs')
    .select('*, club_members(count)')
    .order('name')
  return (data ?? []).map((c: any) => ({
    ...c,
    _members_count: c.club_members?.[0]?.count ?? 0,
  }))
}

export async function getClub(id: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('clubs')
    .select('*, club_members(count, users(name, avatar_url, role))')
    .eq('id', id)
    .single()
  return data
}

export async function joinClub(clubId: string, userId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('club_members')
    .upsert({ club_id: clubId, user_id: userId, role: 'member' }, { onConflict: 'club_id,user_id' })
  return { error }
}

export async function leaveClub(clubId: string, userId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', userId)
  return { error }
}

export async function isClubMember(clubId: string, userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('club_members')
    .select('id')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

export async function createClub(payload: Partial<Club>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clubs')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function updateClub(id: string, payload: Partial<Club>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clubs')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteClub(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('clubs').delete().eq('id', id)
  return { error }
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: completions } = await supabase
    .from('course_completions')
    .select('course_id, completed_at, courses(title)')
    .eq('user_id', user.id)

  const { data: clubMemberships } = await supabase
    .from('club_members')
    .select('club_id, role, clubs(name)')
    .eq('user_id', user.id)

  return (
    <SettingsClient
      profile={profile}
      completions={completions ?? []}
      clubMemberships={clubMemberships ?? []}
    />
  )
}

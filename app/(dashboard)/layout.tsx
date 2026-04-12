import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardLayoutClient from './DashboardLayoutClient'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <DashboardLayoutClient role={profile?.role ?? 'student'} user={profile}>
      {children}
    </DashboardLayoutClient>
  )
}

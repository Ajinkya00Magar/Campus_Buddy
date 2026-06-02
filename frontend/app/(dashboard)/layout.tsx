import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: channels }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('channels').select('*').order('type').order('name'),
  ])

  // Year-based filtering for students
  const filteredChannels = (channels ?? []).filter((ch) => {
    if (!profile) return false
    if (['admin', 'professor', 'cr'].includes(profile.role)) return true
    
    // Students only see their year for curriculum
    if (ch.type === 'academic' || ch.type === 'subject') {
      return ch.year === profile.year
    }
    
    return true // Official/Public Clubs already handled by RLS
  })

  return <DashboardShell user={profile} channels={filteredChannels}>{children}</DashboardShell>
}

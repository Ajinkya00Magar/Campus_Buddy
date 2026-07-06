import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import { filterChannelsForUser } from '@/utils/channelVisibility'
import { getUserProfile, getChannels } from '@/lib/data'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profile, channels] = await Promise.all([
    getUserProfile(user.id),
    getChannels()
  ])

  const filteredChannels = filterChannelsForUser(channels, profile)

  return <DashboardShell user={profile} channels={filteredChannels}>{children}</DashboardShell>
}


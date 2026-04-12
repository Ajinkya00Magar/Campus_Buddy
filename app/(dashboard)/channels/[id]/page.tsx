import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ChannelPageClient from './ChannelPageClient'

export default async function ChannelPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: channel }, { data: profile }, { data: channels }] = await Promise.all([
    supabase.from('channels').select('*').eq('id', params.id).single(),
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('channels').select('*').order('type').order('name'),
  ])

  if (!channel) notFound()

  return (
    <ChannelPageClient
      channel={channel}
      currentUser={profile}
      allChannels={channels ?? []}
    />
  )
}

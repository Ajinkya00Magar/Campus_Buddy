import { createClient } from '@/lib/supabase/client'
import type { Channel, Message, Poll } from '@/types'

export async function getChannels(): Promise<Channel[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('channels')
    .select('*')
    .order('type')
    .order('name')
  return data ?? []
}

export async function getChannel(id: string): Promise<Channel | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('channels')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function getMessages(channelId: string): Promise<Message[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('messages')
    .select('*, users(name, avatar_url, role)')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(100)
  return data ?? []
}

export async function sendMessage(payload: {
  channel_id: string
  sender_id: string
  content?: string
  file_url?: string
  file_name?: string
  reply_to?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .insert(payload)
    .select('*, users(name, avatar_url, role)')
    .single()
  return { data, error }
}

export async function pinMessage(messageId: string, pin: boolean) {
  const supabase = createClient()
  const { error } = await supabase
    .from('messages')
    .update({ is_pinned: pin })
    .eq('id', messageId)
  return { error }
}

export async function uploadFile(file: File, channelId: string) {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `${channelId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('channel-files')
    .upload(path, file)
  if (error) return { url: null, error }
  const { data } = supabase.storage.from('channel-files').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

export async function createChannel(payload: {
  name: string
  description?: string
  type: string
  department?: string
  year?: number
  created_by: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('channels')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function deleteChannel(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('channels').delete().eq('id', id)
  return { error }
}

export async function getPinnedMessages(channelId: string): Promise<Message[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('messages')
    .select('*, users(name, avatar_url, role)')
    .eq('channel_id', channelId)
    .eq('is_pinned', true)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createPoll(payload: {
  channel_id: string
  question: string
  options: string[]
  created_by: string
  ends_at?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('polls')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function getChannelPolls(channelId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('polls')
    .select('*, poll_votes(*)')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function voteOnPoll(
  pollId: string,
  userId: string,
  optionIdx: number
) {
  const supabase = createClient()
  const { error } = await supabase
    .from('poll_votes')
    .upsert(
      { poll_id: pollId, user_id: userId, option_idx: optionIdx },
      { onConflict: 'poll_id,user_id' }
    )
  return { error }
}

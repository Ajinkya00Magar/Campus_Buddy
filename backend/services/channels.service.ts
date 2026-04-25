import { createClient } from '@/lib/supabase/client'
import type { Channel, ChannelStats, Message, MessageReaction, Poll } from '@/types'

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

export async function updateMessage(messageId: string, content: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .update({ content, edited_at: new Date().toISOString() })
    .eq('id', messageId)
    .select('*, users(name, avatar_url, role)')
    .single()
  return { data, error }
}

export async function deleteMessage(messageId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
  return { error }
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

export async function getMessageReactions(channelId: string): Promise<MessageReaction[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('message_reactions')
    .select('*, users(name, avatar_url, role), messages!inner(channel_id)')
    .eq('messages.channel_id', channelId)
    .order('created_at', { ascending: true })

  if (error) return []
  return data ?? []
}

export async function toggleMessageReaction(messageId: string, userId: string, emoji: string) {
  const supabase = createClient()
  const { data: existing } = await supabase
    .from('message_reactions')
    .select('id, emoji')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing?.emoji === emoji) {
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('id', existing.id)
    return { error }
  }

  const { error } = await supabase
    .from('message_reactions')
    .upsert(
      { message_id: messageId, user_id: userId, emoji },
      { onConflict: 'message_id,user_id' }
    )
  return { error }
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

export async function getChannelStats(channelId: string): Promise<ChannelStats> {
  const supabase = createClient()
  const [{ count: members }, { data: files }, { data: messages }] = await Promise.all([
    supabase
      .from('channel_members')
      .select('id', { count: 'exact', head: true })
      .eq('channel_id', channelId),
    supabase
      .from('messages')
      .select('file_name, file_url')
      .eq('channel_id', channelId)
      .not('file_url', 'is', null),
    supabase
      .from('messages')
      .select('content')
      .eq('channel_id', channelId)
      .not('content', 'is', null),
  ])

  const media = (files ?? []).filter((file) => isMediaFile(file.file_name ?? file.file_url ?? '')).length
  const docs = (files ?? []).length - media
  const links = (messages ?? []).reduce((total, message) => total + countLinks(message.content ?? ''), 0)

  return { members: members ?? 0, media, docs, links }
}

function isMediaFile(value: string) {
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif|mp4|webm|ogg|mov|m4v|mp3|wav|m4a|aac|flac|oga)(\?.*)?$/i.test(value)
}

function countLinks(value: string) {
  return value.match(/https?:\/\/\S+/g)?.length ?? 0
}

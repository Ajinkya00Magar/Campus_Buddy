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

export const MESSAGE_PAGE_SIZE = 50

/**
 * Loads a page of messages newest-first from the DB, then returns them in
 * ascending (display) order. Pass `before` (an ISO created_at cursor) to
 * fetch the page immediately older than what you already have.
 */
export async function getMessages(
  channelId: string,
  opts: { before?: string; limit?: number } = {}
): Promise<Message[]> {
  const supabase = createClient()
  const limit = opts.limit ?? MESSAGE_PAGE_SIZE
  let query = supabase
    .from('messages')
    .select('*, users:users!messages_sender_id_fkey(name, avatar_url, role)')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (opts.before) query = query.lt('created_at', opts.before)

  const { data } = await query
  return (data ?? []).reverse()
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
    .select('*, users:users!messages_sender_id_fkey(name, avatar_url, role)')
    .single()

  if (data && payload.content) {
    // Parse @mentions (e.g. @UserName)
    const mentions = payload.content.match(/@(\w+)/g)
    if (mentions && mentions.length > 0) {
      // Get all users in the channel to match names to IDs
      const { data: members } = await supabase
        .from('channel_members')
        .select('user_id, users(name)')
        .eq('channel_id', payload.channel_id)

      if (members) {
        const uniqueMentions = Array.from(new Set(mentions.map(m => m.slice(1).toLowerCase())))
        const isEveryone = uniqueMentions.includes('everyone')
        
        const notificationsToInsert = []

        if (isEveryone) {
          // Notify everyone in the channel except the sender
          for (const member of members) {
            if (member.user_id !== payload.sender_id) {
              notificationsToInsert.push({
                user_id: member.user_id,
                title: 'Channel Announcement',
                body: `${data.users?.name || 'Someone'} mentioned @everyone: "${payload.content.substring(0, 50)}${payload.content.length > 50 ? '...' : ''}"`,
                type: 'info',
                link: `/channels/${payload.channel_id}`
              })
            }
          }
        } else {
          // For each specifically mentioned user, create a notification
          for (const mention of uniqueMentions) {
            const mentionedMember = members.find((m: any) => m.users?.name?.toLowerCase() === mention)
            if (mentionedMember && mentionedMember.user_id !== payload.sender_id) {
              notificationsToInsert.push({
                user_id: mentionedMember.user_id,
                title: 'New Mention',
                body: `${data.users?.name || 'Someone'} mentioned you: "${payload.content.substring(0, 50)}${payload.content.length > 50 ? '...' : ''}"`,
                type: 'message',
                link: `/channels/${payload.channel_id}`
              })
            }
          }
        }

        if (notificationsToInsert.length > 0) {
          const { data: inserted } = await supabase
            .from('notifications')
            .insert(notificationsToInsert)
            .select('id')
          if (inserted && inserted.length > 0) {
            // Fan out Web Push for recipients whose browser/app is closed.
            const { triggerPush } = await import('@/services/push.service')
            triggerPush(inserted.map((n) => n.id))
          }
        }
      }
    }
  }

  return { data, error }
}

export async function updateMessage(messageId: string, content: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .update({ content, edited_at: new Date().toISOString() })
    .eq('id', messageId)
    .select('*, users:users!messages_sender_id_fkey(name, avatar_url, role)')
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

/** Delete for everyone: soft-delete (tombstone) + strip content. Syncs via realtime UPDATE. */
export async function deleteMessageForEveryone(messageId: string, userId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('messages')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      content: null,
      file_url: null,
      file_name: null,
      is_pinned: false,
    })
    .eq('id', messageId)
  return { error }
}

/** Delete for me: hide the message for this user only (per-device sync via DB). */
export async function deleteMessageForMe(userId: string, messageId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('hidden_messages')
    .upsert({ user_id: userId, message_id: messageId }, { onConflict: 'user_id,message_id' })
  return { error }
}

export async function getHiddenMessageIds(userId: string, channelId?: string): Promise<string[]> {
  const supabase = createClient()
  let query = supabase
    .from('hidden_messages')
    .select('message_id, messages!inner(channel_id)')
    .eq('user_id', userId)
  if (channelId) query = query.eq('messages.channel_id', channelId)
  const { data } = await query
  return (data ?? []).map((row) => row.message_id as string)
}

export async function pinMessage(messageId: string, pin: boolean) {
  const supabase = createClient()
  const { error } = await supabase
    .from('messages')
    .update({ is_pinned: pin })
    .eq('id', messageId)
  return { error }
}

export const MAX_CHANNEL_FILE_BYTES = 20 * 1024 * 1024 // 20 MB
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB
const AVATAR_MIME = /^image\/(png|jpe?g|webp|gif|avif)$/i

function sanitizeExt(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? 'bin'
  return ext.replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin'
}

export async function uploadFile(file: File, channelId: string) {
  if (file.size > MAX_CHANNEL_FILE_BYTES) {
    return { url: null, error: { message: `File is too large (max ${Math.round(MAX_CHANNEL_FILE_BYTES / 1024 / 1024)} MB).` } as { message: string } }
  }
  const supabase = createClient()
  const path = `${channelId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${sanitizeExt(file.name)}`
  const { error } = await supabase.storage
    .from('channel-files')
    .upload(path, file, { contentType: file.type || undefined })
  if (error) return { url: null, error }
  const { data } = supabase.storage.from('channel-files').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

export async function uploadAvatar(file: File, userId: string) {
  if (!AVATAR_MIME.test(file.type)) {
    return { url: null, error: { message: 'Avatar must be a PNG, JPG, WEBP, GIF or AVIF image.' } as { message: string } }
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { url: null, error: { message: `Avatar is too large (max ${Math.round(MAX_AVATAR_BYTES / 1024 / 1024)} MB).` } as { message: string } }
  }
  const supabase = createClient()
  const path = `${userId}/${Date.now()}.${sanitizeExt(file.name)}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type || undefined })

  if (error) return { url: null, error }
  
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  
  // Update the user's profile with the new avatar URL
  const { error: profileError } = await supabase
    .from('users')
    .update({ avatar_url: data.publicUrl })
    .eq('id', userId)
    
  return { url: data.publicUrl, error: profileError }
}

export async function deleteAvatar(userId: string) {
  const supabase = createClient()

  // 1. Remove the stored objects under this user's folder (avoids orphans).
  const { data: files } = await supabase.storage.from('avatars').list(userId)
  if (files && files.length > 0) {
    await supabase.storage
      .from('avatars')
      .remove(files.map((f) => `${userId}/${f.name}`))
  }

  // 2. Clear the profile URL.
  const { error: profileError } = await supabase
    .from('users')
    .update({ avatar_url: null })
    .eq('id', userId)

  return { error: profileError }
}

export async function createChannel(payload: {
  name: string
  description?: string
  type: string
  department?: string
  year?: number
  is_private?: boolean
  post_policy?: 'everyone' | 'staff'
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

export async function addChannelMember(channelId: string, userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('channel_members')
    .insert({ channel_id: channelId, user_id: userId })
    .select()
    .single()
  return { data, error }
}

export async function removeChannelMember(channelId: string, userId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('channel_members')
    .delete()
    .eq('channel_id', channelId)
    .eq('user_id', userId)
  return { error }
}

export async function getChannelMembers(channelId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('channel_members')
    .select('*, users(id, name, email, role, avatar_url)')
    .eq('channel_id', channelId)
  return { data, error }
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
  // Multiple distinct emojis per user are allowed; toggle just this emoji.
  const { data: existing } = await supabase
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('id', existing.id)
    return { error }
  }

  const { error } = await supabase
    .from('message_reactions')
    .insert({ message_id: messageId, user_id: userId, emoji })
  return { error }
}

export async function voteOnPoll(
  pollId: string,
  userId: string,
  optionIdx: number
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('poll_votes')
    .upsert(
      { poll_id: pollId, user_id: userId, option_idx: optionIdx },
      { onConflict: 'poll_id,user_id' }
    )
    .select()
    .single()
  return { data, error }
}

// ── Bookmarks (starred messages, DB-backed so they sync across devices) ──

export async function getBookmarkedMessageIds(userId: string, channelId?: string): Promise<string[]> {
  const supabase = createClient()
  let query = supabase
    .from('bookmarks')
    .select('message_id, messages!inner(channel_id)')
    .eq('user_id', userId)
  if (channelId) query = query.eq('messages.channel_id', channelId)
  const { data } = await query
  return (data ?? []).map((row) => row.message_id as string)
}

export async function toggleBookmark(userId: string, messageId: string) {
  const supabase = createClient()
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('message_id', messageId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('bookmarks').delete().eq('id', existing.id)
    return { error, starred: false }
  }

  const { error } = await supabase.from('bookmarks').insert({ user_id: userId, message_id: messageId })
  return { error, starred: true }
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

export async function getUserChannelMembers(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('channel_members')
    .select('*')
    .eq('user_id', userId)
  return { data, error }
}

export async function updateChannelMemberPrefs(channelId: string, userId: string, payload: { last_read_at?: string, muted?: boolean }) {
  const supabase = createClient()
  // Upsert only the keys we're changing; existing columns (joined_at) are
  // preserved by the DB on conflict, so no extra read round-trip is needed.
  const { data, error } = await supabase
    .from('channel_members')
    .upsert(
      { channel_id: channelId, user_id: userId, ...payload },
      { onConflict: 'channel_id,user_id', ignoreDuplicates: false }
    )
    .select()
    .single()
  return { data, error }
}

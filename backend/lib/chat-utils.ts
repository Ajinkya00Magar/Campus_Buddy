import type { Message, Poll, MessageReaction } from '@/types'

export type ChatFilter = 'all' | 'media' | 'docs' | 'links' | 'starred'
export type FileKind = 'image' | 'pdf' | 'video' | 'audio' | 'office' | 'document'

export type ReactionSummary = {
  emoji: string
  count: number
  names: string[]
  reactedByMe: boolean
}

export type ChatTimelineItem =
  | { id: string; kind: 'message'; createdAt: string; message: Message }
  | { id: string; kind: 'poll'; createdAt: string; poll: Poll }

export type MessageContextMenuState = {
  x: number
  y: number
  message: Message
  isMine: boolean
  isStarred: boolean
}

export function filterMessages(
  messages: Message[],
  filter: ChatFilter,
  query: string,
  starredIds: string[]
) {
  const normalizedQuery = query.trim().toLowerCase()

  return messages.filter((message) => {
    const value = `${message.content ?? ''} ${message.file_name ?? ''} ${message.users?.name ?? ''}`.toLowerCase()
    if (normalizedQuery && !value.includes(normalizedQuery)) return false

    if (filter === 'media') {
      if (!message.file_url) return false
      const kind = getFileKind(message.file_name ?? '', message.file_url)
      return kind === 'image' || kind === 'video' || kind === 'audio'
    }
    if (filter === 'docs') {
      if (!message.file_url) return false
      const kind = getFileKind(message.file_name ?? '', message.file_url)
      return kind === 'document' || kind === 'office' || kind === 'pdf'
    }
    if (filter === 'links') return extractLinks(message.content ?? '').length > 0
    if (filter === 'starred') return starredIds.includes(message.id)
    return true
  })
}

export function filterPolls(polls: Poll[], filter: ChatFilter, query: string) {
  if (filter !== 'all') return []
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return polls

  return polls.filter((poll) => {
    const searchable = [poll.question, ...poll.options].join(' ').toLowerCase()
    return searchable.includes(normalizedQuery)
  })
}

export function groupReactions(reactions: MessageReaction[], currentUserId?: string) {
  const result = new Map<string, ReactionSummary[]>()

  for (const reaction of reactions) {
    const existing = result.get(reaction.message_id) ?? []
    const summary = existing.find((item) => item.emoji === reaction.emoji)
    const name = reaction.users?.name ?? 'Someone'

    if (summary) {
      summary.count += 1
      summary.names.push(name)
      summary.reactedByMe = summary.reactedByMe || reaction.user_id === currentUserId
    } else {
      existing.push({
        emoji: reaction.emoji,
        count: 1,
        names: [name],
        reactedByMe: reaction.user_id === currentUserId,
      })
    }

    result.set(reaction.message_id, existing)
  }

  return result
}

export function extractLinks(value: string) {
  return value.match(/https?:\/\/\S+/g) ?? []
}

export function starredStorageKey(channelId: string, userId: string) {
  return `campus-buddy:starred:${channelId}:${userId}`
}

export function getFileKind(fileName: string, url: string): FileKind {
  const value = `${fileName} ${url}`.toLowerCase().split('?')[0]
  if (/\.(png|jpe?g|gif|webp|svg|bmp|avif)$/.test(value)) return 'image'
  if (/\.pdf$/.test(value)) return 'pdf'
  if (/\.(mp4|webm|ogg|mov|m4v)$/.test(value)) return 'video'
  if (/\.(mp3|wav|m4a|aac|flac|oga)$/.test(value)) return 'audio'
  if (/\.(doc|docx|ppt|pptx|xls|xlsx)$/.test(value)) return 'office'
  return 'document'
}

export function previewLabel(fileName: string) {
  const kind = getFileKind(fileName, fileName)
  if (kind === 'image') return 'Image preview'
  if (kind === 'pdf') return 'PDF preview'
  if (kind === 'video') return 'Video preview'
  if (kind === 'audio') return 'Audio preview'
  if (kind === 'office') return 'Office document preview'
  return 'Downloadable file'
}

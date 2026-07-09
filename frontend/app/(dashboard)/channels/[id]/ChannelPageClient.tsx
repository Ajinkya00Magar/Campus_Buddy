'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { createClient as createBrowserSupabase } from '@/lib/supabase/client'
import { reportMessage } from '@/services/moderation.service'
import { useMessages } from '@/hooks/useMessages'
import { usePresence } from '@/hooks/usePresence'
import {
  createPoll,
  deleteMessageForEveryone,
  deleteMessageForMe,
  getHiddenMessageIds,
  getBookmarkedMessageIds,
  getChannelMembers,
  getChannelPolls,
  getChannelStats,
  getMessageReactions,
  pinMessage,
  sendMessage,
  toggleBookmark,
  toggleMessageReaction,
  updateMessage,
  uploadFile,
  voteOnPoll,
  updateChannelMemberPrefs,
} from '@/services/channels.service'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  Briefcase,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Contact,
  Copy,
  Edit3,
  Download,
  File as FileIcon,
  FileText,
  Flag,
  Forward,
  GraduationCap,
  Headphones,
  Hash,
  Image as ImageIcon,
  Images,
  Info,
  Link as LinkIcon,
  Loader2,
  Lock as LockIcon,
  Menu,
  Mic,
  Music,
  Pin,
  PinOff,
  Plus,
  Reply,
  Save,
  Search,
  Send,
  Share2,
  Sparkles,
  SmilePlus,
  SquareCheck,
  Star,
  Trophy,
  Trash2,
  Video,
  X,
} from 'lucide-react'
import { getInitials, getRoleBadgeColor, timeAgo, cn } from '@/lib/utils'
import type { Channel, ChannelStats, ChannelType, Message, MessageReaction, Poll, User } from '@/types'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

const typeMeta: Record<ChannelType, { icon: ReactNode; label: string; tone: string }> = {
  academic: {
    icon: <GraduationCap className="h-4 w-4" />,
    label: 'Academic',
    tone: 'from-cyan-500 to-blue-600',
  },
  subject: {
    icon: <BookOpen className="h-4 w-4" />,
    label: 'Subject',
    tone: 'from-emerald-500 to-teal-600',
  },
  club: {
    icon: <Trophy className="h-4 w-4" />,
    label: 'Club',
    tone: 'from-violet-500 to-fuchsia-600',
  },
  official: {
    icon: <Briefcase className="h-4 w-4" />,
    label: 'Official',
    tone: 'from-rose-500 to-orange-600',
  },
}

const yearLabels: Record<number, string> = {
  1: 'First Year',
  2: 'Second Year',
  3: 'Third Year',
  4: 'Fourth Year',
}

const quickReactions = ['👍', '❤️', '😂', '😮', '🙏']
const emojiPalette = [
  {
    label: 'Smileys',
    emojis: ['😀', '😄', '😂', '😊', '😍', '😘', '😎', '🥳', '😔', '😢', '😡', '😮'],
  },
  {
    label: 'Gestures',
    emojis: ['👍', '👎', '👏', '🙌', '🙏', '🤝', '✌️', '👌', '💪', '🤞', '👋', '🤟'],
  },
  {
    label: 'Campus',
    emojis: ['📚', '📝', '🎓', '💻', '🧪', '📌', '📢', '🏆', '☕', '🚌', '📅', '✅'],
  },
  {
    label: 'Symbols',
    emojis: ['❤️', '🔥', '⭐', '✨', '💯', '⚠️', '❓', '❗', '➕', '➡️', '🔔', '📎'],
  },
]
const defaultStats: ChannelStats = { members: 0, media: 0, docs: 0, links: 0 }
const AI_ENABLED = process.env.NEXT_PUBLIC_AI_ENABLED === 'true'

import {
  type ChatFilter,
  type MessageContextMenuState,
  type ChatTimelineItem,
  type FileKind,
  type ReactionSummary,
  filterMessages,
  filterPolls,
  groupReactions,
  getFileKind,
  extractLinks,
  previewLabel,
} from '@/lib/chat-utils'
import {
  EmptyState,
  FilePreview,
  InfoMetric,
  InfoSection,
  MessageSkeleton,
  NoResults,
} from '@/components/channels/chat/UIComponents'
import { ChannelInfoPanel } from '@/components/channels/chat/ChannelInfoPanel'
import { PollTimelineItem } from '@/components/channels/chat/PollComponents'
import { ChatFilters } from '@/components/channels/chat/ChatFilters'
import { MessageContextMenu } from '@/components/channels/chat/MessageContextMenu'
import { MessageList, PlusAttachmentMenu, EmojiPaletteMenu } from '@/components/channels/chat/MessageList'
import { AudioRecorder } from '@/components/channels/chat/AudioRecorder'
import { shareContent, channelShareUrl } from '@/utils/share'

export default function ChannelPageClient({
  channel,
  currentUser,
  allChannels,
}: {
  channel: Channel
  currentUser: User | null
  allChannels: Channel[]
}) {
  const { toast } = useToast()
  const supabase = useMemo(() => createBrowserSupabase(), [])
  const { messages, loading, loadingOlder, hasMore, loadOlder, bottomRef, setMessages, scrollToBottom } = useMessages(channel.id)
  const presenceUser = useMemo(
    () => (currentUser ? { id: currentUser.id, name: currentUser.name } : null),
    [currentUser]
  )
  const { onlineCount, typingUsers, sendTyping, stopTyping } = usePresence(channel.id, presenceUser)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  // Remembers scroll geometry across a "load older" prepend so we can keep
  // the viewport anchored on the same message instead of jumping.
  const prevScrollRef = useRef<{ height: number; top: number } | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editing, setEditing] = useState<Message | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all')
  const [showInfo, setShowInfo] = useState(false)
  const [starredIds, setStarredIds] = useState<string[]>([])
  const [reactions, setReactions] = useState<MessageReaction[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [stats, setStats] = useState<ChannelStats>(defaultStats)
  const [recording, setRecording] = useState(false)
  const [showRecorder, setShowRecorder] = useState(false)
  const [showPollForm, setShowPollForm] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [creatingPoll, setCreatingPoll] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [channelMembers, setChannelMembers] = useState<any[]>([])
  const [mentionQuery, setMentionQuery] = useState<{ query: string, startIdx: number } | null>(null)
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0)
  const [reportTarget, setReportTarget] = useState<Message | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [summary, setSummary] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [floatingDate, setFloatingDate] = useState<string | null>(null)
  const dateHideTimer = useRef<number | null>(null)
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null)
  const [deleting, setDeleting] = useState(false)

  const documentRef = useRef<HTMLInputElement>(null)
  const mediaRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Exclude messages this user deleted-for-me.
  const hiddenSet = useMemo(() => new Set(hiddenIds), [hiddenIds])
  const visibleMessages = useMemo(() => messages.filter((m) => !hiddenSet.has(m.id)), [messages, hiddenSet])

  const pinned = visibleMessages.find((m) => m.is_pinned)
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'professor' || currentUser?.role === 'cr'
  const canPin = isStaff
  // Announcement-only channels (post_policy === 'staff') accept posts from staff only.
  const canPost = isStaff || channel.post_policy !== 'staff'
  const meta = typeMeta[channel.type]
  const reactionGroups = useMemo(() => groupReactions(reactions, currentUser?.id), [reactions, currentUser?.id])
  const messageById = useMemo(() => new Map(visibleMessages.map((message) => [message.id, message])), [visibleMessages])
  const filteredMessages = useMemo(
    () => filterMessages(visibleMessages, activeFilter, searchQuery, starredIds),
    [visibleMessages, activeFilter, searchQuery, starredIds]
  )
  const filteredPolls = useMemo(
    () => filterPolls(polls, activeFilter, searchQuery),
    [polls, activeFilter, searchQuery]
  )
  const timelineItems = useMemo<ChatTimelineItem[]>(
    () => [
      ...filteredMessages.map((message) => ({
        id: `message-${message.id}`,
        kind: 'message' as const,
        createdAt: message.created_at,
        message,
      })),
      ...filteredPolls.map((poll) => ({
        id: `poll-${poll.id}`,
        kind: 'poll' as const,
        createdAt: poll.created_at,
        poll,
      })),
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [filteredMessages, filteredPolls]
  )
  const mediaItems = useMemo(() => visibleMessages.filter((message) => {
    if (!message.file_url) return false
    const kind = getFileKind(message.file_name ?? '', message.file_url)
    return kind === 'image' || kind === 'video' || kind === 'audio'
  }), [visibleMessages])
  const docItems = useMemo(() => visibleMessages.filter((message) => message.file_url && ['document', 'office', 'pdf'].includes(getFileKind(message.file_name ?? '', message.file_url))), [visibleMessages])
  const linkItems = useMemo(() => visibleMessages.flatMap((message) => extractLinks(message.content ?? '').map((url) => ({ url, message }))), [visibleMessages])

  const mentionSuggestions = useMemo(() => {
    if (!mentionQuery) return []
    const query = mentionQuery.query.toLowerCase()
    
    // Add "everyone" pseudo-user
    const everyoneObj = { users: { id: 'everyone', name: 'everyone', role: 'system', avatar_url: null } }
    
    const candidates = [
      everyoneObj,
      ...channelMembers.filter(m => m.user_id !== currentUser?.id)
    ]
    
    return candidates
      .filter(m => m.users?.name?.toLowerCase().includes(query))
      .slice(0, 10) // Limit to 10
  }, [mentionQuery, channelMembers, currentUser?.id])

  const formatDateLabel = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
  }

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget

    // Infinite history
    if (el.scrollTop <= 80 && hasMore && !loadingOlder) {
      prevScrollRef.current = { height: el.scrollHeight, top: el.scrollTop }
      loadOlder()
    }

    // Scroll-to-bottom button
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollDown(distanceFromBottom > 240)

    // Floating date pill — date of the topmost visible message
    const rows = el.querySelectorAll<HTMLElement>('.chat-message-row[data-ts]')
    const containerTop = el.getBoundingClientRect().top
    for (const row of rows) {
      if (row.getBoundingClientRect().bottom >= containerTop + 8) {
        const ts = row.getAttribute('data-ts')
        if (ts) setFloatingDate(formatDateLabel(ts))
        break
      }
    }
    if (dateHideTimer.current) window.clearTimeout(dateHideTimer.current)
    dateHideTimer.current = window.setTimeout(() => setFloatingDate(null), 1400)
  }

  // After a "load older" prepend, keep the viewport on the same message.
  useLayoutEffect(() => {
    const el = scrollContainerRef.current
    if (!el || !prevScrollRef.current) return
    const delta = el.scrollHeight - prevScrollRef.current.height
    if (delta > 0) el.scrollTop = prevScrollRef.current.top + delta
    prevScrollRef.current = null
  }, [messages.length])

  useEffect(() => {
    if (!currentUser) return
    let active = true
    getBookmarkedMessageIds(currentUser.id, channel.id).then((ids) => {
      if (active) setStarredIds(ids)
    })
    getHiddenMessageIds(currentUser.id, channel.id).then((ids) => {
      if (active) setHiddenIds(ids)
    })
    return () => { active = false }
  }, [channel.id, currentUser])

  useEffect(() => {
    if (!currentUser) return
    let active = true
    const fetchMembership = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data } = await supabase.from('channel_members').select('muted').eq('channel_id', channel.id).eq('user_id', currentUser.id).maybeSingle()
      if (active && data) setIsMuted(data.muted)
    }
    fetchMembership()
    return () => { active = false }
  }, [channel.id, currentUser])

  useEffect(() => {
    let active = true
    const refreshReactions = async () => {
      const next = await getMessageReactions(channel.id)
      if (active) setReactions(next)
    }
    const refreshRest = async () => {
      const [nextPolls, nextStats, membersRes] = await Promise.all([
        getChannelPolls(channel.id),
        getChannelStats(channel.id),
        getChannelMembers(channel.id),
      ])
      if (!active) return
      setPolls(nextPolls as Poll[])
      setStats(nextStats)
      if (membersRes.data) setChannelMembers(membersRes.data)
    }

    refreshReactions()
    refreshRest()

    // Reactions/poll votes are realtime; a scoped refetch keeps the joined
    // author metadata (needed for tooltips) accurate without blind polling.
    let scheduled = false
    const scheduleReactionRefresh = () => {
      if (scheduled) return
      scheduled = true
      window.setTimeout(() => { scheduled = false; refreshReactions() }, 250)
    }
    const suffix = Math.random().toString(36).slice(2, 8)
    const live = supabase
      .channel(`chat-side:${channel.id}:${suffix}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, scheduleReactionRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => { if (active) refreshRest() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls', filter: `channel_id=eq.${channel.id}` }, () => { if (active) refreshRest() })
      .subscribe()

    // Low-frequency fallback for stats/members (membership changes are rare).
    const interval = window.setInterval(refreshRest, 60000)
    return () => {
      active = false
      window.clearInterval(interval)
      supabase.removeChannel(live)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id])

  useEffect(() => {
    if (!currentUser) return
    const markRead = async () => {
      await updateChannelMemberPrefs(channel.id, currentUser.id, { last_read_at: new Date().toISOString() })
    }
    // Small debounce to avoid spamming the database
    const timeout = setTimeout(markRead, 1000)
    return () => clearTimeout(timeout)
  }, [channel.id, currentUser, messages.length])

  const handleToggleMute = async (muted: boolean) => {
    if (!currentUser) return
    setIsMuted(muted)
    await updateChannelMemberPrefs(channel.id, currentUser.id, { muted })
  }

  const handleSend = async () => {
    const content = text.trim()
    if (!content || !currentUser || sending) return
    stopTyping()

    if (editing) {
      setSending(true)
      const { data, error } = await updateMessage(editing.id, content)
      setSending(false)

      if (error) {
        toast({ title: 'Edit failed', description: error.message, variant: 'destructive' })
        return
      }

      if (data) {
        setMessages((prev) => prev.map((message) => message.id === editing.id ? data : message))
      }
      setEditing(null)
      setText('')
      return
    }

    const tempId = `pending-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      channel_id: channel.id,
      sender_id: currentUser.id,
      content,
      is_pinned: false,
      reply_to: replyTo?.id,
      created_at: new Date().toISOString(),
      users: {
        name: currentUser.name,
        avatar_url: currentUser.avatar_url,
        role: currentUser.role,
      },
    }

    setText('')
    setReplyTo(null)
    setSending(true)
    setMessages((prev) => [...prev, optimistic])
    scrollToBottom()

    const { data, error } = await sendMessage({
      channel_id: channel.id,
      sender_id: currentUser.id,
      content,
      reply_to: replyTo?.id,
    })

    setSending(false)
    if (error) {
      setMessages((prev) => prev.filter((message) => message.id !== tempId))
      setText(content)
      toast({ title: 'Failed to send', description: error.message, variant: 'destructive' })
      return
    }

    if (data) {
      setMessages((prev) => prev.map((message) => message.id === tempId ? data : message))
      scrollToBottom()
    }
  }

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentUser) return

    await shareFile(file)
    event.target.value = ''
  }

  const shareFile = async (file: File) => {
    if (!currentUser) return

    setUploading(true)
    setUploadName(file.name)
    const { url, error } = await uploadFile(file, channel.id)

    if (url) {
      await sendMessage({
        channel_id: channel.id,
        sender_id: currentUser.id,
        file_url: url,
        file_name: file.name,
      })
      toast({ title: 'File shared', description: previewLabel(file.name) })
    } else {
      toast({ title: 'Upload failed', description: error?.message, variant: 'destructive' })
    }

    setUploading(false)
    setUploadName('')
  }

  const handlePin = async (msgId: string, currentPin: boolean) => {
    if (msgId.startsWith('pending-')) return
    await pinMessage(msgId, !currentPin)
    setMessages((prev) =>
      prev.map((message) =>
        message.id === msgId
          ? { ...message, is_pinned: !currentPin }
          : { ...message, is_pinned: false }
      )
    )
  }

  const handleReply = (message: Message) => {
    setEditing(null)
    setReplyTo(message)
    setText('')
  }

  const handleEdit = (message: Message) => {
    setReplyTo(null)
    setEditing(message)
    setText(message.content ?? '')
  }

  const handleDelete = (message: Message) => {
    if (message.id.startsWith('pending-')) return
    setDeleteTarget(message)
  }

  const DELETE_EVERYONE_WINDOW_MS = 15 * 60 * 1000

  const canDeleteForEveryone = (message: Message | null) => {
    if (!message || !currentUser) return false
    const isMine = message.sender_id === currentUser.id
    const withinWindow = Date.now() - new Date(message.created_at).getTime() < DELETE_EVERYONE_WINDOW_MS
    return (isMine && withinWindow) || isStaff
  }

  const handleDeleteForEveryone = async () => {
    if (!deleteTarget || !currentUser || deleting) return
    setDeleting(true)
    const { error } = await deleteMessageForEveryone(deleteTarget.id, currentUser.id)
    setDeleting(false)
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
      return
    }
    // Optimistic tombstone (realtime UPDATE will confirm for everyone else).
    setMessages((prev) => prev.map((m) => m.id === deleteTarget.id
      ? { ...m, deleted_at: new Date().toISOString(), content: null, file_url: undefined, file_name: undefined, is_pinned: false }
      : m))
    setDeleteTarget(null)
  }

  const handleDeleteForMe = async () => {
    if (!deleteTarget || !currentUser || deleting) return
    setDeleting(true)
    const target = deleteTarget
    setHiddenIds((prev) => prev.includes(target.id) ? prev : [...prev, target.id])
    setDeleteTarget(null)
    const { error } = await deleteMessageForMe(currentUser.id, target.id)
    setDeleting(false)
    if (error) {
      setHiddenIds((prev) => prev.filter((id) => id !== target.id))
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    }
  }

  const handleCopy = async (message: Message) => {
    const value = message.content || message.file_url
    if (!value) return
    await navigator.clipboard.writeText(value)
    toast({ title: 'Copied' })
  }

  const handleReport = (message: Message) => {
    if (message.id.startsWith('pending-')) return
    setReportReason('')
    setReportTarget(message)
  }

  const handleSummarize = async () => {
    setSummaryOpen(true)
    setSummarizing(true)
    setSummary('')
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: channel.id }),
      })
      const data = await res.json().catch(() => null)
      setSummary(
        data?.summary
          ? data.summary
          : data?.reason === 'ai-not-configured'
            ? 'AI summaries aren’t enabled yet.'
            : 'Could not generate a summary right now.'
      )
    } catch {
      setSummary('Network error — please try again.')
    } finally {
      setSummarizing(false)
    }
  }

  const submitReport = async () => {
    if (!reportTarget || !currentUser || reporting) return
    setReporting(true)
    const { error, duplicate } = await reportMessage(reportTarget.id, currentUser.id, reportReason)
    setReporting(false)
    if (error) {
      toast({ title: 'Could not submit report', description: error.message, variant: 'destructive' })
      return
    }
    setReportTarget(null)
    setReportReason('')
    toast({
      title: duplicate ? 'Already reported' : 'Reported to moderators',
      description: duplicate ? 'You have already flagged this message.' : 'Thanks — our team will review it.',
    })
  }

  const handleStar = async (messageId: string) => {
    if (!currentUser || messageId.startsWith('pending-')) return
    const wasStarred = starredIds.includes(messageId)
    // Optimistic toggle
    setStarredIds((prev) =>
      wasStarred ? prev.filter((id) => id !== messageId) : [...prev, messageId]
    )
    const { error } = await toggleBookmark(currentUser.id, messageId)
    if (error) {
      setStarredIds((prev) =>
        wasStarred ? [...prev, messageId] : prev.filter((id) => id !== messageId)
      )
      toast({ title: 'Could not update star', description: error.message, variant: 'destructive' })
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser || messageId.startsWith('pending-')) return
    const { error } = await toggleMessageReaction(messageId, currentUser.id, emoji)
    if (error) {
      toast({ title: 'Reaction failed', description: error.message, variant: 'destructive' })
      return
    }
    setReactions(await getMessageReactions(channel.id))
  }

  const jumpToMessage = (messageId: string) => {
    const el = document.getElementById(`message-${messageId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Brief highlight effect
      const bubble = el.querySelector('.group\\/message')
      if (bubble) {
        bubble.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
        setTimeout(() => bubble.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 2000)
      }
    }
  }

  const handleVote = async (pollId: string, optionIdx: number) => {
    if (!currentUser) return

    setPolls((prev) =>
      prev.map((poll) => {
        if (poll.id !== pollId) return poll
        const votes = poll.poll_votes ?? []
        const existing = votes.find((vote) => vote.user_id === currentUser.id)
        const nextVotes = existing
          ? votes.map((vote) =>
              vote.user_id === currentUser.id ? { ...vote, option_idx: optionIdx } : vote
            )
          : [
              ...votes,
              {
                id: `pending-${Date.now()}`,
                poll_id: pollId,
                user_id: currentUser.id,
                option_idx: optionIdx,
                voted_at: new Date().toISOString(),
              },
            ]
        return { ...poll, poll_votes: nextVotes }
      })
    )

    const { error } = await voteOnPoll(pollId, currentUser.id, optionIdx)
    if (error) {
      toast({ title: 'Vote failed', description: error.message, variant: 'destructive' })
      setPolls((await getChannelPolls(channel.id)) as Poll[])
      return
    }
    setPolls((await getChannelPolls(channel.id)) as Poll[])
  }

  const handleVoiceNote = async () => {
    if (!currentUser) return

    if (recording) {
      recorderRef.current?.stop()
      setRecording(false)
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      toast({ title: 'Voice notes are not supported in this browser', variant: 'destructive' })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: blob.type })
        await shareFile(file)
      }

      recorder.start()
      setRecording(true)
    } catch {
      toast({ title: 'Microphone permission denied', variant: 'destructive' })
    }
  }

  const handleUnavailableTool = (label: string) => {
    toast({ title: `${label} coming soon`, description: 'The channel UI is ready for this shortcut.' })
  }

  const handleEmojiInsert = (emoji: string) => {
    const input = messageInputRef.current
    if (!input) {
      setText((value) => `${value}${emoji}`)
      return
    }

    const start = input.selectionStart ?? text.length
    const end = input.selectionEnd ?? text.length
    const next = `${text.slice(0, start)}${emoji}${text.slice(end)}`
    setText(next)

    window.setTimeout(() => {
      input.focus()
      const cursor = start + emoji.length
      input.setSelectionRange(cursor, cursor)
    }, 0)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setText(val)

    if (val.trim() && !editing) sendTyping()

    const cursor = e.target.selectionStart
    const textBeforeCursor = val.slice(0, cursor)
    
    // Find the last @ before the cursor
    const lastAtIdx = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIdx !== -1) {
      // Check if it's preceded by a space or it's the start of the string
      if (lastAtIdx === 0 || textBeforeCursor[lastAtIdx - 1] === ' ' || textBeforeCursor[lastAtIdx - 1] === '\n') {
        const query = textBeforeCursor.slice(lastAtIdx + 1)
        // Ensure no spaces in the query (only typing one word for the name)
        if (!query.includes(' ')) {
          setMentionQuery({ query, startIdx: lastAtIdx })
          setMentionSelectedIndex(0)
          return
        }
      }
    }
    
    setMentionQuery(null)
  }

  const handleMentionSelect = (username: string) => {
    if (!mentionQuery) return
    
    const before = text.slice(0, mentionQuery.startIdx)
    const after = text.slice(mentionQuery.startIdx + mentionQuery.query.length + 1)
    
    const nextText = `${before}@${username} ${after}`
    setText(nextText)
    setMentionQuery(null)
    
    // Set focus back
    window.setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus()
        const newCursor = mentionQuery.startIdx + username.length + 2 // +2 for @ and space
        messageInputRef.current.setSelectionRange(newCursor, newCursor)
      }
    }, 0)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery && mentionSuggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setMentionSelectedIndex((prev) => (prev + 1) % mentionSuggestions.length)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setMentionSelectedIndex((prev) => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length)
        return
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        const selected = mentionSuggestions[mentionSelectedIndex]
        if (selected?.users?.name) {
          handleMentionSelect(selected.users.name)
        }
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setMentionQuery(null)
        return
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const handleCreatePoll = async () => {
    if (!pollQuestion.trim() || !currentUser || creatingPoll) return
    const validOptions = pollOptions.map((option) => option.trim()).filter(Boolean)
    if (validOptions.length < 2) {
      toast({ title: 'Add at least 2 options', variant: 'destructive' })
      return
    }

    setCreatingPoll(true)
    const { data, error } = await createPoll({
      channel_id: channel.id,
      question: pollQuestion.trim(),
      options: validOptions,
      created_by: currentUser.id,
    })
    setCreatingPoll(false)

    if (error) {
      toast({ title: 'Poll failed', description: error.message, variant: 'destructive' })
      return
    }

    setShowPollForm(false)
    setPollQuestion('')
    setPollOptions(['', ''])
    if (data) {
      setPolls((prev) => prev.some((poll) => poll.id === data.id) ? prev : [...prev, { ...data, poll_votes: [] } as Poll])
    } else {
      setPolls((await getChannelPolls(channel.id)) as Poll[])
    }
    scrollToBottom()
    toast({ title: 'Poll created' })
  }

  return (
    <div className="chat-workspace relative flex h-full w-full flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center border-b bg-card px-4 shadow-sm z-30">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Hash className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-bold text-foreground">#{channel.name}</h1>
              {channel.is_private && <LockIcon className="h-3 w-3 text-muted-foreground shrink-0" />}
              <div className="hidden sm:flex items-center gap-1.5 ml-1">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                  {onlineCount > 1 ? `${onlineCount} online` : 'Live'}
                </span>
              </div>
            </div>
            <p className="hidden md:block truncate text-[11px] text-muted-foreground leading-none mt-0.5">
              {channel.description || 'Channel discussion and resources.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden h-8 items-center gap-2 rounded-md bg-muted/50 px-2.5 lg:flex border">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search history..."
              className="w-32 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground focus:w-48 transition-all"
            />
          </div>
          {AI_ENABLED && (
            <button
              onClick={handleSummarize}
              className="interactive-control flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="AI summary of recent discussion"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={async () => {
              const result = await shareContent({
                title: `#${channel.name}`,
                text: channel.description || `Join #${channel.name} on Campus Buddy`,
                url: channelShareUrl(channel.id),
              })
              if (result === 'copied') toast({ title: 'Link copied' })
              else if (result === 'failed') toast({ title: 'Could not share', variant: 'destructive' })
            }}
            className="interactive-control flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Share channel"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowInfo((value) => !value)}
            className={cn(
              "interactive-control flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              showInfo && "bg-accent text-foreground border-primary/20"
            )}
            title="Channel details"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </header>

        {pinned && (
          <button
            onClick={() => jumpToMessage(pinned.id)}
            className="flex shrink-0 w-full items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-left text-amber-900 transition hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200 z-20"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <Pin className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pinned Message</p>
              <p className="truncate text-sm font-medium">
                {pinned.content ?? pinned.file_name}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 opacity-40 group-hover:translate-x-0.5 transition" />
          </button>
        )}

        {showPollForm && (
          <div className="animate-fade-up border-b bg-muted/30 px-4 py-3 shrink-0 z-20">
            <div className="border bg-card p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  Create quick poll
                </p>
                <button onClick={() => setShowPollForm(false)} className="interactive-control h-7 w-7 text-muted-foreground hover:bg-accent hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Input
                placeholder="Poll question..."
                value={pollQuestion}
                onChange={(event) => setPollQuestion(event.target.value)}
                className="bg-background"
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(event) => {
                        const updated = [...pollOptions]
                        updated[index] = event.target.value
                        setPollOptions(updated)
                      }}
                      className="bg-background"
                    />
                    {index >= 2 && (
                      <button onClick={() => setPollOptions(pollOptions.filter((_, itemIndex) => itemIndex !== index))} className="interactive-control h-10 w-10 rounded-lg text-muted-foreground hover:bg-accent">
                        <X className="mx-auto h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                {pollOptions.length < 5 ? (
                  <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-xs font-semibold text-primary hover:underline">
                    Add option
                  </button>
                ) : <span />}
                <Button size="sm" onClick={handleCreatePoll} disabled={creatingPoll} className="gap-2">
                  {creatingPoll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Create Poll
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1 overflow-hidden relative">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden relative bg-background">
            {showInfo && (
              <div className="border-b bg-card px-4 py-2 animate-in fade-in slide-in-from-top-1 duration-200 shrink-0 z-10">
                <div className="flex flex-col gap-2">
                  <div className="flex h-8 items-center gap-2 border bg-background px-2.5 lg:hidden">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search messages"
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <ChatFilters
                    active={activeFilter}
                    onChange={setActiveFilter}
                    counts={{
                      all: messages.length + polls.length,
                      media: mediaItems.length,
                      docs: docItems.length,
                      links: linkItems.length,
                      starred: starredIds.length,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Floating date indicator */}
            {floatingDate && (
              <div className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 animate-fade-in">
                <span className="rounded-full border bg-card/95 px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm backdrop-blur">
                  {floatingDate}
                </span>
              </div>
            )}

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="relative flex-1 overflow-y-auto px-4 py-4 custom-scrollbar bg-background/50 min-h-0"
            >
              {loadingOlder && (
                <div className="mb-3 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {loading ? (
                <MessageSkeleton />
              ) : messages.length === 0 && polls.length === 0 ? (
                <EmptyState channelName={channel.name} />
              ) : timelineItems.length === 0 ? (
                <NoResults query={searchQuery} filter={activeFilter} />
              ) : (
                <MessageList
                  items={timelineItems}
                  messageById={messageById}
                  currentUserId={currentUser?.id ?? ''}
                  currentUserRole={currentUser?.role ?? 'student'}
                  canPin={canPin}
                  onPin={handlePin}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCopy={handleCopy}
                  onStar={handleStar}
                  onReact={handleReaction}
                  onReport={handleReport}
                  onVote={handleVote}
                  onJump={jumpToMessage}
                  reactionGroups={reactionGroups}
                  starredIds={starredIds}
                />
              )}
              <div ref={bottomRef} />
            </div>

            {/* Scroll-to-bottom */}
            {showScrollDown && (
              <button
                onClick={() => { scrollToBottom('smooth'); setShowScrollDown(false) }}
                aria-label="Scroll to latest messages"
                className="interactive-control absolute bottom-24 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border bg-card text-foreground shadow-md transition hover:bg-accent animate-in fade-in zoom-in-95"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            )}

            <footer className="border-t bg-card px-4 py-3 pb-safe-plus shrink-0 z-30 relative">
              {(sending || uploading || recording) && (
                <div className="animate-fade-up mb-2 flex items-center gap-2 border bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {recording ? 'Recording voice note' : uploading ? `Uploading ${uploadName}` : editing ? 'Saving edit' : 'Sending message'}
                </div>
              )}

              {typingUsers.length > 0 && (
                <div className="mb-2 flex items-center gap-2 px-1 text-xs text-muted-foreground animate-fade-in">
                  <span className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                  </span>
                  <span className="truncate">
                    {typingUsers.length === 1
                      ? `${typingUsers[0].name} is typing…`
                      : typingUsers.length === 2
                        ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing…`
                        : `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing…`}
                  </span>
                </div>
              )}

              {(replyTo || editing) && (
                <div className="animate-fade-up mb-2 flex items-center gap-2 border bg-background p-2">
                  <div className="flex h-8 w-8 items-center justify-center border bg-primary/10 text-primary">
                    {editing ? <Edit3 className="h-4 w-4" /> : <Reply className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">{editing ? 'Edit message' : `Replying to ${replyTo?.users?.name ?? 'message'}`}</p>
                    <p className="truncate text-xs text-muted-foreground">{editing?.content ?? replyTo?.content ?? replyTo?.file_name ?? 'Shared file'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setReplyTo(null)
                      setEditing(null)
                      setText('')
                    }}
                    className="interactive-control flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {!canPost ? (
                <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
                  <LockIcon className="h-4 w-4 shrink-0" />
                  <span>Only admins and faculty can post in this announcement channel.</span>
                </div>
              ) : showRecorder ? (
                <AudioRecorder
                  sending={uploading}
                  onClose={() => setShowRecorder(false)}
                  onSend={async (file) => { setShowRecorder(false); await shareFile(file) }}
                />
              ) : (
              <div className="flex items-end gap-1.5 border bg-background p-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20">
                <input ref={documentRef} type="file" className="hidden" onChange={handleFile} />
                <input ref={mediaRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
                <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
                <PlusAttachmentMenu
                  disabled={uploading || recording}
                  onDocument={() => documentRef.current?.click()}
                  onMedia={() => mediaRef.current?.click()}
                  onCamera={() => cameraRef.current?.click()}
                  onAudio={() => audioRef.current?.click()}
                  onContact={() => handleUnavailableTool('Contact sharing')}
                  onPoll={() => setShowPollForm(true)}
                  onEvent={() => handleUnavailableTool('Event sharing')}
                  onSticker={() => handleUnavailableTool('Stickers')}
                />
                <EmojiPaletteMenu onSelect={handleEmojiInsert} />
                <div className="relative flex-1">
                  {mentionQuery && mentionSuggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-1 w-64 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in zoom-in-95 duration-100 z-50">
                      <div className="max-h-[200px] overflow-y-auto p-1">
                        {mentionSuggestions.map((suggestion, idx) => (
                          <button
                            key={suggestion.user_id || 'everyone'}
                            onClick={() => handleMentionSelect(suggestion.users?.name)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                              idx === mentionSelectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <Avatar className="h-5 w-5 shrink-0">
                              <AvatarImage src={suggestion.users?.avatar_url || ''} />
                              <AvatarFallback className="text-[10px]">{getInitials(suggestion.users?.name || '?')}</AvatarFallback>
                            </Avatar>
                            <span className="truncate font-medium">{suggestion.users?.name}</span>
                            {suggestion.users?.id === 'everyone' && <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-wider font-bold">All</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <textarea
                    ref={messageInputRef}
                    className="w-full min-h-[36px] resize-none bg-transparent px-2 py-2 text-sm leading-5 outline-none placeholder:text-muted-foreground"
                    placeholder={editing ? 'Edit message' : `Message #${channel.name}`}
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setShowRecorder(true)}
                    disabled={uploading || sending}
                    className="interactive-control flex h-9 w-9 items-center justify-center text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    title="Record voice note"
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending || !text.trim()}
                    className="interactive-control flex h-9 w-9 items-center justify-center border border-primary bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    title={editing ? 'Save edit' : 'Send'}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              )}
            </footer>
          </div>

          {showInfo && (
            <ChannelInfoPanel
              channel={channel}
              stats={stats}
              mediaItems={mediaItems}
              docItems={docItems}
              linkItems={linkItems}
              starredCount={starredIds.length}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onClose={() => setShowInfo(false)}
            />
          )}
        </div>

        <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Channel summary
              </DialogTitle>
              <DialogDescription>AI digest of recent discussion in #{channel.name}.</DialogDescription>
            </DialogHeader>
            {summarizing ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Summarizing…
              </div>
            ) : (
              <p className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {summary}
              </p>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete message?</DialogTitle>
              <DialogDescription>
                {canDeleteForEveryone(deleteTarget)
                  ? 'You can delete this for everyone, or just remove it from your view.'
                  : 'This will remove the message from your view only.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              {canDeleteForEveryone(deleteTarget) && (
                <Button variant="destructive" onClick={handleDeleteForEveryone} disabled={deleting} className="w-full justify-center gap-2">
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete for everyone
                </Button>
              )}
              <Button variant="outline" onClick={handleDeleteForMe} disabled={deleting} className="w-full justify-center gap-2">
                <Trash2 className="h-4 w-4" /> Delete for me
              </Button>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting} className="w-full justify-center">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!reportTarget} onOpenChange={(o) => { if (!o) setReportTarget(null) }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Report message</DialogTitle>
              <DialogDescription>
                Flag this message for the moderation team. Reports are private.
              </DialogDescription>
            </DialogHeader>
            {reportTarget && (
              <div className="rounded-md border bg-muted/40 p-2.5 text-sm text-muted-foreground">
                <p className="line-clamp-3">{reportTarget.content ?? reportTarget.file_name ?? 'Shared file'}</p>
                <p className="mt-1 text-xs">— {reportTarget.users?.name ?? 'Unknown'}</p>
              </div>
            )}
            <Textarea
              placeholder="Why are you reporting this? (optional)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
              className="bg-background"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReportTarget(null)} disabled={reporting}>
                Cancel
              </Button>
              <Button onClick={submitReport} disabled={reporting} className="gap-2">
                {reporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                Submit report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  )
}


'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useMessages } from '@/hooks/useMessages'
import {
  createPoll,
  deleteMessage,
  getChannelPolls,
  getChannelStats,
  getMessageReactions,
  pinMessage,
  sendMessage,
  toggleMessageReaction,
  updateMessage,
  uploadFile,
  voteOnPoll,
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
  CheckCheck,
  ChevronDown,
  Contact,
  Copy,
  Edit3,
  Download,
  File as FileIcon,
  FileText,
  Forward,
  GraduationCap,
  Headphones,
  Hash,
  Image as ImageIcon,
  Images,
  Info,
  Link as LinkIcon,
  Loader2,
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
  SmilePlus,
  Sparkles,
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
type ChatFilter = 'all' | 'media' | 'docs' | 'links' | 'starred'
type MessageContextMenuState = {
  x: number
  y: number
  message: Message
  isMine: boolean
  isStarred: boolean
}
type ChatTimelineItem =
  | { id: string; kind: 'message'; createdAt: string; message: Message }
  | { id: string; kind: 'poll'; createdAt: string; poll: Poll }

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
  const { messages, loading, bottomRef, setMessages, scrollToBottom } = useMessages(channel.id)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editing, setEditing] = useState<Message | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all')
  const [showInfo, setShowInfo] = useState(true)
  const [showChannelMap, setShowChannelMap] = useState(false)
  const [starredIds, setStarredIds] = useState<string[]>([])
  const [reactions, setReactions] = useState<MessageReaction[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [stats, setStats] = useState<ChannelStats>(defaultStats)
  const [recording, setRecording] = useState(false)
  const [showPollForm, setShowPollForm] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [creatingPoll, setCreatingPoll] = useState(false)
  const documentRef = useRef<HTMLInputElement>(null)
  const mediaRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const pinned = messages.find((m) => m.is_pinned)
  const canPin = currentUser?.role === 'admin' || currentUser?.role === 'teacher'
  const meta = typeMeta[channel.type]
  const navGroups = useMemo(() => groupChannels(allChannels), [allChannels])
  const reactionGroups = useMemo(() => groupReactions(reactions, currentUser?.id), [reactions, currentUser?.id])
  const messageById = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages])
  const filteredMessages = useMemo(
    () => filterMessages(messages, activeFilter, searchQuery, starredIds),
    [messages, activeFilter, searchQuery, starredIds]
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
  const mediaItems = useMemo(() => messages.filter((message) => {
    if (!message.file_url) return false
    const kind = getFileKind(message.file_name ?? '', message.file_url)
    return kind === 'image' || kind === 'video' || kind === 'audio'
  }), [messages])
  const docItems = useMemo(() => messages.filter((message) => message.file_url && ['document', 'office', 'pdf'].includes(getFileKind(message.file_name ?? '', message.file_url))), [messages])
  const linkItems = useMemo(() => messages.flatMap((message) => extractLinks(message.content ?? '').map((url) => ({ url, message }))), [messages])

  useEffect(() => {
    if (!currentUser) return
    const stored = window.localStorage.getItem(starredStorageKey(channel.id, currentUser.id))
    setStarredIds(stored ? JSON.parse(stored) : [])
  }, [channel.id, currentUser])

  useEffect(() => {
    let active = true
    const refresh = async () => {
      const [nextReactions, nextPolls, nextStats] = await Promise.all([
        getMessageReactions(channel.id),
        getChannelPolls(channel.id),
        getChannelStats(channel.id),
      ])
      if (!active) return
      setReactions(nextReactions)
      setPolls(nextPolls as Poll[])
      setStats(nextStats)
    }

    refresh()
    const interval = window.setInterval(refresh, 10000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [channel.id, messages.length])

  const handleSend = async () => {
    const content = text.trim()
    if (!content || !currentUser || sending) return

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

  const handleDelete = async (message: Message) => {
    if (message.id.startsWith('pending-')) return
    const { error } = await deleteMessage(message.id)
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
      return
    }
    setMessages((prev) => prev.filter((item) => item.id !== message.id))
  }

  const handleCopy = async (message: Message) => {
    const value = message.content || message.file_url
    if (!value) return
    await navigator.clipboard.writeText(value)
    toast({ title: 'Copied' })
  }

  const handleStar = (messageId: string) => {
    if (!currentUser) return
    setStarredIds((prev) => {
      const next = prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
      window.localStorage.setItem(starredStorageKey(channel.id, currentUser.id), JSON.stringify(next))
      return next
    })
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

  const handleVote = async (pollId: string, optionIdx: number) => {
    if (!currentUser) return
    const { error } = await voteOnPoll(pollId, currentUser.id, optionIdx)
    if (error) {
      toast({ title: 'Vote failed', description: error.message, variant: 'destructive' })
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
    <div className="relative flex h-full -m-6 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)))]">
      {showChannelMap && (
        <button
          aria-label="Close curriculum map"
          className="absolute inset-0 z-20 bg-black/30 backdrop-blur-[1px] md:hidden"
          onClick={() => setShowChannelMap(false)}
        />
      )}
      <aside
        aria-hidden={!showChannelMap}
        className={cn(
          'absolute inset-y-0 left-0 z-30 flex w-72 shrink-0 flex-col border-r bg-card/95 shadow-2xl backdrop-blur-xl transition-transform md:relative md:z-auto md:bg-card/80 md:shadow-none md:transition-none',
          showChannelMap ? 'translate-x-0 md:flex' : 'pointer-events-none -translate-x-full md:hidden'
        )}
      >
        <div className="border-b p-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/channels" className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-primary">
              <ArrowRight className="h-3.5 w-3.5 rotate-180 transition group-hover:-translate-x-0.5" />
              Curriculum map
            </Link>
            <button
              onClick={() => setShowChannelMap(false)}
              className="interactive-control flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Hide curriculum map"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 rounded-2xl border bg-background/70 p-3">
            <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg', meta.tone)}>
              {meta.icon}
            </div>
            <p className="truncate text-sm font-extrabold text-foreground">#{channel.name}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{channel.description || meta.label}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navGroups.years.map(({ year, channels }) => (
            <div key={year}>
              <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {yearLabels[year] ?? `Year ${year}`}
              </p>
              <div className="space-y-1">
                {channels.map((item) => (
                  <ChannelNavItem key={item.id} channel={item} active={item.id === channel.id} />
                ))}
              </div>
            </div>
          ))}

          {navGroups.other.length > 0 && (
            <div>
              <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Campus</p>
              <div className="space-y-1">
                {navGroups.other.map((item) => (
                  <ChannelNavItem key={item.id} channel={item} active={item.id === channel.id} />
                ))}
              </div>
            </div>
          )}
        </nav>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="relative overflow-hidden border-b bg-card/90 px-5 py-4 shadow-sm backdrop-blur-xl">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-primary/10 to-transparent" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowChannelMap((value) => !value)}
                className="interactive-control flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background/75 text-muted-foreground hover:bg-accent hover:text-foreground"
                title={showChannelMap ? 'Hide curriculum map' : 'Show curriculum map'}
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg shadow-primary/20', meta.tone)}>
                <Hash className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-extrabold tracking-tight text-foreground">#{channel.name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full border bg-background/70 px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                    {meta.icon}
                    {meta.label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {channel.description || 'Live discussion, shared notes, pinned updates, and files.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-xl border bg-background/75 px-3 py-2 shadow-sm lg:flex">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search"
                  className="w-36 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              {channel.year && (
                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                  {yearLabels[channel.year] ?? `Year ${channel.year}`}
                </span>
              )}
              <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600">
                Live
              </span>
              <button
                onClick={() => setShowInfo((value) => !value)}
                className="interactive-control flex h-10 w-10 items-center justify-center rounded-xl border bg-background/75 text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Channel info"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {pinned && (
          <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50/90 px-5 py-3 text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-200/70 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200">
              <Pin className="h-4 w-4" />
            </div>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">
              {pinned.content ?? pinned.file_name}
            </p>
          </div>
        )}

        {showPollForm && (
          <div className="border-b bg-primary/5 px-5 py-4 animate-fade-up">
            <div className="rounded-2xl border bg-card p-4 shadow-lg shadow-primary/5">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  Create quick poll
                </p>
                <button onClick={() => setShowPollForm(false)} className="interactive-control h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
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

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="border-b bg-card/60 px-4 py-3 md:px-7">
              <div className="mx-auto flex max-w-5xl flex-col gap-3">
                <div className="flex items-center gap-2 rounded-xl border bg-background/75 px-3 py-2 shadow-sm lg:hidden">
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

            <div className="relative flex-1 overflow-y-auto px-4 py-5 md:px-7">
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
                  canPin={canPin}
                  onPin={handlePin}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCopy={handleCopy}
                  onStar={handleStar}
                  onReact={handleReaction}
                  onVote={handleVote}
                  reactionGroups={reactionGroups}
                  starredIds={starredIds}
                />
              )}
              <div ref={bottomRef} />
            </div>

            <footer className="border-t bg-card/92 px-4 py-4 shadow-[0_-18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl">
              {(sending || uploading || recording) && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border bg-primary/5 px-3 py-2 text-xs font-semibold text-primary animate-fade-up">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {recording ? 'Recording voice note' : uploading ? `Uploading ${uploadName}` : editing ? 'Saving edit' : 'Sending message'}
                </div>
              )}

              {(replyTo || editing) && (
                <div className="mx-auto mb-3 flex max-w-5xl items-center gap-3 rounded-2xl border bg-background/90 p-3 shadow-sm animate-fade-up">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {editing ? <Edit3 className="h-4 w-4" /> : <Reply className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground">{editing ? 'Edit message' : `Replying to ${replyTo?.users?.name ?? 'message'}`}</p>
                    <p className="truncate text-xs text-muted-foreground">{editing?.content ?? replyTo?.content ?? replyTo?.file_name ?? 'Shared file'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setReplyTo(null)
                      setEditing(null)
                      setText('')
                    }}
                    className="interactive-control flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="mx-auto flex max-w-5xl items-end gap-2 rounded-2xl border bg-background/85 p-2 shadow-lg shadow-primary/5 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10">
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
                <textarea
                  ref={messageInputRef}
                  className="min-h-[42px] flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
                  placeholder={editing ? 'Edit message' : `Message #${channel.name}`}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      handleSend()
                    }
                  }}
                  rows={1}
                />
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={handleVoiceNote}
                    disabled={uploading || sending}
                    className={cn(
                      'interactive-control flex h-10 w-10 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-50',
                      recording ? 'bg-red-500 text-white focus-pulse' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                    title={recording ? 'Stop recording' : 'Voice note'}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending || !text.trim()}
                    className="interactive-control flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    title={editing ? 'Save edit' : 'Send'}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
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
              onClose={() => setShowInfo(false)}
            />
          )}
        </div>
      </section>
    </div>
  )
}

function ChannelNavItem({ channel, active }: { channel: Channel; active: boolean }) {
  const meta = typeMeta[channel.type]
  return (
    <Link
      href={`/channels/${channel.id}`}
      className={cn(
        'group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition duration-200',
        active
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      <span className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
        active ? 'bg-white/18 text-white' : 'bg-primary/10 text-primary'
      )}>
        <Hash className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate">{channel.name}</span>
      {!active && <span className="opacity-0 transition group-hover:opacity-100">{meta.icon}</span>}
    </Link>
  )
}

function PlusAttachmentMenu({
  disabled,
  onDocument,
  onMedia,
  onCamera,
  onAudio,
  onContact,
  onPoll,
  onEvent,
  onSticker,
}: {
  disabled: boolean
  onDocument: () => void
  onMedia: () => void
  onCamera: () => void
  onAudio: () => void
  onContact: () => void
  onPoll: () => void
  onEvent: () => void
  onSticker: () => void
}) {
  const items = [
    { label: 'Document', icon: <FileIcon className="h-5 w-5" />, tone: 'text-indigo-500', action: onDocument },
    { label: 'Photos & videos', icon: <Images className="h-5 w-5" />, tone: 'text-sky-500', action: onMedia },
    { label: 'Camera', icon: <Camera className="h-5 w-5" />, tone: 'text-pink-500', action: onCamera },
    { label: 'Audio', icon: <Headphones className="h-5 w-5" />, tone: 'text-orange-500', action: onAudio },
    { label: 'Contact', icon: <Contact className="h-5 w-5" />, tone: 'text-cyan-500', action: onContact },
    { label: 'Poll', icon: <BarChart2 className="h-5 w-5" />, tone: 'text-amber-500', action: onPoll },
    { label: 'Event', icon: <CalendarDays className="h-5 w-5" />, tone: 'text-rose-500', action: onEvent },
    { label: 'New sticker', icon: <SmilePlus className="h-5 w-5" />, tone: 'text-emerald-500', action: onSticker },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={disabled}
          className="interactive-control flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground shadow-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          title="Add attachment"
        >
          <Plus className="h-6 w-6" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" sideOffset={12} className="w-56 rounded-3xl border bg-popover p-2 shadow-2xl">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onClick={item.action}
            className="gap-3 rounded-2xl px-3 py-3 text-sm font-bold"
          >
            <span className={item.tone}>{item.icon}</span>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function EmojiPaletteMenu({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="interactive-control hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground sm:flex"
          title="Choose emoji"
        >
          <SmilePlus className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" sideOffset={12} className="w-80 rounded-3xl border bg-popover p-3 shadow-2xl">
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {emojiPalette.map((group) => (
            <section key={group.label}>
              <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                {group.label}
              </p>
              <div className="grid grid-cols-8 gap-1">
                {group.emojis.map((emoji) => (
                  <button
                    key={`${group.label}-${emoji}`}
                    onClick={() => onSelect(emoji)}
                    className="interactive-control flex h-9 w-9 items-center justify-center rounded-xl text-xl hover:bg-accent"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MessageList({
  items,
  messageById,
  currentUserId,
  canPin,
  onPin,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  onStar,
  onReact,
  onVote,
  reactionGroups,
  starredIds,
}: {
  items: ChatTimelineItem[]
  messageById: Map<string, Message>
  currentUserId: string
  canPin: boolean
  onPin: (id: string, current: boolean) => void
  onReply: (message: Message) => void
  onEdit: (message: Message) => void
  onDelete: (message: Message) => void
  onCopy: (message: Message) => void
  onStar: (messageId: string) => void
  onReact: (messageId: string, emoji: string) => void
  onVote: (pollId: string, optionIdx: number) => void
  reactionGroups: Map<string, ReactionSummary[]>
  starredIds: string[]
}) {
  const [contextMenu, setContextMenu] = useState<MessageContextMenuState | null>(null)

  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', close)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', close)
    }
  }, [contextMenu])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      {items.map((item, index) => {
        if (item.kind === 'poll') {
          return (
            <PollTimelineItem
              key={item.id}
              poll={item.poll}
              currentUserId={currentUserId}
              onVote={onVote}
            />
          )
        }

        const msg = item.message
        const isMine = msg.sender_id === currentUserId
        const previousItem = items[index - 1]
        const previousMessage = previousItem?.kind === 'message' ? previousItem.message : null
        const showAvatar = !previousMessage || previousMessage.sender_id !== msg.sender_id
        const user = msg.users
        const isPending = msg.id.startsWith('pending-')
        const reply = msg.reply_to ? messageById.get(msg.reply_to) : null
        const groups = reactionGroups.get(msg.id) ?? []
        const isStarred = starredIds.includes(msg.id)

        return (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3 animate-message-in',
              isMine ? 'justify-end' : 'justify-start'
            )}
          >
            {!isMine && (
              <div className="w-10 shrink-0">
                {showAvatar && (
                  <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {getInitials(user?.name ?? '?')}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}

            <div className={cn('max-w-[min(720px,82%)]', isMine && 'items-end')}>
              {showAvatar && (
                <div className={cn('mb-1.5 flex items-center gap-2', isMine && 'justify-end')}>
                  <span className="text-xs font-bold text-foreground">{user?.name ?? 'You'}</span>
                  <span className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-semibold', getRoleBadgeColor(user?.role ?? 'student'))}>
                    {user?.role ?? 'student'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{isPending ? 'Sending' : timeAgo(msg.created_at)}</span>
                  {msg.edited_at && <span className="text-[11px] text-muted-foreground">edited</span>}
                  {isStarred && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                  {msg.is_pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                </div>
              )}

              <div
                onContextMenu={(event) => {
                  event.preventDefault()
                  if (isPending) return
                  setContextMenu({
                    x: Math.max(8, Math.min(event.clientX, window.innerWidth - 260)),
                    y: Math.max(8, Math.min(event.clientY, window.innerHeight - 440)),
                    message: msg,
                    isMine,
                    isStarred,
                  })
                }}
                className={cn(
                  'group/message relative overflow-hidden rounded-2xl border px-4 py-3 shadow-sm',
                  isMine
                    ? 'rounded-br-md border-primary/20 bg-primary text-primary-foreground shadow-primary/10'
                    : 'rounded-bl-md bg-card',
                  isPending && 'opacity-75'
                )}
              >
                {reply && (
                  <div className={cn('mb-2 rounded-xl border-l-4 px-3 py-2 text-xs', isMine ? 'border-white/45 bg-white/10 text-white/85' : 'border-primary/50 bg-primary/5 text-muted-foreground')}>
                    <p className={cn('font-bold', isMine ? 'text-white' : 'text-foreground')}>{reply.users?.name ?? 'Message'}</p>
                    <p className="line-clamp-2">{reply.content ?? reply.file_name ?? 'Shared file'}</p>
                  </div>
                )}

                {msg.content && (
                  <p className={cn('whitespace-pre-wrap break-words text-sm leading-relaxed', isMine ? 'text-primary-foreground' : 'text-foreground')}>
                    {msg.content}
                  </p>
                )}

                {msg.file_url && (
                  <FilePreview
                    url={msg.file_url}
                    fileName={msg.file_name ?? 'Shared file'}
                    isMine={isMine}
                  />
                )}

                {isPending && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold opacity-80">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Delivering
                  </div>
                )}

                {!isPending && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      const rect = event.currentTarget.getBoundingClientRect()
                      setContextMenu({
                        x: Math.max(8, Math.min(rect.right - 224, window.innerWidth - 260)),
                        y: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 440)),
                        message: msg,
                        isMine,
                        isStarred,
                      })
                    }}
                    className={cn(
                      'interactive-control absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full opacity-0 shadow-sm transition group-hover/message:opacity-100',
                      isMine ? 'bg-white/12 text-white/85 hover:bg-white/25 hover:text-white' : 'bg-background/85 text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                    title="Message actions"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {groups.length > 0 && (
                <div className={cn('mt-1 flex flex-wrap gap-1.5', isMine && 'justify-end')}>
                  {groups.map((group) => (
                    <button
                      key={group.emoji}
                      onClick={() => onReact(msg.id, group.emoji)}
                      className={cn(
                        'interactive-control rounded-full border bg-card px-2 py-1 text-xs font-semibold shadow-sm hover:bg-accent',
                        group.reactedByMe && 'border-primary/50 bg-primary/10 text-primary'
                      )}
                      title={group.names.join(', ')}
                    >
                      {group.emoji} {group.count}
                    </button>
                  ))}
                </div>
              )}

              {isMine && !isPending && (
                <div className="mt-1 flex justify-end text-primary">
                  <CheckCheck className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          </div>
        )
      })}
      {contextMenu && (
        <MessageContextMenu
          state={contextMenu}
          canPin={canPin}
          onClose={() => setContextMenu(null)}
          onPin={onPin}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          onCopy={onCopy}
          onStar={onStar}
          onReact={onReact}
        />
      )}
    </div>
  )
}

function MessageContextMenu({
  state,
  canPin,
  onClose,
  onPin,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  onStar,
  onReact,
}: {
  state: MessageContextMenuState
  canPin: boolean
  onClose: () => void
  onPin: (id: string, current: boolean) => void
  onReply: (message: Message) => void
  onEdit: (message: Message) => void
  onDelete: (message: Message) => void
  onCopy: (message: Message) => void
  onStar: (messageId: string) => void
  onReact: (messageId: string, emoji: string) => void
}) {
  const { message, isMine, isStarred } = state
  const menuRef = useRef<HTMLDivElement>(null)
  const reactionBarRef = useRef<HTMLDivElement>(null)
  const actionPanelRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState({ x: state.x, y: state.y, width: 320, actionMaxHeight: 360 })

  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!menu) return

    const margin = 8
    const bottomSafeGap = 84
    const visualViewport = window.visualViewport
    const viewportLeft = visualViewport?.offsetLeft ?? 0
    const viewportTop = visualViewport?.offsetTop ?? 0
    const viewportWidth = Math.min(window.innerWidth, visualViewport?.width ?? window.innerWidth)
    const viewportHeight = Math.min(window.innerHeight, visualViewport?.height ?? window.innerHeight)
    const safeLeft = viewportLeft + margin
    const safeTop = viewportTop + margin
    const safeRight = viewportLeft + viewportWidth - margin
    const safeBottom = viewportTop + viewportHeight - bottomSafeGap
    const menuWidth = Math.min(320, Math.max(224, safeRight - safeLeft))
    const reactionHeight = reactionBarRef.current?.offsetHeight ?? 46
    const gap = 4
    const actionScrollHeight = actionPanelRef.current?.scrollHeight ?? 360
    const maxAvailableHeight = Math.max(220, safeBottom - safeTop)
    const actionMaxHeight = Math.max(
      160,
      Math.min(actionScrollHeight, maxAvailableHeight - reactionHeight - gap)
    )
    const totalHeight = reactionHeight + gap + actionMaxHeight
    const maxX = Math.max(safeLeft, safeRight - menuWidth)
    const maxY = Math.max(safeTop, safeBottom - totalHeight)
    const nextX = Math.min(Math.max(safeLeft, state.x), maxX)
    const nextY = Math.min(Math.max(safeTop, state.y), maxY)

    setLayout({
      x: Number.isFinite(nextX) ? nextX : safeLeft,
      y: Number.isFinite(nextY) ? nextY : safeTop,
      width: menuWidth,
      actionMaxHeight,
    })
  }, [state.x, state.y, message.id])

  const run = (action: () => void | Promise<void>) => {
    void action()
    onClose()
  }

  const saveAs = () => {
    if (!message.file_url) return
    const link = document.createElement('a')
    link.href = message.file_url
    link.download = message.file_name ?? 'campus-buddy-file'
    link.target = '_blank'
    link.rel = 'noreferrer'
    link.click()
  }

  const share = async () => {
    const value = message.file_url ?? message.content ?? ''
    if (!value) return
    if (navigator.share) {
      await navigator.share({ title: message.file_name ?? 'Campus Buddy message', text: message.content, url: message.file_url })
    } else {
      await navigator.clipboard.writeText(value)
    }
  }

  const showInfo = () => {
    window.alert(`Sent by ${message.users?.name ?? 'Unknown'}\n${new Date(message.created_at).toLocaleString()}`)
  }

  const menuItems = [
    { label: 'Message info', icon: <Info className="h-4 w-4" />, action: showInfo, show: true },
    { label: 'Reply', icon: <Reply className="h-4 w-4" />, action: () => onReply(message), show: true },
    { label: 'Copy', icon: <Copy className="h-4 w-4" />, action: () => onCopy(message), show: true },
    { label: 'Forward', icon: <Forward className="h-4 w-4" />, action: () => navigator.clipboard.writeText(message.content ?? message.file_url ?? ''), show: true },
    { label: message.is_pinned ? 'Unpin' : 'Pin', icon: message.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />, action: () => onPin(message.id, message.is_pinned), show: canPin },
    { label: isStarred ? 'Unstar' : 'Star', icon: <Star className={cn('h-4 w-4', isStarred && 'fill-amber-400 text-amber-400')} />, action: () => onStar(message.id), show: true },
    { label: 'Select', icon: <SquareCheck className="h-4 w-4" />, action: () => onStar(message.id), show: true, divider: true },
    { label: 'Save as', icon: <Save className="h-4 w-4" />, action: saveAs, show: Boolean(message.file_url) },
    { label: 'Share', icon: <Share2 className="h-4 w-4" />, action: share, show: true },
    { label: 'Edit', icon: <Edit3 className="h-4 w-4" />, action: () => onEdit(message), show: isMine && Boolean(message.content), divider: true },
    { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, action: () => onDelete(message), show: isMine },
  ]

  const menu = (
    <div
      ref={menuRef}
      className="fixed z-[80]"
      style={{ left: layout.x, top: layout.y, width: layout.width }}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div ref={reactionBarRef} className="mb-1 flex max-w-full items-center gap-1 overflow-x-auto rounded-full border bg-popover/98 p-1 shadow-2xl backdrop-blur-xl">
        {quickReactions.map((emoji) => (
          <button
            key={emoji}
            onClick={() => run(() => onReact(message.id, emoji))}
            className="interactive-control flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-accent"
            title={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}
        <button
          onClick={() => run(() => onStar(message.id))}
          className="interactive-control flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          title="More"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <div
        ref={actionPanelRef}
        className="w-full overflow-y-auto rounded-3xl border bg-popover/98 p-2 text-popover-foreground shadow-2xl backdrop-blur-xl"
        style={{ maxHeight: layout.actionMaxHeight }}
      >
        {menuItems.filter((item) => item.show).map((item) => (
          <div key={item.label}>
            {item.divider && <div className="my-1 h-px bg-border" />}
            <button
              onClick={() => run(item.action)}
              className={cn(
                'interactive-control flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold hover:bg-accent',
                item.label === 'Delete' && 'text-destructive hover:text-destructive'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  return createPortal(menu, document.body)
}

function ChatFilters({
  active,
  counts,
  onChange,
}: {
  active: ChatFilter
  counts: Record<ChatFilter, number>
  onChange: (filter: ChatFilter) => void
}) {
  const filters: { value: ChatFilter; label: string; icon: ReactNode }[] = [
    { value: 'all', label: 'All', icon: <Hash className="h-3.5 w-3.5" /> },
    { value: 'media', label: 'Media', icon: <ImageIcon className="h-3.5 w-3.5" /> },
    { value: 'docs', label: 'Docs', icon: <FileText className="h-3.5 w-3.5" /> },
    { value: 'links', label: 'Links', icon: <LinkIcon className="h-3.5 w-3.5" /> },
    { value: 'starred', label: 'Starred', icon: <Star className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            'interactive-control flex h-9 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-bold',
            active === filter.value
              ? 'border-primary/40 bg-primary text-primary-foreground shadow-lg shadow-primary/15'
              : 'bg-background/80 text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {filter.icon}
          {filter.label}
          <span className={cn('rounded-full px-1.5 py-0.5 text-[10px]', active === filter.value ? 'bg-white/18' : 'bg-muted')}>
            {counts[filter.value]}
          </span>
        </button>
      ))}
    </div>
  )
}

function PollTimelineItem({
  poll,
  currentUserId,
  onVote,
}: {
  poll: Poll
  currentUserId: string
  onVote: (pollId: string, optionIdx: number) => void
}) {
  return (
    <div className="flex justify-start gap-3 animate-message-in">
      <div className="w-10 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-primary shadow-md">
          <BarChart2 className="h-4 w-4" />
        </div>
      </div>

      <div className="max-w-[min(720px,82%)]">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">Poll</span>
          <span className="text-[11px] text-muted-foreground">{timeAgo(poll.created_at)}</span>
        </div>
        <PollCard poll={poll} currentUserId={currentUserId} onVote={onVote} />
      </div>
    </div>
  )
}

function PollCard({
  poll,
  currentUserId,
  onVote,
}: {
  poll: Poll
  currentUserId: string
  onVote: (pollId: string, optionIdx: number) => void
}) {
  const votes = poll.poll_votes ?? []
  const totalVotes = Math.max(votes.length, 1)
  const selected = votes.find((vote) => vote.user_id === currentUserId)?.option_idx

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-2">
        <BarChart2 className="h-4 w-4 text-primary" />
        <p className="min-w-0 flex-1 break-words text-sm font-bold text-foreground">{poll.question}</p>
        <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">{votes.length} votes</span>
      </div>
      <div className="space-y-2">
        {poll.options.map((option, index) => {
          const count = votes.filter((vote) => vote.option_idx === index).length
          const percent = Math.round((count / totalVotes) * 100)
          return (
            <button
              key={`${poll.id}-${index}`}
              onClick={() => onVote(poll.id, index)}
              className={cn(
                'interactive-control relative w-full overflow-hidden rounded-xl border px-3 py-2 text-left text-sm transition hover:border-primary/35',
                selected === index ? 'border-primary/45 bg-primary/10' : 'bg-background'
              )}
            >
              <span className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${percent}%` }} />
              <span className="relative flex items-center justify-between gap-3">
                <span className="font-semibold text-foreground">{option}</span>
                <span className="text-xs font-bold text-muted-foreground">{percent}%</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ChannelInfoPanel({
  channel,
  stats,
  mediaItems,
  docItems,
  linkItems,
  starredCount,
  onClose,
}: {
  channel: Channel
  stats: ChannelStats
  mediaItems: Message[]
  docItems: Message[]
  linkItems: { url: string; message: Message }[]
  starredCount: number
  onClose: () => void
}) {
  return (
    <aside className="hidden w-80 shrink-0 border-l bg-card/88 backdrop-blur-xl xl:flex xl:flex-col">
      <div className="border-b p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-extrabold text-foreground">Channel info</p>
          <button onClick={onClose} className="interactive-control flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" title="Close info">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Hash className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">#{channel.name}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{channel.description || 'Campus channel'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b p-4">
        <InfoMetric label="Members" value={stats.members} />
        <InfoMetric label="Starred" value={starredCount} />
        <InfoMetric label="Media" value={stats.media} />
        <InfoMetric label="Docs" value={stats.docs} />
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <InfoSection title="Media" empty="No media yet">
          {mediaItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {mediaItems.slice(0, 9).map((message) => (
                <a key={message.id} href={message.file_url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-xl border bg-background">
                  {getFileKind(message.file_name ?? '', message.file_url ?? '') === 'image' ? (
                    <img src={message.file_url} alt={message.file_name ?? 'Media'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Video className="h-5 w-5" />
                    </div>
                  )}
                </a>
              ))}
            </div>
          ) : null}
        </InfoSection>

        <InfoSection title="Documents" empty="No documents yet">
          {docItems.length > 0 ? (
            <div className="space-y-2">
              {docItems.slice(0, 5).map((message) => (
                <a key={message.id} href={message.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border bg-background p-2 hover:bg-accent">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold">{message.file_name ?? 'Document'}</span>
                </a>
              ))}
            </div>
          ) : null}
        </InfoSection>

        <InfoSection title="Links" empty="No links yet">
          {linkItems.length > 0 ? (
            <div className="space-y-2">
              {linkItems.slice(0, 5).map((item) => (
                <a key={`${item.message.id}-${item.url}`} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border bg-background p-2 hover:bg-accent">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold">{item.url}</span>
                </a>
              ))}
            </div>
          ) : null}
        </InfoSection>
      </div>
    </aside>
  )
}

function InfoMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-background/75 p-3">
      <p className="text-lg font-extrabold text-foreground">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  )
}

function InfoSection({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-muted-foreground">{title}</h3>
      {children ?? <p className="rounded-xl border bg-background/70 p-3 text-xs text-muted-foreground">{empty}</p>}
    </section>
  )
}

function NoResults({ query, filter }: { query: string; filter: ChatFilter }) {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center text-center">
      <div>
        <Search className="mx-auto h-8 w-8 text-muted-foreground" />
        <h2 className="mt-3 text-lg font-extrabold text-foreground">Nothing found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {query ? `No messages match "${query}".` : `No ${filter} messages yet.`}
        </p>
      </div>
    </div>
  )
}

function FilePreview({
  url,
  fileName,
  isMine,
}: {
  url: string
  fileName: string
  isMine: boolean
}) {
  const kind = getFileKind(fileName, url)

  return (
    <div className={cn('mt-2 overflow-hidden rounded-2xl border', isMine ? 'border-white/20 bg-white/10' : 'bg-background')}>
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <FileKindIcon kind={kind} />
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-xs font-bold', isMine ? 'text-white' : 'text-foreground')}>{fileName}</p>
          <p className={cn('text-[10px] font-semibold uppercase tracking-[0.16em]', isMine ? 'text-white/65' : 'text-muted-foreground')}>
            {previewLabel(fileName)}
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={cn('interactive-control flex h-8 w-8 items-center justify-center rounded-lg', isMine ? 'text-white hover:bg-white/15' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}
          title="Open file"
        >
          <Download className="h-4 w-4" />
        </a>
      </div>

      {kind === 'image' && (
        <a href={url} target="_blank" rel="noreferrer" className="block bg-black/5">
          <img src={url} alt={fileName} className="max-h-80 w-full object-contain" />
        </a>
      )}

      {kind === 'pdf' && (
        <iframe
          src={url}
          title={fileName}
          className="h-80 w-full bg-white"
        />
      )}

      {kind === 'video' && (
        <video controls className="max-h-80 w-full bg-black">
          <source src={url} />
        </video>
      )}

      {kind === 'audio' && (
        <div className="p-3">
          <audio controls className="w-full">
            <source src={url} />
          </audio>
        </div>
      )}

      {kind === 'office' && (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
          title={fileName}
          className="h-80 w-full bg-white"
        />
      )}

      {kind === 'document' && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={cn('flex items-center gap-3 p-4 transition', isMine ? 'hover:bg-white/10' : 'hover:bg-accent')}
        >
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', isMine ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary')}>
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className={cn('text-sm font-bold', isMine ? 'text-white' : 'text-foreground')}>Open document</p>
            <p className={cn('text-xs', isMine ? 'text-white/70' : 'text-muted-foreground')}>Preview is not available for this file type.</p>
          </div>
        </a>
      )}
    </div>
  )
}

function FileKindIcon({ kind }: { kind: FileKind }) {
  const className = 'h-4 w-4 text-current'
  if (kind === 'image') return <ImageIcon className={className} />
  if (kind === 'pdf') return <FileText className={className} />
  if (kind === 'video') return <Video className={className} />
  if (kind === 'audio') return <Music className={className} />
  return <FileText className={className} />
}

function MessageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className={cn('flex gap-3', index % 2 ? 'justify-end' : 'justify-start')}>
          {index % 2 === 0 && <div className="h-10 w-10 rounded-full bg-muted shimmer" />}
          <div className="w-[min(620px,78%)] rounded-2xl border bg-card p-4 shadow-sm">
            <div className="h-3 w-28 rounded-full bg-muted shimmer" />
            <div className="mt-3 h-3 w-full rounded-full bg-muted shimmer" />
            <div className="mt-2 h-3 w-2/3 rounded-full bg-muted shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ channelName }: { channelName: string }) {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-primary/10 text-primary shadow-lg shadow-primary/10">
          <Sparkles className="h-9 w-9" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground">Start #{channelName}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Share a note, upload a file, or pin an important update. File previews will appear right inside the conversation.
        </p>
      </div>
    </div>
  )
}

function groupChannels(channels: Channel[]) {
  const years = [1, 2, 3, 4]
    .map((year) => ({
      year,
      channels: channels
        .filter((channel) => (channel.type === 'academic' || channel.type === 'subject') && channel.year === year)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((group) => group.channels.length > 0)

  const other = channels
    .filter((channel) => channel.type === 'official' || channel.type === 'club' || !channel.year)
    .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))

  return { years, other }
}

type FileKind = 'image' | 'pdf' | 'video' | 'audio' | 'office' | 'document'
type ReactionSummary = {
  emoji: string
  count: number
  names: string[]
  reactedByMe: boolean
}

function filterMessages(
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

function filterPolls(polls: Poll[], filter: ChatFilter, query: string) {
  if (filter !== 'all') return []
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return polls

  return polls.filter((poll) => {
    const searchable = [poll.question, ...poll.options].join(' ').toLowerCase()
    return searchable.includes(normalizedQuery)
  })
}

function groupReactions(reactions: MessageReaction[], currentUserId?: string) {
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

function extractLinks(value: string) {
  return value.match(/https?:\/\/\S+/g) ?? []
}

function starredStorageKey(channelId: string, userId: string) {
  return `campus-buddy:starred:${channelId}:${userId}`
}

function getFileKind(fileName: string, url: string): FileKind {
  const value = `${fileName} ${url}`.toLowerCase().split('?')[0]
  if (/\.(png|jpe?g|gif|webp|svg|bmp|avif)$/.test(value)) return 'image'
  if (/\.pdf$/.test(value)) return 'pdf'
  if (/\.(mp4|webm|ogg|mov|m4v)$/.test(value)) return 'video'
  if (/\.(mp3|wav|m4a|aac|flac|oga)$/.test(value)) return 'audio'
  if (/\.(doc|docx|ppt|pptx|xls|xlsx)$/.test(value)) return 'office'
  return 'document'
}

function previewLabel(fileName: string) {
  const kind = getFileKind(fileName, fileName)
  if (kind === 'image') return 'Image preview'
  if (kind === 'pdf') return 'PDF preview'
  if (kind === 'video') return 'Video preview'
  if (kind === 'audio') return 'Audio preview'
  if (kind === 'office') return 'Office document preview'
  return 'Downloadable file'
}

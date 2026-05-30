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
  const [showInfo, setShowInfo] = useState(false)
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
  const canPin = currentUser?.role === 'admin' || currentUser?.role === 'professor' || currentUser?.role === 'cr'
  const meta = typeMeta[channel.type]
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
    <div className="chat-workspace relative flex h-full w-full flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center border-b bg-card px-4 shadow-sm z-30">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Hash className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-bold text-foreground">#{channel.name}</h1>
              {channel.is_private && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
              <div className="hidden sm:flex items-center gap-1.5 ml-1">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Live</span>
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

            <div className="relative flex-1 overflow-y-auto px-4 py-4 custom-scrollbar bg-background/50 min-h-0">
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
                  onVote={handleVote}
                  onJump={jumpToMessage}
                  reactionGroups={reactionGroups}
                  starredIds={starredIds}
                />
              )}
              <div ref={bottomRef} />
            </div>

            <footer className="border-t bg-card px-4 py-3 shrink-0 z-30 relative">
              {(sending || uploading || recording) && (
                <div className="animate-fade-up mb-2 flex items-center gap-2 border bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {recording ? 'Recording voice note' : uploading ? `Uploading ${uploadName}` : editing ? 'Saving edit' : 'Sending message'}
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
                <textarea
                  ref={messageInputRef}
                  className="min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 outline-none placeholder:text-muted-foreground"
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
                      'interactive-control flex h-9 w-9 items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-50',
                      recording ? 'bg-red-500 text-white focus-pulse' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                    title={recording ? 'Stop recording' : 'Voice note'}
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
    </div>
  )
}

function ChannelNavItem({ channel, active }: { channel: Channel; active: boolean }) {
  const meta = typeMeta[channel.type]
  return (
    <Link
      href={`/channels/${channel.id}`}
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 text-sm transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      <span className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center border',
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
          className="interactive-control flex h-9 w-9 shrink-0 items-center justify-center border bg-muted text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          title="Add attachment"
        >
          <Plus className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-56 border bg-popover p-1 shadow-sm">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onClick={item.action}
            className="gap-3 px-3 py-2 text-sm font-medium"
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
          className="interactive-control hidden h-9 w-9 shrink-0 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground sm:flex"
          title="Choose emoji"
        >
          <SmilePlus className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-80 border bg-popover p-2 shadow-sm">
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {emojiPalette.map((group) => (
            <section key={group.label}>
              <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {group.label}
              </p>
              <div className="grid grid-cols-8 gap-1">
                {group.emojis.map((emoji) => (
                  <button
                    key={`${group.label}-${emoji}`}
                    onClick={() => onSelect(emoji)}
                    className="interactive-control flex h-8 w-8 items-center justify-center text-lg hover:bg-accent"
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
  currentUserRole,
  canPin,
  onPin,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  onStar,
  onReact,
  onVote,
  onJump,
  reactionGroups,
  starredIds,
}: {
  items: ChatTimelineItem[]
  messageById: Map<string, Message>
  currentUserId: string
  currentUserRole: string
  canPin: boolean
  onPin: (id: string, current: boolean) => void
  onReply: (message: Message) => void
  onEdit: (message: Message) => void
  onDelete: (message: Message) => void
  onCopy: (message: Message) => void
  onStar: (messageId: string) => void
  onReact: (messageId: string, emoji: string) => void
  onVote: (pollId: string, optionIdx: number) => void
  onJump: (id: string) => void
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
    <div className="chat-timeline flex flex-col gap-2 w-full">
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
            id={`message-${msg.id}`}
            className="chat-message-row flex w-full gap-3 py-1 animate-message-in"
          >
            {/* Avatar on Left (for others) */}
            {!isMine && (
              <div className="w-8 shrink-0">
                {showAvatar && (
                  <Avatar className="h-8 w-8 border border-background shadow-sm">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-primary text-[10px] font-bold text-primary-foreground">
                      {getInitials(user?.name ?? '?')}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}

            {/* Message Bubble Container */}
            <div className={cn(
              "relative max-w-[min(680px,78%)] flex flex-col",
              isMine ? "ml-auto items-end" : "items-start"
            )}>
              <div
                onContextMenu={(event) => {
                  event.preventDefault()
                  if (isPending) return
                  const bubbleRect = event.currentTarget.getBoundingClientRect()
                  setContextMenu({
                    x: Math.max(8, Math.min(bubbleRect.right - 224, window.innerWidth - 260)),
                    y: Math.max(8, Math.min(bubbleRect.top + 20, window.innerHeight - 440)),
                    message: msg,
                    isMine,
                    isStarred,
                  })
                }}
                className={cn(
                  'group/message relative overflow-hidden px-3 pb-1.5 pt-2 shadow-sm border transition-all duration-200',
                  isMine
                    ? 'rounded-l-xl rounded-tr-none bg-primary text-primary-foreground border-primary/20'
                    : 'rounded-r-xl rounded-tl-none bg-card text-foreground border-border',
                  isPending && 'opacity-75'
                )}
              >
                {showAvatar && !isMine && (
                  <div className="mb-0.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pr-6">
                    <span className="text-[11px] font-bold text-emerald-500 overflow-hidden text-ellipsis whitespace-nowrap">~ {user?.name ?? 'Someone'}</span>
                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                      {user?.role === 'admin' ? 'ADMIN' : user?.role === 'professor' ? 'PROF' : user?.role === 'cr' ? 'CR' : ''} 
                    </span>
                  </div>
                )}

                {reply && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onJump(reply.id)
                    }}
                    className={cn(
                      "mb-1.5 block w-full text-left border-l-2 px-2 py-1 text-[11px] rounded-r-md transition",
                      isMine 
                        ? "border-primary-foreground/30 bg-black/10 hover:bg-black/20" 
                        : "border-emerald-500 bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <p className={cn("font-bold truncate", isMine ? "text-primary-foreground/90" : "text-emerald-500")}>
                      {reply.users?.name ?? 'Message'}
                    </p>
                    <p className="line-clamp-1 opacity-70 italic">{reply.content ?? reply.file_name ?? 'Shared file'}</p>
                  </button>
                )}

                {msg.content && (
                  <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed pr-8 font-medium">
                    {msg.content}
                  </p>
                )}

                {msg.file_url && (
                  <div className="mt-1.5 mb-1.5">
                    <FilePreview
                      url={msg.file_url}
                      fileName={msg.file_name ?? 'Shared file'}
                      isMine={isMine}
                    />
                  </div>
                )}

                <div className={cn(
                  "mt-1 flex items-center gap-1.5 -mr-1",
                  isMine ? "justify-start flex-row-reverse" : "justify-end"
                )}>
                  <div className="flex items-center gap-1">
                    {isStarred && <Star className={cn("h-3 w-3 fill-amber-400 text-amber-400")} />}
                    {msg.is_pinned && <Pin className={cn("h-2.5 w-2.5", isMine ? "text-primary-foreground/70" : "text-amber-500")} />}
                  </div>
                  
                  {isPending ? (
                    <div className="flex items-center gap-1 text-[9px] font-bold opacity-60">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {msg.edited_at && <span className="text-[9px] italic opacity-50">edited</span>}
                      <span className="text-[9px] font-bold opacity-60">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </div>
                  )}
                </div>

                {!isPending && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      const rect = event.currentTarget.getBoundingClientRect()
                      setContextMenu({
                        x: Math.max(8, Math.min(rect.right - 224, window.innerWidth - 260)),
                        y: Math.max(8, Math.min(rect.top + 20, window.innerHeight - 440)),
                        message: msg,
                        isMine,
                        isStarred,
                      })
                    }}
                    className={cn(
                      "absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full opacity-0 shadow-sm border backdrop-blur-sm transition-opacity hover:text-foreground group-hover/message:opacity-100 focus:opacity-100",
                      isMine ? "bg-primary/20 text-primary-foreground border-white/10" : "bg-card/95 text-muted-foreground hover:bg-accent"
                    )}
                    title="Message actions"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}
              </div>

              {groups.length > 0 && (
                <div className={cn("mt-1 flex flex-wrap gap-1", isMine && "flex-row-reverse")}>
                  {groups.map((group) => (
                    <button
                      key={group.emoji}
                      onClick={() => onReact(msg.id, group.emoji)}
                      className={cn(
                        'interactive-control border px-2 py-0.5 text-xs font-bold hover:bg-accent rounded-full transition-all shadow-xs flex items-center gap-1',
                        isMine ? 'bg-primary/5 border-primary/20' : 'bg-card border-border',
                        group.reactedByMe && 'border-primary/50 bg-primary/10 text-primary ring-1 ring-primary/20'
                      )}
                      title={group.names.join(', ')}
                    >
                      <span>{group.emoji}</span>
                      <span className="text-[10px]">{group.count}</span>
                    </button>
                  ))}
                </div>
              )}

            </div>

            {/* Avatar on Right (for me) */}
            {isMine && (
              <div className="w-8 shrink-0">
                {showAvatar && (
                  <Avatar className="h-8 w-8 border border-background shadow-sm">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-primary text-[10px] font-bold text-primary-foreground">
                      {getInitials(user?.name ?? '?')}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}
          </div>
        )
      })}
      {contextMenu && (
        <MessageContextMenu
          state={contextMenu}
          canPin={canPin}
          currentUserRole={currentUserRole}
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
  currentUserRole,
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
  currentUserRole: string
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
  const canManage = isMine || ['admin', 'professor', 'cr'].includes(currentUserRole)
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
    { label: 'Edit', icon: <Edit3 className="h-4 w-4" />, action: () => onEdit(message), show: canManage && Boolean(message.content), divider: true },
    { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, action: () => onDelete(message), show: canManage },
  ]

  const menu = (
    <div
      ref={menuRef}
      className="fixed z-[80]"
      style={{ left: layout.x, top: layout.y, width: layout.width }}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div ref={reactionBarRef} className="mb-1 flex max-w-full items-center gap-1 overflow-x-auto border bg-popover p-1 shadow-sm">
        {quickReactions.map((emoji) => (
          <button
            key={emoji}
            onClick={() => run(() => onReact(message.id, emoji))}
            className="interactive-control flex h-8 w-8 items-center justify-center text-lg hover:bg-accent"
            title={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}
        <button
          onClick={() => run(() => onStar(message.id))}
          className="interactive-control flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground"
          title="More"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <div
        ref={actionPanelRef}
        className="w-full overflow-y-auto border bg-popover p-1.5 text-popover-foreground shadow-sm"
        style={{ maxHeight: layout.actionMaxHeight }}
      >
        {menuItems.filter((item) => item.show).map((item) => (
          <div key={item.label}>
            {item.divider && <div className="my-1 h-px bg-border" />}
            <button
              onClick={() => run(item.action)}
              className={cn(
                'interactive-control flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium hover:bg-accent',
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
    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            'interactive-control flex h-8 shrink-0 items-center gap-1.5 border px-2.5 text-xs font-medium',
            active === filter.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'bg-background/80 text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {filter.icon}
          {filter.label}
          <span className={cn('px-1 py-0.5 text-[10px]', active === filter.value ? 'bg-white/18' : 'bg-muted')}>
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
    <div className="animate-message-in flex justify-start gap-2 py-0.5">
      <div className="w-8 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center border bg-primary/10 text-primary">
          <BarChart2 className="h-4 w-4" />
        </div>
      </div>

      <div className="max-w-[min(680px,78%)]">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Poll</span>
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
    <div className="border bg-card p-3">
      <div className="mb-2 flex items-start gap-2">
        <BarChart2 className="h-4 w-4 text-primary" />
        <p className="min-w-0 flex-1 break-words text-sm font-semibold text-foreground">{poll.question}</p>
        <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{votes.length} votes</span>
      </div>
      <div className="space-y-1.5">
        {poll.options.map((option, index) => {
          const count = votes.filter((vote) => vote.option_idx === index).length
          const percent = Math.round((count / totalVotes) * 100)
          return (
            <button
              key={`${poll.id}-${index}`}
              onClick={() => onVote(poll.id, index)}
              className={cn(
                'interactive-control relative w-full overflow-hidden border px-3 py-1.5 text-left text-sm transition hover:border-primary/35',
                selected === index ? 'border-primary/45 bg-primary/10' : 'bg-background'
              )}
            >
              <span className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${percent}%` }} />
              <span className="relative flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">{option}</span>
                <span className="text-xs font-medium text-muted-foreground">{percent}%</span>
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
    <aside className="hidden w-72 shrink-0 border-l bg-card xl:flex xl:flex-col">
      <div className="border-b p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Channel info</p>
          <button onClick={onClose} className="interactive-control flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground" title="Close info">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border bg-primary text-primary-foreground">
            <Hash className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">#{channel.name}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{channel.description || 'Campus channel'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b p-3">
        <InfoMetric label="Members" value={stats.members} />
        <InfoMetric label="Starred" value={starredCount} />
        <InfoMetric label="Media" value={stats.media} />
        <InfoMetric label="Docs" value={stats.docs} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <InfoSection title="Media" empty="No media yet">
          {mediaItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {mediaItems.slice(0, 9).map((message) => (
                <a key={message.id} href={message.file_url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden border bg-background">
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
                <a key={message.id} href={message.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 border bg-background p-2 hover:bg-accent">
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
                <a key={`${item.message.id}-${item.url}`} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 border bg-background p-2 hover:bg-accent">
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
    <div className="border bg-background p-2.5">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
    </div>
  )
}

function InfoSection({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</h3>
      {children ?? <p className="border bg-background p-3 text-xs text-muted-foreground">{empty}</p>}
    </section>
  )
}

function NoResults({ query, filter }: { query: string; filter: ChatFilter }) {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center text-center">
      <div>
        <Search className="mx-auto h-8 w-8 text-muted-foreground" />
        <h2 className="mt-3 text-lg font-semibold text-foreground">Nothing found</h2>
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
    <div className={cn('mt-2 overflow-hidden border', isMine ? 'border-white/20 bg-white/10' : 'bg-background')}>
      <div className="flex items-center gap-2 border-b px-2 py-1.5">
        <FileKindIcon kind={kind} />
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-xs font-semibold', isMine ? 'text-white' : 'text-foreground')}>{fileName}</p>
          <p className={cn('text-[10px] font-medium uppercase tracking-[0.12em]', isMine ? 'text-white/65' : 'text-muted-foreground')}>
            {previewLabel(fileName)}
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={cn('interactive-control flex h-7 w-7 items-center justify-center', isMine ? 'text-white hover:bg-white/15' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}
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
          className={cn('flex items-center gap-3 p-3 transition', isMine ? 'hover:bg-white/10' : 'hover:bg-accent')}
        >
          <div className={cn('flex h-10 w-10 items-center justify-center border', isMine ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary')}>
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
    <div className="space-y-2">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className={cn('flex gap-3', index % 2 ? 'justify-end' : 'justify-start')}>
          {index % 2 === 0 && <div className="h-10 w-10 rounded-full bg-muted shimmer" />}
          <div className="w-[min(620px,78%)] border bg-card p-3">
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border bg-primary/10 text-primary">
          <Hash className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Start #{channelName}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Share a note, upload a file, or pin an important update. File previews will appear right inside the conversation.
        </p>
      </div>
    </div>
  )
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

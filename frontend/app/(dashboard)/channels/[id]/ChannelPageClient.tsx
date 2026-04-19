'use client'

import { useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useMessages } from '@/hooks/useMessages'
import { sendMessage, uploadFile, pinMessage, createPoll } from '@/services/channels.service'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  Briefcase,
  Check,
  Download,
  FileText,
  GraduationCap,
  Hash,
  Image as ImageIcon,
  Loader2,
  Music,
  Paperclip,
  Pin,
  Send,
  Sparkles,
  Trophy,
  Video,
  X,
} from 'lucide-react'
import { getInitials, getRoleBadgeColor, timeAgo, cn } from '@/lib/utils'
import type { Channel, Message, User, ChannelType } from '@/types'
import { useToast } from '@/hooks/use-toast'

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
  const [showPollForm, setShowPollForm] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [creatingPoll, setCreatingPoll] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const pinned = messages.find((m) => m.is_pinned)
  const canPin = currentUser?.role === 'admin' || currentUser?.role === 'teacher'
  const meta = typeMeta[channel.type]
  const navGroups = useMemo(() => groupChannels(allChannels), [allChannels])

  const handleSend = async () => {
    const content = text.trim()
    if (!content || !currentUser || sending) return

    const tempId = `pending-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      channel_id: channel.id,
      sender_id: currentUser.id,
      content,
      is_pinned: false,
      created_at: new Date().toISOString(),
      users: {
        name: currentUser.name,
        avatar_url: currentUser.avatar_url,
        role: currentUser.role,
      },
    }

    setText('')
    setSending(true)
    setMessages((prev) => [...prev, optimistic])
    scrollToBottom()

    const { data, error } = await sendMessage({
      channel_id: channel.id,
      sender_id: currentUser.id,
      content,
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
    if (fileRef.current) fileRef.current.value = ''
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

  const handleCreatePoll = async () => {
    if (!pollQuestion.trim() || !currentUser || creatingPoll) return
    const validOptions = pollOptions.map((option) => option.trim()).filter(Boolean)
    if (validOptions.length < 2) {
      toast({ title: 'Add at least 2 options', variant: 'destructive' })
      return
    }

    setCreatingPoll(true)
    const { error } = await createPoll({
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
    toast({ title: 'Poll created' })
  }

  return (
    <div className="relative flex h-full -m-6 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)))]">
      <aside className="hidden w-72 shrink-0 border-r bg-card/80 backdrop-blur-xl md:flex md:flex-col">
        <div className="border-b p-4">
          <Link href="/channels" className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-primary">
            <ArrowRight className="h-3.5 w-3.5 rotate-180 transition group-hover:-translate-x-0.5" />
            Curriculum map
          </Link>
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
              {channel.year && (
                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                  {yearLabels[channel.year] ?? `Year ${channel.year}`}
                </span>
              )}
              <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600">
                Live
              </span>
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

        <div className="relative flex-1 overflow-y-auto px-4 py-5 md:px-7">
          {loading ? (
            <MessageSkeleton />
          ) : messages.length === 0 ? (
            <EmptyState channelName={channel.name} />
          ) : (
            <MessageList
              messages={messages}
              currentUserId={currentUser?.id ?? ''}
              canPin={canPin}
              onPin={handlePin}
            />
          )}
          <div ref={bottomRef} />
        </div>

        <footer className="border-t bg-card/92 px-4 py-4 shadow-[0_-18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          {(sending || uploading) && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border bg-primary/5 px-3 py-2 text-xs font-semibold text-primary animate-fade-up">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {uploading ? `Uploading ${uploadName}` : 'Sending message'}
            </div>
          )}

          <div className="mx-auto flex max-w-5xl items-end gap-2 rounded-2xl border bg-background/85 p-2 shadow-lg shadow-primary/5 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10">
            <textarea
              className="min-h-[42px] flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
              placeholder={`Message #${channel.name}`}
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
              <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="interactive-control flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                title="Attach file"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>
              {canPin && (
                <button
                  onClick={() => setShowPollForm(!showPollForm)}
                  className={cn(
                    'interactive-control flex h-10 w-10 items-center justify-center rounded-xl transition',
                    showPollForm ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                  title="Create poll"
                >
                  <BarChart2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={sending || !text.trim()}
                className="interactive-control flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                title="Send"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </footer>
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

function MessageList({
  messages,
  currentUserId,
  canPin,
  onPin,
}: {
  messages: Message[]
  currentUserId: string
  canPin: boolean
  onPin: (id: string, current: boolean) => void
}) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      {messages.map((msg, index) => {
        const isMine = msg.sender_id === currentUserId
        const showAvatar = index === 0 || messages[index - 1]?.sender_id !== msg.sender_id
        const user = msg.users
        const isPending = msg.id.startsWith('pending-')

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
                  {msg.is_pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                </div>
              )}

              <div
                className={cn(
                  'group/message relative overflow-hidden rounded-2xl border px-4 py-3 shadow-sm',
                  isMine
                    ? 'rounded-br-md border-primary/20 bg-primary text-primary-foreground shadow-primary/10'
                    : 'rounded-bl-md bg-card',
                  isPending && 'opacity-75'
                )}
              >
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

                {canPin && !isPending && (
                  <button
                    onClick={() => onPin(msg.id, msg.is_pinned)}
                    className={cn(
                      'interactive-control absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg opacity-0 transition group-hover/message:opacity-100',
                      msg.is_pinned
                        ? 'bg-amber-100 text-amber-600'
                        : isMine ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-background/80 text-muted-foreground hover:bg-accent'
                    )}
                    title={msg.is_pinned ? 'Unpin' : 'Pin message'}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
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

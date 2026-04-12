'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useMessages } from '@/hooks/useMessages'
import { sendMessage, uploadFile, pinMessage, createPoll } from '@/services/channels.service'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Hash, Send, Paperclip, Pin, BarChart2, X,
  ArrowDown, FileIcon, Loader2,
} from 'lucide-react'
import { getInitials, getRoleBadgeColor, cn } from '@/lib/utils'
import type { Channel, Message, User } from '@/types'
import { useToast } from '@/hooks/use-toast'

// ── Helpers ──────────────────────────────────────────────────

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif']

function isImage(url: string, name?: string): boolean {
  const src = (name ?? url).split('?')[0].toLowerCase()
  return IMAGE_EXTS.some((e) => src.endsWith(`.${e}`))
}

/**
 * Smart relative timestamp:
 * < 30s  → "just now"
 * < 1m   → "45s ago"
 * < 60m  → "12m ago"
 * same day → "10:30 AM"
 * yesterday → "Yesterday 10:30 AM"
 * older  → "12 Jan 10:30 AM"
 */
function smartTime(iso: string): string {
  const d   = new Date(iso)
  const now = new Date()
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000)
  const min = Math.floor(sec / 60)
  const hr  = Math.floor(min / 60)
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  if (sec < 30)  return 'just now'
  if (sec < 60)  return `${sec}s ago`
  if (min < 60)  return `${min}m ago`
  if (hr  < 24 && now.toDateString() === d.toDateString()) return time
  if (hr  < 48)  return `Yesterday ${time}`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + time
}

function dayLabel(iso: string): string {
  const d   = new Date(iso)
  const now = new Date()
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

// ── Main component ────────────────────────────────────────────

export default function ChannelPageClient({
  channel, currentUser, allChannels,
}: {
  channel: Channel
  currentUser: User | null
  allChannels: Channel[]
}) {
  const { toast } = useToast()
  const {
    messages, loading,
    bottomRef, scrollContainerRef,
    setMessages, scrollToBottom,
    showScrollBtn, handleScroll,
  } = useMessages(channel.id, currentUser?.id)

  const [text, setText]             = useState('')
  const [sending, setSending]       = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [filePreview, setFilePreview] = useState<{ name: string; localUrl: string; isImg: boolean } | null>(null)
  const [showPollForm, setShowPollForm] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions]   = useState(['', ''])
  const [lightbox, setLightbox]     = useState<string | null>(null)

  const fileRef     = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const pinned = messages.find((m) => m.is_pinned)
  const canPin = currentUser?.role === 'admin' || currentUser?.role === 'teacher'

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [text])

  const handleSend = async () => {
    if (!text.trim() || !currentUser || sending) return
    setSending(true)
    const { error } = await sendMessage({
      channel_id: channel.id,
      sender_id: currentUser.id,
      content: text.trim(),
    })
    setSending(false)
    if (error) { toast({ title: 'Failed to send', variant: 'destructive' }); return }
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    const img      = isImage(file.name)
    const localUrl = img ? URL.createObjectURL(file) : ''
    setFilePreview({ name: file.name, localUrl, isImg: img })
    setUploading(true)

    const { url, error } = await uploadFile(file, channel.id)
    if (!url || error) {
      toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' })
      setFilePreview(null)
    } else {
      await sendMessage({
        channel_id: channel.id,
        sender_id: currentUser.id,
        file_url: url,
        file_name: file.name,
      })
      if (localUrl) URL.revokeObjectURL(localUrl)
      setFilePreview(null)
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handlePin = async (msgId: string, current: boolean) => {
    await pinMessage(msgId, !current)
    setMessages((prev) =>
      prev.map((m) => m.id === msgId ? { ...m, is_pinned: !current } : { ...m, is_pinned: false })
    )
  }

  const handleCreatePoll = async () => {
    if (!pollQuestion.trim() || !currentUser) return
    const opts = pollOptions.filter((o) => o.trim())
    if (opts.length < 2) { toast({ title: 'Add at least 2 options', variant: 'destructive' }); return }
    const { error } = await createPoll({
      channel_id: channel.id,
      question: pollQuestion.trim(),
      options: opts,
      created_by: currentUser.id,
    })
    if (!error) {
      setShowPollForm(false); setPollQuestion(''); setPollOptions(['', ''])
      toast({ title: 'Poll created!' })
    }
  }

  return (
    <>
      <div className="flex h-full -m-6 overflow-hidden bg-white">

        {/* ── Channel sidebar ── */}
        <div className="w-56 bg-gray-50 border-r shrink-0 hidden md:flex flex-col">
          <div className="px-3 py-3 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channels</p>
          </div>
          <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
            {allChannels.map((ch) => (
              <Link key={ch.id} href={`/channels/${ch.id}`}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all',
                  ch.id === channel.id
                    ? 'bg-[#1E3A8A] text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}>
                <Hash className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{ch.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Main chat ── */}
        <div className="flex flex-col flex-1 min-w-0 relative">

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b bg-white z-10">
            <div className="h-8 w-8 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
              <Hash className="h-4 w-4 text-[#1E3A8A]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 leading-tight">{channel.name}</h2>
              <p className="text-xs text-muted-foreground capitalize truncate">
                {channel.type} channel{channel.description ? ` · ${channel.description}` : ''}
              </p>
            </div>
          </div>

          {/* Pinned banner */}
          {pinned && (
            <div className="flex items-center gap-2.5 px-5 py-2 bg-amber-50 border-b border-amber-200">
              <Pin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <p className="text-xs font-medium text-amber-800 truncate flex-1">
                <span className="text-amber-500 mr-1">📌 Pinned:</span>
                {pinned.content ?? pinned.file_name}
              </p>
            </div>
          )}

          {/* Poll form */}
          {showPollForm && (
            <div className="px-5 py-3 border-b bg-blue-50 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-blue-800 flex items-center gap-1.5">
                  <BarChart2 className="h-4 w-4" /> Create Poll
                </p>
                <button onClick={() => setShowPollForm(false)} className="text-blue-600 hover:text-blue-800 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Input placeholder="Ask a question…" value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)} className="bg-white text-sm" />
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder={`Option ${i + 1}`} value={opt}
                    onChange={(e) => { const u = [...pollOptions]; u[i] = e.target.value; setPollOptions(u) }}
                    className="bg-white text-sm" />
                  {i >= 2 && (
                    <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-red-500 transition">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-3">
                {pollOptions.length < 5 && (
                  <button onClick={() => setPollOptions([...pollOptions, ''])}
                    className="text-xs text-blue-600 hover:underline">+ Add option</button>
                )}
                <button onClick={handleCreatePoll}
                  className="ml-auto px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium transition">
                  Create Poll
                </button>
              </div>
            </div>
          )}

          {/* ── Messages scroll area ── */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-5 py-4"
          >
            {loading ? <SkeletonMessages /> : messages.length === 0 ? (
              <EmptyChannel name={channel.name} />
            ) : (
              <MessageList
                messages={messages}
                currentUserId={currentUser?.id ?? ''}
                canPin={canPin}
                onPin={handlePin}
                onImageClick={setLightbox}
              />
            )}
            <div ref={bottomRef} className="h-1" />
          </div>

          {/* Jump-to-bottom pill */}
          {showScrollBtn && (
            <button
              onClick={() => scrollToBottom('smooth')}
              className="absolute bottom-24 right-6 z-20 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1E3A8A] text-white text-xs font-semibold shadow-lg hover:bg-[#1e40af] transition animate-fade-in"
            >
              <ArrowDown className="h-3.5 w-3.5" /> New messages
            </button>
          )}

          {/* ── Input area ── */}
          <div className="border-t bg-white px-4 py-3 shrink-0">

            {/* Upload preview strip */}
            {filePreview && (
              <div className="mb-2 flex items-center gap-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                {filePreview.isImg ? (
                  <img src={filePreview.localUrl} alt={filePreview.name}
                    className="h-10 w-10 rounded-lg object-cover border border-blue-200 shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <FileIcon className="h-5 w-5 text-blue-600" />
                  </div>
                )}
                <p className="text-xs text-blue-800 font-medium truncate flex-1">{filePreview.name}</p>
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
              </div>
            )}

            {/* Composer box */}
            <div className={cn(
              'flex items-end gap-2 rounded-xl border px-3 py-2.5 transition-all duration-150',
              'bg-gray-50 border-gray-200',
              'focus-within:bg-white focus-within:border-[#1E3A8A]/50 focus-within:ring-2 focus-within:ring-[#1E3A8A]/10',
            )}>
              <textarea
                ref={textareaRef}
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed py-0.5 min-h-[32px] max-h-32 placeholder:text-muted-foreground"
                placeholder={`Message #${channel.name}`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                }}
              />

              <div className="flex items-center gap-1 shrink-0 pb-0.5">
                <input ref={fileRef} type="file" className="hidden" onChange={handleFilePick} />

                {/* Attach */}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  title="Attach file or image"
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-gray-700 hover:bg-gray-200 transition disabled:opacity-40"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                {/* Poll */}
                {canPin && (
                  <button
                    onClick={() => setShowPollForm(!showPollForm)}
                    title="Create poll"
                    className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center transition',
                      showPollForm ? 'text-blue-600 bg-blue-100' : 'text-muted-foreground hover:text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    <BarChart2 className="h-4 w-4" />
                  </button>
                )}

                {/* Send */}
                <button
                  onClick={handleSend}
                  disabled={sending || !text.trim()}
                  title="Send (Enter)"
                  className="h-8 w-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white hover:bg-[#1e40af] transition disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  {sending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Send className="h-3.5 w-3.5" />
                  }
                </button>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground mt-1.5 px-1 select-none">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightbox}
            alt="Preview"
            className="max-w-full max-h-[88vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

// ── MessageList ───────────────────────────────────────────────

function MessageList({
  messages, currentUserId, canPin, onPin, onImageClick,
}: {
  messages: Message[]
  currentUserId: string
  canPin: boolean
  onPin: (id: string, current: boolean) => void
  onImageClick: (url: string) => void
}) {
  return (
    <div className="space-y-0.5">
      {messages.map((msg, idx) => {
        const prev = messages[idx - 1]

        // Group with prev if same sender within 5 min
        const grouped = idx > 0
          && prev.sender_id === msg.sender_id
          && new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60_000

        const showDivider = idx === 0 || !sameDay(prev!.created_at, msg.created_at)
        const user = msg.users

        return (
          <div key={msg.id}>
            {/* ── Date divider ── */}
            {showDivider && (
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] font-semibold text-muted-foreground px-3 py-0.5 rounded-full border bg-white">
                  {dayLabel(msg.created_at)}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            {/* ── Message row ── */}
            <div className={cn('flex gap-3 group', grouped ? 'mt-0.5' : 'mt-5')}>

              {/* Avatar / hover-time column */}
              <div className="w-9 shrink-0 flex justify-center">
                {!grouped ? (
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-[#1E3A8A] text-white text-xs font-semibold">
                      {getInitials(user?.name ?? '?')}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1.5 leading-none whitespace-nowrap">
                    {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Name + meta — shown only for first in group */}
                {!grouped && (
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900">{user?.name}</span>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', getRoleBadgeColor(user?.role ?? 'student'))}>
                      {user?.role}
                    </span>
                    {/* Smart timestamp — updates on hover for full date */}
                    <span
                      className="text-[11px] text-muted-foreground cursor-default"
                      title={new Date(msg.created_at).toLocaleString('en-IN', {
                        weekday: 'long', day: 'numeric', month: 'long',
                        hour: '2-digit', minute: '2-digit', hour12: true,
                      })}
                    >
                      {smartTime(msg.created_at)}
                    </span>
                    {msg.is_pinned && (
                      <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                        <Pin className="h-2.5 w-2.5" /> pinned
                      </span>
                    )}
                  </div>
                )}

                {/* Text content */}
                {msg.content && (
                  <p className="text-sm text-gray-800 leading-relaxed break-words whitespace-pre-wrap">
                    {msg.content}
                  </p>
                )}

                {/* Attachment */}
                {msg.file_url && (
                  isImage(msg.file_url, msg.file_name ?? undefined) ? (
                    /* ── Inline image preview ── */
                    <button
                      className="mt-2 block text-left group/img"
                      onClick={() => onImageClick(msg.file_url!)}
                      title="Click to enlarge"
                    >
                      <img
                        src={msg.file_url}
                        alt={msg.file_name ?? 'image'}
                        className="max-w-xs max-h-64 rounded-xl border border-gray-200 object-cover shadow-sm group-hover/img:brightness-90 transition-all duration-200"
                        loading="lazy"
                      />
                      {msg.file_name && (
                        <span className="block text-[10px] text-muted-foreground mt-1">{msg.file_name}</span>
                      )}
                    </button>
                  ) : (
                    /* ── File download card ── */
                    <a
                      href={msg.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2.5 px-3 py-2.5 rounded-xl border bg-gray-50 hover:bg-gray-100 transition text-sm font-medium text-blue-700 max-w-xs"
                    >
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <FileIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate leading-tight text-sm">{msg.file_name ?? 'Download file'}</p>
                        <p className="text-[10px] text-muted-foreground font-normal">Click to open ↗</p>
                      </div>
                    </a>
                  )
                )}
              </div>

              {/* Pin action */}
              {canPin && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-start mt-1">
                  <button
                    onClick={() => onPin(msg.id, msg.is_pinned)}
                    title={msg.is_pinned ? 'Unpin' : 'Pin message'}
                    className={cn(
                      'h-7 w-7 rounded-md flex items-center justify-center transition',
                      msg.is_pinned
                        ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                        : 'text-muted-foreground hover:text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Skeleton & Empty state ────────────────────────────────────

function SkeletonMessages() {
  return (
    <div className="space-y-5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="h-9 w-9 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <div className="h-3 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-100 rounded w-10" />
            </div>
            <div className="h-3 bg-gray-100 rounded" style={{ width: `${50 + (i % 3) * 15}%` }} />
            {i % 2 === 0 && <div className="h-3 bg-gray-100 rounded w-2/5" />}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyChannel({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <div className="h-16 w-16 rounded-2xl bg-[#1E3A8A]/8 border border-[#1E3A8A]/10 flex items-center justify-center mb-4">
        <Hash className="h-8 w-8 text-[#1E3A8A]/20" />
      </div>
      <p className="font-semibold text-gray-700 text-base">Welcome to #{name}</p>
      <p className="text-sm text-muted-foreground mt-1.5">
        This is the very beginning of the channel. Say hello! 👋
      </p>
    </div>
  )
}

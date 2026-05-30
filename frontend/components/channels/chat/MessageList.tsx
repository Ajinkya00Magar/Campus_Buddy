import { useState, useEffect } from 'react'
import { 
  File as FileIcon, Images, Camera, Headphones, Contact, BarChart2, CalendarDays, SmilePlus, Plus,
  Star, Pin, Loader2, ChevronDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, getInitials } from '@/lib/utils'
import type { Message, Poll } from '@/types'
import { 
  type ChatTimelineItem, type ReactionSummary, type MessageContextMenuState 
} from '@/lib/chat-utils'
import { PollTimelineItem } from './PollComponents'
import { FilePreview } from './UIComponents'
import { MessageContextMenu } from './MessageContextMenu'

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

export function PlusAttachmentMenu({
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
      <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-56 border bg-popover p-1 shadow-sm z-[100]">
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

export function EmojiPaletteMenu({ onSelect }: { onSelect: (emoji: string) => void }) {
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
      <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-80 border bg-popover p-2 shadow-sm z-[100]">
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
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

export function MessageList({
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
            className={cn(
              "chat-message-row flex w-full gap-3 py-1 animate-message-in",
              isMine ? "flex-row-reverse" : "flex-row"
            )}
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

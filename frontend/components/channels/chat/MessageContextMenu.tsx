import { useState, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Info, Reply, Copy, Forward, Pin, PinOff, Star, SquareCheck, Save, Share2, Edit3, Trash2, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message } from '@/types'
import type { MessageContextMenuState } from '@/lib/chat-utils'

const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '👏']

export function MessageContextMenu({
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
  onReport,
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
  onReport: (message: Message) => void
}) {
  const { message, isMine, isStarred } = state
  const canManage = isMine || ['admin', 'professor', 'cr'].includes(currentUserRole)
  const menuRef = useRef<HTMLDivElement>(null)
  const reactionBarRef = useRef<HTMLDivElement>(null)
  const actionPanelRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState({ x: state.x, y: state.y, width: 320, actionMaxHeight: 360 })

  useLayoutEffect(() => {
    if (!menuRef.current) return
    const safeLeft = 8
    const safeRight = window.innerWidth - 8
    const safeTop = 8
    const safeBottom = window.innerHeight - 8
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
    { label: 'Report', icon: <Flag className="h-4 w-4" />, action: () => onReport(message), show: !isMine, divider: !canManage },
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

  if (typeof document === 'undefined') return null
  return createPortal(menu, document.body)
}

import type { ReactNode } from 'react'
import { Hash, Image as ImageIcon, FileText, Link as LinkIcon, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatFilter } from '@/lib/chat-utils'

export function ChatFilters({
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

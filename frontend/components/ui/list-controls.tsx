'use client'

import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SortOption } from '@/hooks/useListControls'

interface ListControlsProps<T> {
  query: string
  onQuery: (q: string) => void
  sortKey: string
  onSort: (key: string) => void
  sorts: SortOption<T>[]
  placeholder?: string
  resultCount?: number
}

/** Sticky search box + sort chips shared across list pages. Accessible + touch-friendly. */
export function ListControls<T>({
  query, onQuery, sortKey, onSort, sorts, placeholder = 'Search…', resultCount,
}: ListControlsProps<T>) {
  return (
    <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center gap-2 rounded-xl bg-background/85 px-1 py-2 backdrop-blur">
      <div className="flex h-10 min-w-[180px] flex-1 items-center gap-2 rounded-lg border bg-card px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button onClick={() => onQuery('')} aria-label="Clear search" className="interactive-control shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
        {typeof resultCount === 'number' && (
          <span className="shrink-0 text-[11px] font-medium text-muted-foreground tabular-nums">{resultCount}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Sort by">
        {sorts.map((s) => (
          <button
            key={s.key}
            onClick={() => onSort(s.key)}
            aria-pressed={sortKey === s.key}
            className={cn(
              'min-h-9 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
              sortKey === s.key
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

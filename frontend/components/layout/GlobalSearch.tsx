'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Hash, MessageSquare, User as UserIcon, Loader2, CornerDownLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, getInitials } from '@/lib/utils'
import { searchAll, type SearchResults } from '@/services/search.service'

const EMPTY: SearchResults = { channels: [], messages: [], users: [] }

export default function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>(EMPTY)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const reqId = useRef(0)

  // ⌘K / Ctrl+K opens the palette from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Debounced search.
  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (q.length < 2) {
      setResults(EMPTY)
      setLoading(false)
      return
    }
    setLoading(true)
    const id = ++reqId.current
    const t = window.setTimeout(async () => {
      const res = await searchAll(q)
      if (id === reqId.current) {
        setResults(res)
        setLoading(false)
      }
    }, 250)
    return () => window.clearTimeout(t)
  }, [query, open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults(EMPTY)
    }
  }, [open])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const hasResults =
    results.channels.length > 0 || results.messages.length > 0 || results.users.length > 0
  const showEmpty = query.trim().length >= 2 && !loading && !hasResults

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="interactive-control flex h-9 items-center gap-2 rounded-md border bg-muted/40 px-2.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden text-sm md:inline">Search…</span>
        <kbd className="ml-1 hidden rounded border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground md:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="top-[12%] translate-y-0 max-w-xl gap-0 overflow-hidden p-0 [&>button]:hidden"
        >
          <DialogTitle className="sr-only">Search Campus Buddy</DialogTitle>

          <div className="flex items-center gap-2 border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search channels, messages and people…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
          </div>

          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
            {query.trim().length < 2 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search.
              </p>
            )}

            {showEmpty && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No results for “{query.trim()}”.
              </p>
            )}

            {results.channels.length > 0 && (
              <Section label="Channels">
                {results.channels.map((c) => (
                  <ResultRow key={c.id} onClick={() => go(`/channels/${c.id}`)}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Hash className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">#{c.name}</p>
                      {c.description && (
                        <p className="truncate text-xs text-muted-foreground">{c.description}</p>
                      )}
                    </div>
                  </ResultRow>
                ))}
              </Section>
            )}

            {results.messages.length > 0 && (
              <Section label="Messages">
                {results.messages.map((m) => (
                  <ResultRow key={m.id} onClick={() => go(`/channels/${m.channel_id}`)}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{m.content}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.users?.name ?? 'Someone'}
                        {m.channels?.name ? ` · #${m.channels.name}` : ''}
                      </p>
                    </div>
                  </ResultRow>
                ))}
              </Section>
            )}

            {results.users.length > 0 && (
              <Section label="People">
                {results.users.map((u) => (
                  <ResultRow key={u.id} onClick={() => setOpen(false)}>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={u.avatar_url ?? ''} />
                      <AvatarFallback className="text-[11px]">{getInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="truncate text-xs capitalize text-muted-foreground">
                        {u.role} · {u.email}
                      </p>
                    </div>
                  </ResultRow>
                ))}
              </Section>
            )}
          </div>

          <div className="hidden items-center justify-between border-t px-4 py-2 text-[11px] text-muted-foreground sm:flex">
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" /> to open
            </span>
            <span>esc to close</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}

function ResultRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:outline-none'
      )}
    >
      {children}
    </button>
  )
}

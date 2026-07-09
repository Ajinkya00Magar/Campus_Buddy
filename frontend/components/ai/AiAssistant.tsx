'use client'

import { useRef, useState } from 'react'
import { Sparkles, Send, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Turn = { role: 'user' | 'assistant'; text: string }

/**
 * App-wide "Campus Assistant" FAQ widget. Only rendered when
 * NEXT_PUBLIC_AI_ENABLED === 'true'. Calls /api/ai/ask (provider-agnostic).
 */
export default function AiAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const ask = async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    setTurns((t) => [...t, { role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json().catch(() => null)
      const text = data?.answer
        ? data.answer
        : data?.reason === 'ai-not-configured'
          ? 'The assistant isn’t enabled yet.'
          : 'Sorry, I couldn’t answer that right now.'
      setTurns((t) => [...t, { role: 'assistant', text }])
    } catch {
      setTurns((t) => [...t, { role: 'assistant', text: 'Network error — please try again.' }])
    } finally {
      setLoading(false)
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50)
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ask Campus Buddy"
          className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 active:scale-95"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-5 right-5 z-40 flex h-[70vh] max-h-[560px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold">Campus Assistant</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="interactive-control text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 custom-scrollbar">
            {turns.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ask me about campus life, events, deadlines, or how to use Campus Buddy.
              </p>
            )}
            {turns.map((t, i) => (
              <div key={i} className={cn('flex', t.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm',
                  t.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                )}>
                  {t.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-3 py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask()}
              placeholder="Ask a question…"
              className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={ask}
              disabled={loading || !input.trim()}
              className="interactive-control flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, BookOpen, Hash, Layers3, Lock, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Channel } from '@/types'

const YEAR_LABELS: Record<number, string> = {
  1: 'First Year',
  2: 'Second Year',
  3: 'Third Year',
  4: 'Fourth Year',
}

const SUBJECTS_PER_SEMESTER = 8

interface YearDisclosureProps {
  year: number
  channels: Channel[]
  currentYear: number | null
}

export default function YearDisclosure({ year, channels, currentYear }: YearDisclosureProps) {
  const [open, setOpen] = useState(false)
  const yearChannels = channels.filter((channel) => channel.year === year)
  const activeCount = yearChannels.length

  return (
    <section className="overflow-hidden rounded-[1.5rem] border bg-card shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition-all duration-500 dark:shadow-none">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'relative w-full overflow-hidden p-6 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900',
          open ? 'bg-slate-50 dark:bg-slate-950' : 'bg-white dark:bg-slate-900'
        )}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/10">
              <Layers3 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-extrabold tracking-tight">{YEAR_LABELS[year]}</h2>
                {currentYear === year && (
                  <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Your year
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Click to {open ? 'collapse' : 'open'} {YEAR_LABELS[year].toLowerCase()} subject channels.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-foreground">{activeCount} active</span>
            <span>{yearChannels.length} saved channel{yearChannels.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-500',
          open ? 'max-h-screen py-5 px-5' : 'max-h-0 px-5'
        )}
      >
        <div className="rounded-2xl border bg-background/70 p-4 shadow-sm dark:bg-slate-950/80">
          <div className="rounded-2xl border bg-background/70 p-4 shadow-sm dark:bg-slate-950/80">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Semester 01
                </p>
                <h3 className="mt-1 text-lg font-bold text-foreground">Subject channels</h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: SUBJECTS_PER_SEMESTER }, (_, index) => {
                const subjectNumber = index + 1
                const matchingChannel = yearChannels[index]
                const title = matchingChannel?.description || matchingChannel?.name || `Subject ${String(subjectNumber).padStart(2, '0')}`
                const meta = `Y${year} · Sem 01 · Subject ${String(subjectNumber).padStart(2, '0')}`
                const card = (
                  <div
                    className={cn(
                      'group relative overflow-hidden rounded-2xl border p-4 transition duration-300',
                      matchingChannel
                        ? 'border-primary/15 bg-card shadow-sm hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10'
                        : 'border-dashed bg-muted/35 opacity-75'
                    )}
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 opacity-0 transition group-hover:opacity-100" />
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        matchingChannel ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'
                      )}>
                        <Hash className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-bold text-foreground">{title}</p>
                          {matchingChannel?.is_private && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                        </div>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{meta}</p>
                        {matchingChannel ? (
                          <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                            Open channel
                            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-muted-foreground">Channel not created yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                )

                return matchingChannel ? (
                  <Link
                    key={`${year}-1-${subjectNumber}`}
                    href={`/channels/${matchingChannel.id}`}
                    className="block"
                  >
                    {card}
                  </Link>
                ) : (
                  <div key={`${year}-1-${subjectNumber}`}>{card}</div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

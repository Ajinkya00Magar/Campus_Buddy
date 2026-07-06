'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, BookOpen, Hash, Layers3, Lock, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isYearNoticeChannel, YEAR_LABELS } from '@/utils/channelVisibility'
import type { Channel } from '@/types'

const SUBJECTS_PER_SEMESTER = 8

interface YearDisclosureProps {
  year: number
  channels: Channel[]
  currentYear: number | null
}

export default function YearDisclosure({ year, channels, currentYear }: YearDisclosureProps) {
  const [open, setOpen] = useState(false)
  const yearChannels = channels.filter((channel) => channel.year === year)
  const noticeChannel = yearChannels.find(isYearNoticeChannel)
  const subjectChannels = yearChannels.filter((channel) => !isYearNoticeChannel(channel))
  const activeCount = yearChannels.length

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-card/60 backdrop-blur-3xl border border-white/20 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-all duration-500 dark:border-white/10 dark:shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50" />
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'relative w-full overflow-hidden p-6 text-left transition duration-500',
          open ? 'bg-black/5 dark:bg-white/5' : 'hover:bg-black/5 dark:hover:bg-white/5'
        )}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Layers3 className="h-8 w-8" />
            </div>
            <div className="pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-extrabold tracking-tight">{YEAR_LABELS[year]}</h2>
                {currentYear === year && (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                    Your year
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm font-medium text-muted-foreground">
                Click to {open ? 'collapse' : 'open'} {YEAR_LABELS[year].toLowerCase()} subject channels.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <span className="text-foreground">{activeCount} active</span>
            <span>{yearChannels.length} saved channel{yearChannels.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-500 ease-in-out relative z-10',
          open ? 'max-h-[2000px] opacity-100 py-6 px-6' : 'max-h-0 opacity-0 px-6'
        )}
      >
        <div className="rounded-[2rem] border border-white/20 bg-background/40 backdrop-blur-md p-6 shadow-sm dark:border-white/10 dark:bg-black/20">

            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {YEAR_LABELS[year]} Notices
                </p>
                <h3 className="mt-1 text-lg font-bold text-foreground">Official year notices</h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Megaphone className="h-5 w-5" />
              </div>
            </div>

            {noticeChannel ? (
              <Link
                href={`/channels/${noticeChannel.id}`}
                className="mb-5 block rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg dark:border-amber-900/50 dark:bg-amber-950/20"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                    <Hash className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-bold text-foreground">#notices</p>
                      {noticeChannel.is_private && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                    </div>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {noticeChannel.description || `${YEAR_LABELS[year]} Notices`}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      Open notices
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="mb-5 rounded-2xl border border-dashed bg-muted/35 p-4 text-sm text-muted-foreground">
                Notices channel not created yet.
              </div>
            )}

            <div className="mb-4 flex items-center justify-between gap-3 border-t pt-4">
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
                const matchingChannel = subjectChannels[index]
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
    </section>
  )
}

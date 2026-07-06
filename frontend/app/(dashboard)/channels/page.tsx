import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sparkles, Code2, Users2 } from 'lucide-react'
import YearDisclosure from '@/components/channels/YearDisclosure'
import { filterChannelsForUser, getVisibleChannelYears, isYearChannel } from '@/utils/channelVisibility'
import type { Channel } from '@/types'

export default async function ChannelsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: channels }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('channels').select('*').order('type').order('name'),
  ])

  const allChannels = filterChannelsForUser(channels ?? [], profile)
  const subjectChannels = allChannels.filter(isYearChannel)
  const devChannel = allChannels.find((ch) => ch.name?.toLowerCase() === 'cb') ?? allChannels.find((ch) => {
    const text = `${ch.name ?? ''} ${ch.description ?? ''}`.toLowerCase()
    return ch.type === 'official' && /\b(cb|campus buddy|campusbuddy|dev(eloper|elopment)?|development|dev team|dev-team)\b/.test(text)
  })
  const isAdmin = profile?.role === 'admin'

  const visibleYears = getVisibleChannelYears(profile)

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 pb-10 md:px-0 lg:px-0">
      {/* Header section similar to Spatial UI */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-card/60 backdrop-blur-3xl border border-white/20 p-6 shadow-[0_24px_80px_rgba(236,72,153,0.12)] dark:border-white/10 dark:shadow-[0_24px_80px_rgba(0,0,0,0.3)] md:p-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-400/40 to-transparent" />
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border border-pink-400/20 bg-pink-400/10 blur-sm animate-floaty" />
        <div className="relative max-w-3xl z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/15 bg-pink-500/10 px-3 py-1 text-xs font-bold text-pink-600 dark:text-pink-300">
            <Sparkles className="h-3.5 w-3.5" />
            Curriculum channels
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Browse subject channels for your year
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Computer Science Engineering subject channels are organized by academic year. Year notices are available inside each year section below — not in the sidebar.
          </p>
        </div>
      </section>

      <div className="grid gap-6">
        {visibleYears.map((year) => (
          <YearDisclosure
            key={year}
            year={year}
            channels={subjectChannels as Channel[]}
            currentYear={profile?.year ?? null}
          />
        ))}

        <section className="relative overflow-hidden rounded-[2.5rem] bg-card/60 backdrop-blur-3xl border border-white/20 p-6 shadow-[0_24px_80px_rgba(249,115,22,0.12)] dark:border-white/10 dark:shadow-[0_24px_80px_rgba(0,0,0,0.3)] transition-all duration-500 mt-4 md:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
          <div className="absolute -left-12 -bottom-16 h-44 w-44 rounded-full border border-orange-400/20 bg-orange-400/10 blur-sm animate-floaty" />
          
          <div className="relative z-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/15 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-600 dark:text-orange-300">
                  <Code2 className="h-3.5 w-3.5" />
                  CB-DEV-TEAM
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Development channel</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  All development-related chats are carried out here in the CB channel.
                </p>
              </div>
              <div className="rounded-full border border-orange-500/20 bg-orange-500/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-300 shadow-sm backdrop-blur-sm">
                1 channel
              </div>
            </div>

            <div className="mt-8">
              {devChannel ? (
                <Link
                  href={`/channels/${devChannel.id}`}
                  className="group relative block overflow-hidden rounded-[2rem] bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 p-6 shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:border-orange-500/40"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">CB</p>
                      <h3 className="mt-1 text-2xl font-bold text-foreground group-hover:text-orange-600 transition-colors">CB development chat</h3>
                      <p className="mt-2 text-sm text-muted-foreground font-medium">This single channel is reserved for all team development discussions.</p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                      <Code2 className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="relative z-10 mt-6 flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-widest text-orange-500 transition group-hover:text-orange-600">
                    <span>Open channel</span>
                    <span className="inline-flex h-8 items-center justify-center rounded-full bg-orange-500/10 px-4 text-orange-600 transition-colors group-hover:bg-orange-500/20">Go</span>
                  </div>
                </Link>
              ) : (
                <div className="rounded-[2rem] border border-dashed border-white/20 bg-card/20 backdrop-blur-sm p-8 text-center text-sm font-medium text-muted-foreground">
                  <Users2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
                  <p>The CB development channel has not been created yet.</p>
                  {isAdmin ? (
                    <div className="mt-6">
                      <Link
                        href="/admin/channels"
                        className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-lg transition hover:bg-primary/90 hover:-translate-y-0.5"
                      >
                        Create CB channel in Admin
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs backdrop-blur-md">
                      Ask an admin to create the CB development channel.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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
  const cbChannel = allChannels.find((ch) => ch.name?.toLowerCase() === 'cb')
  const isAdmin = profile?.role === 'admin'

  const visibleYears = getVisibleChannelYears(profile)

  return (
    <div className="space-y-8 px-4 pb-10 md:px-6 lg:px-8">
      <div className="rounded-[2rem] border bg-card p-8 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">Curriculum channels</p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Browse subject channels for your year
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Computer Science Engineering subject channels are organized by academic year. Year notices are available inside each year section below — not in the sidebar.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {visibleYears.map((year) => (
          <YearDisclosure
            key={year}
            year={year}
            channels={subjectChannels as Channel[]}
            currentYear={profile?.year ?? null}
          />
        ))}

        <section className="overflow-hidden rounded-[1.5rem] border bg-card shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition-all duration-500 dark:shadow-none">
          <div className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">CB-DEV-TEAM</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">Development channel</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  All development-related chats are carried out here in the CB channel.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-foreground dark:border-slate-700 dark:bg-slate-950">
                1 channel
              </div>
            </div>

            <div className="mt-6">
              {cbChannel ? (
                <Link
                  href={`/channels/${cbChannel.id}`}
                  className="group block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-primary/40 hover:shadow-lg dark:border-slate-700 dark:bg-slate-950"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">CB</p>
                      <h3 className="mt-2 text-2xl font-bold text-foreground">CB development chat</h3>
                      <p className="mt-2 text-sm text-muted-foreground">This single channel is reserved for all team development discussions.</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
                      CB
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-4 text-sm font-semibold text-primary transition group-hover:text-primary/90">
                    <span>Open channel</span>
                    <span className="inline-flex h-9 items-center rounded-full bg-primary/10 px-3 text-primary">Go</span>
                  </div>
                </Link>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-muted/20 p-6 text-sm text-muted-foreground">
                  <p>The CB development channel has not been created yet. Once created, it will appear here.</p>
                  {isAdmin ? (
                    <div className="mt-4">
                      <Link
                        href="/admin/channels"
                        className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                      >
                        Create CB channel in Admin
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                      Ask an admin to create the CB development channel so you can open it from here.
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

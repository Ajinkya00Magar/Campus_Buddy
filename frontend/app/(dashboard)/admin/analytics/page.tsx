import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, BarChart3, Users, MessageSquare, UserPlus, Activity, Hash, ShieldAlert } from 'lucide-react'
import { getAdminAnalytics } from '@/services/analytics.service'

export const dynamic = 'force-dynamic'

// App-standard role colors (kept consistent with the rest of admin); each bar is
// also labeled, so identity never relies on color alone.
const roleBar: Record<string, string> = {
  admin: 'bg-red-500',
  professor: 'bg-amber-500',
  cr: 'bg-indigo-500',
  student: 'bg-blue-500',
}
const roleLabel: Record<string, string> = {
  admin: 'Admins',
  professor: 'Faculty',
  cr: 'Class reps',
  student: 'Students',
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { totals, daily, topChannels, roleCounts } = await getAdminAnalytics(supabase)

  const tiles = [
    { label: 'Total users', value: totals.users, icon: Users, hint: `+${totals.newUsers7d} this week` },
    { label: 'New users (7d)', value: totals.newUsers7d, icon: UserPlus },
    { label: 'Total messages', value: totals.messages, icon: MessageSquare, hint: `+${totals.messages7d} this week` },
    { label: 'Active senders (7d)', value: totals.activeSenders7d, icon: Activity },
    { label: 'Channels', value: totals.channels, icon: Hash },
    { label: 'Open reports', value: totals.openReports, icon: ShieldAlert },
  ]

  const maxDaily = Math.max(1, ...daily.map((d) => d.total))
  const maxRole = Math.max(1, ...roleCounts.map((r) => r.total))
  const maxChannel = Math.max(1, ...topChannels.map((c) => c.total))

  // Bar-chart geometry (viewBox units; scales responsively).
  const W = 720
  const H = 220
  const padX = 8
  const padBottom = 22
  const slot = (W - padX * 2) / Math.max(daily.length, 1)
  const barW = Math.max(6, slot - 6)
  const plotH = H - padBottom
  const fmtDay = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="interactive-control flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground hover:bg-accent hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm">Platform activity at a glance.</p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {tiles.map(({ label, value, icon: Icon, hint }) => (
          <Card key={label} className="border">
            <CardContent className="p-4">
              <Icon className="h-4 w-4 text-muted-foreground mb-2" />
              <p className="text-2xl font-bold text-foreground tabular-nums">{value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
              {hint && <p className="mt-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">{hint}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Messages per day */}
      <Card className="border">
        <CardContent className="p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-foreground">Messages per day</h2>
            <span className="text-xs text-muted-foreground">Last {daily.length} days · peak {maxDaily.toLocaleString()}</span>
          </div>
          {daily.every((d) => d.total === 0) ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No messages in this window yet.</p>
          ) : (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Bar chart of messages sent per day">
              <line x1={padX} y1={plotH} x2={W - padX} y2={plotH} className="stroke-border" strokeWidth={1} />
              {daily.map((d, i) => {
                const h = Math.round((d.total / maxDaily) * (plotH - 8))
                const x = padX + i * slot + (slot - barW) / 2
                const y = plotH - h
                const showLabel = i === 0 || i === daily.length - 1 || i === Math.floor(daily.length / 2)
                return (
                  <g key={d.day}>
                    <rect x={x} y={y} width={barW} height={Math.max(h, 1)} rx={4} className="fill-primary">
                      <title>{`${fmtDay(d.day)}: ${d.total.toLocaleString()} message${d.total === 1 ? '' : 's'}`}</title>
                    </rect>
                    {showLabel && (
                      <text x={x + barW / 2} y={H - 6} textAnchor="middle" className="fill-muted-foreground" fontSize={11}>
                        {fmtDay(d.day)}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Users by role */}
        <Card className="border">
          <CardContent className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Users by role</h2>
            <div className="space-y-3">
              {roleCounts.map((r) => (
                <div key={r.role}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{roleLabel[r.role] ?? r.role}</span>
                    <span className="tabular-nums text-muted-foreground">{r.total.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${roleBar[r.role] ?? 'bg-primary'}`}
                      style={{ width: `${Math.round((r.total / maxRole) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top channels */}
        <Card className="border">
          <CardContent className="p-5">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Busiest channels</h2>
            <p className="mb-4 text-xs text-muted-foreground">By messages in the last 30 days</p>
            {topChannels.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {topChannels.map((c) => (
                  <div key={c.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Hash className="h-3 w-3 text-muted-foreground" />{c.name}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{c.total.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((c.total / maxChannel) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

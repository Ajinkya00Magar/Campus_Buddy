import type { SupabaseClient } from '@supabase/supabase-js'

export type DailyCount = { day: string; total: number }
export type NamedCount = { name: string; total: number }
export type RoleCount = { role: string; total: number }

export type AdminAnalytics = {
  totals: {
    users: number
    newUsers7d: number
    messages: number
    messages7d: number
    activeSenders7d: number
    channels: number
    openReports: number
  }
  daily: DailyCount[]
  topChannels: NamedCount[]
  roleCounts: RoleCount[]
}

const ROLES = ['student', 'cr', 'professor', 'admin'] as const

const sevenDaysAgo = () => {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString()
}

/** Aggregate admin analytics. Pass a SERVER supabase client (has the admin session). */
export async function getAdminAnalytics(supabase: SupabaseClient): Promise<AdminAnalytics> {
  const since = sevenDaysAgo()

  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0)

  const [
    users,
    newUsers7d,
    messages,
    messages7d,
    channels,
    openReports,
    activeSendersRes,
    dailyRes,
    topRes,
    ...roleResults
  ] = await Promise.all([
    count(supabase.from('users').select('*', { count: 'exact', head: true })),
    count(supabase.from('users').select('*', { count: 'exact', head: true }).gt('created_at', since)),
    count(supabase.from('messages').select('*', { count: 'exact', head: true })),
    count(supabase.from('messages').select('*', { count: 'exact', head: true }).gt('created_at', since)),
    count(supabase.from('channels').select('*', { count: 'exact', head: true })),
    count(supabase.from('message_reports').select('*', { count: 'exact', head: true }).eq('status', 'open')),
    supabase.rpc('admin_active_sender_count', { p_days: 7 }),
    supabase.rpc('admin_daily_message_counts', { p_days: 14 }),
    supabase.rpc('admin_top_channels', { p_days: 30, p_limit: 5 }),
    ...ROLES.map((role) =>
      count(supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', role))
    ),
  ])

  const daily: DailyCount[] = (dailyRes.data ?? []).map((r: { day: string; total: number }) => ({
    day: r.day,
    total: Number(r.total),
  }))
  const topChannels: NamedCount[] = (topRes.data ?? []).map((r: { name: string; total: number }) => ({
    name: r.name,
    total: Number(r.total),
  }))
  const roleCounts: RoleCount[] = ROLES.map((role, i) => ({ role, total: roleResults[i] as number }))

  return {
    totals: {
      users,
      newUsers7d,
      messages,
      messages7d,
      activeSenders7d: Number(activeSendersRes.data ?? 0),
      channels,
      openReports,
    },
    daily,
    topChannels,
    roleCounts,
  }
}

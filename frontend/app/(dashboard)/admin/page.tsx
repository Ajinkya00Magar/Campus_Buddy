import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Calendar, BookOpen, Hash, Users2, ArrowRight, Shield, ShieldAlert, BarChart3 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [
    { count: usersCount },
    { count: eventsCount },
    { count: coursesCount },
    { count: channelsCount },
    { count: clubsCount },
    { count: openReportsCount },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('channels').select('*', { count: 'exact', head: true }),
    supabase.from('clubs').select('*', { count: 'exact', head: true }),
    supabase.from('message_reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('users').select('name, email, role, avatar_url, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { title: 'Users',    count: usersCount,    icon: Users,        href: '/admin/users',    color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-100 dark:border-blue-900/30' },
    { title: 'Events',   count: eventsCount,   icon: Calendar,     href: '/admin/events',   color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-100 dark:border-green-900/30' },
    { title: 'Courses',  count: coursesCount,  icon: BookOpen,     href: '/admin/courses',  color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-100 dark:border-violet-900/30' },
    { title: 'Channels', count: channelsCount, icon: Hash,         href: '/admin/channels', color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-100 dark:border-amber-900/30' },
    { title: 'Clubs',    count: clubsCount,    icon: Users2,       href: '/admin/clubs',    color: 'text-rose-600 dark:text-rose-400',   bg: 'bg-rose-50 dark:bg-rose-900/20',   border: 'border-rose-100 dark:border-rose-900/30' },
    { title: 'Reports',  count: openReportsCount, icon: ShieldAlert, href: '/admin/moderation', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-900/30' },
  ]

  const quickLinks = [
    { title: 'Analytics', desc: 'Activity, growth & busiest channels', icon: BarChart3, href: '/admin/analytics' },
  ]

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    professor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    cr: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  }
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">Manage all campus resources</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(({ title, count, icon: Icon, href, color, bg, border }) => (
          <Link key={title} href={href}>
            <Card className={`hover:shadow-md transition-all cursor-pointer group border ${border}`}>
              <CardContent className="pt-4 pb-4">
                <div className={`inline-flex p-2 rounded-lg ${bg} mb-2 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className="text-xl font-bold text-foreground">{count ?? 0}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{title}</p>
                  <ArrowRight className={`h-3 w-3 ${color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map(({ title, desc, icon: Icon, href }) => (
          <Link key={title} href={href}>
            <Card className="group border hover:shadow-md transition-all cursor-pointer">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="inline-flex p-2.5 rounded-lg bg-primary/10 group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground truncate">{desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Users */}
      <Card>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2 text-foreground">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Recent Signups
          </h2>
          <Link href="/admin/users" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y border-border">
          {(recentUsers ?? []).map((u: any, i: number) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/50 transition-colors">
              <Avatar className="h-9 w-9 border border-border shadow-sm shrink-0">
                <AvatarImage src={u.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                  {getInitials(u.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{u.name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${roleColors[u.role]}`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Create Event', href: '/events/create', icon: Calendar, color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' },
          { label: 'Add Channel', href: '/admin/channels', icon: Hash, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30' },
          { label: 'Manage Clubs', href: '/admin/clubs', icon: Users2, color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30' },
          { label: 'Add Course', href: '/admin/courses', icon: BookOpen, color: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30' },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link key={label} href={href}>
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl ${color} transition cursor-pointer border border-transparent hover:border-border shadow-sm`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-semibold">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

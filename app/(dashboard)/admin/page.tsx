import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Calendar, BookOpen, Hash, Users2, ArrowRight, Shield } from 'lucide-react'

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
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('channels').select('*', { count: 'exact', head: true }),
    supabase.from('clubs').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('name, email, role, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { title: 'Users',    count: usersCount,    icon: Users,        href: '/admin/users',    color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100' },
    { title: 'Events',   count: eventsCount,   icon: Calendar,     href: '/admin/events',   color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100' },
    { title: 'Courses',  count: coursesCount,  icon: BookOpen,     href: '/admin/courses',  color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { title: 'Channels', count: channelsCount, icon: Hash,         href: '/admin/channels', color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100' },
    { title: 'Clubs',    count: clubsCount,    icon: Users2,       href: '/admin/clubs',    color: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-100' },
  ]

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    teacher: 'bg-amber-100 text-amber-700',
    student: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
          <Shield className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">Manage all campus resources</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(({ title, count, icon: Icon, href, color, bg, border }) => (
          <Link key={title} href={href}>
            <Card className={`hover:shadow-md transition-all cursor-pointer group border ${border}`}>
              <CardContent className="pt-4 pb-4">
                <div className={`inline-flex p-2 rounded-lg ${bg} mb-2 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className="text-xl font-bold text-gray-900">{count ?? 0}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{title}</p>
                  <ArrowRight className={`h-3 w-3 ${color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Users */}
      <Card>
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" /> Recent Signups
          </h2>
          <Link href="/admin/users" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y">
          {(recentUsers ?? []).map((u: any, i: number) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3">
              <div className="h-9 w-9 rounded-full bg-[#1E3A8A] text-white text-sm font-bold flex items-center justify-center shrink-0">
                {u.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{u.name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${roleColors[u.role]}`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Create Event', href: '/events/create', icon: Calendar, color: 'text-green-600 bg-green-50 hover:bg-green-100' },
          { label: 'Add Channel', href: '/admin/channels', icon: Hash, color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
          { label: 'Manage Clubs', href: '/admin/clubs', icon: Users2, color: 'text-rose-600 bg-rose-50 hover:bg-rose-100' },
          { label: 'Add Course', href: '/admin/courses', icon: BookOpen, color: 'text-violet-600 bg-violet-50 hover:bg-violet-100' },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link key={label} href={href}>
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl ${color} transition cursor-pointer border border-transparent hover:border-current/10`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

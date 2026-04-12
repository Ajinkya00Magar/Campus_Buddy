import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users2, BookOpen, Hash, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatEventDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

  const [
    { count: eventsCount },
    { count: clubsCount },
    { count: coursesCount },
    { count: channelsCount },
    { data: upcomingEvents },
    { data: recentCourses },
    { data: completions },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('clubs').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('channels').select('*', { count: 'exact', head: true }),
    supabase.from('events')
      .select('id,title,event_date,category,location')
      .eq('is_published', true)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(4),
    supabase.from('courses')
      .select('id,title,level,tags')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase.from('course_completions')
      .select('course_id')
      .eq('user_id', user.id),
  ])

  const completedIds = new Set((completions ?? []).map((c: any) => c.course_id))

  const quickCards = [
    { title: 'Events',   count: eventsCount ?? 0,   icon: Calendar, href: '/events',   color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100' },
    { title: 'Clubs',    count: clubsCount ?? 0,    icon: Users2,   href: '/clubs',    color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { title: 'Courses',  count: coursesCount ?? 0,  icon: BookOpen, href: '/courses',  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { title: 'Channels', count: channelsCount ?? 0, icon: Hash,     href: '/channels', color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100' },
  ]

  const categoryColors: Record<string, string> = {
    technical: 'bg-blue-100 text-blue-700',
    cultural: 'bg-pink-100 text-pink-700',
    sports: 'bg-green-100 text-green-700',
    academic: 'bg-purple-100 text-purple-700',
    placement: 'bg-orange-100 text-orange-700',
    general: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {profile?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here&apos;s what&apos;s happening on campus today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickCards.map(({ title, count, icon: Icon, href, color, bg, border }) => (
          <Link key={title} href={href}>
            <Card className={`hover:shadow-md transition-all duration-200 cursor-pointer border ${border} group`}>
              <CardContent className="pt-5 pb-4">
                <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3 group-hover:scale-105 transition-transform`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-sm text-muted-foreground">{title}</p>
                  <ArrowRight className={`h-3.5 w-3.5 ${color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Upcoming Events
            </CardTitle>
            <Link href="/events" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {!upcomingEvents?.length ? (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              </div>
            ) : (
              upcomingEvents.map((event: any) => (
                <Link key={event.id} href={`/events/${event.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition group border border-transparent hover:border-gray-100">
                  <div className="h-12 w-12 rounded-xl bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-[#1E3A8A] leading-tight">
                      {new Date(event.event_date).getDate()}
                    </span>
                    <span className="text-[9px] text-[#3B82F6] uppercase font-semibold">
                      {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate group-hover:text-[#1E3A8A] transition-colors">{event.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.event_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${categoryColors[event.category] ?? categoryColors.general}`}>
                        {event.category}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              Courses
            </CardTitle>
            <Link href="/courses" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              All <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!recentCourses?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">No courses yet</p>
            ) : (
              recentCourses.map((course: any) => (
                <Link key={course.id} href={`/courses/${course.id}`}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition group">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate group-hover:text-emerald-700">{course.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] capitalize text-muted-foreground">{course.level}</span>
                      {completedIds.has(course.id) && (
                        <span className="text-[10px] text-emerald-600 font-medium">✓ Done</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

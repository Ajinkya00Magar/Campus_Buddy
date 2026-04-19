import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users2, BookOpen, Hash, TrendingUp, ArrowRight, Clock, Sparkles, Trophy } from 'lucide-react'
import Link from 'next/link'
import type { ElementType } from 'react'

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
    supabase.from('course_completions').select('course_id').eq('user_id', user.id),
  ])

  const completedIds = new Set((completions ?? []).map((c: any) => c.course_id))

  const quickCards = [
    { title: 'Events',   count: eventsCount ?? 0,   icon: Calendar, href: '/events',   color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-100 dark:border-blue-800/30' },
    { title: 'Clubs',    count: clubsCount ?? 0,    icon: Users2,   href: '/clubs',    color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-100 dark:border-violet-800/30' },
    { title: 'Courses',  count: coursesCount ?? 0,  icon: BookOpen, href: '/courses',  color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800/30' },
    { title: 'Channels', count: channelsCount ?? 0, icon: Hash,     href: '/channels', color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-100 dark:border-amber-800/30' },
  ]

  const catColors: Record<string, string> = {
    technical: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    cultural:  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    sports:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    academic:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    placement: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    general:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Greeting */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.25),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(239,246,255,0.74))] p-6 shadow-[0_24px_80px_rgba(30,58,138,0.14)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.2),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(17,24,39,0.86))] md:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-primary/20 bg-primary/10 blur-sm" />
        <div className="absolute bottom-[-7rem] right-1/4 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Campus command center
            </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
          Good {getGreeting()}, {profile?.name?.split(' ')[0]} 👋
        </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              Your events, clubs, courses, and conversations are ready. Everything happening on campus today, polished into one live workspace.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <HeroMetric label="Courses Done" value={String(completions?.length ?? 0)} icon={Trophy} />
            <HeroMetric label="Live Areas" value="4" icon={Hash} />
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {quickCards.map(({ title, count, icon: Icon, href, color, bg, border }) => (
          <Link key={title} href={href}>
            <Card className={`hover:shadow-md transition-all duration-200 cursor-pointer border ${border} group`}>
              <CardContent className="pt-5 pb-4">
                <div className={`inline-flex p-2.5 rounded-2xl ${bg} mb-3 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="text-3xl font-extrabold text-foreground">{count}</p>
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
              <TrendingUp className="h-4 w-4 text-primary" /> Upcoming Events
            </CardTitle>
            <Link href="/events" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {!upcomingEvents?.length ? (
              <div className="text-center py-10">
                <Calendar className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              </div>
            ) : upcomingEvents.map((event: any) => (
              <Link key={event.id} href={`/events/${event.id}`}
                className="interactive-control flex items-center gap-3 p-3 rounded-2xl hover:bg-accent transition group border border-transparent hover:border-primary/20 hover:-translate-y-0.5">
                <div className="h-12 w-12 rounded-xl bg-primary/8 dark:bg-primary/15 border border-primary/15 flex flex-col items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary leading-tight">
                    {new Date(event.event_date).getDate()}
                  </span>
                  <span className="text-[9px] text-primary/70 uppercase font-semibold">
                    {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">{event.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.event_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${catColors[event.category] ?? catColors.general}`}>
                      {event.category}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-600" /> Courses
            </CardTitle>
            <Link href="/courses" className="text-xs text-primary hover:underline flex items-center gap-1">
              All <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!recentCourses?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">No courses yet</p>
            ) : recentCourses.map((course: any) => (
              <Link key={course.id} href={`/courses/${course.id}`}
                  className="interactive-control flex items-start gap-3 p-2.5 rounded-2xl hover:bg-accent transition group hover:-translate-y-0.5">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{course.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] capitalize text-muted-foreground">{course.level}</span>
                    {completedIds.has(course.id) && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Done</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
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

function HeroMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: ElementType
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="mb-2 flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" />
        <p className="text-[11px] font-bold uppercase tracking-[0.18em]">{label}</p>
      </div>
      <p className="text-3xl font-extrabold leading-none text-foreground">{value}</p>
    </div>
  )
}

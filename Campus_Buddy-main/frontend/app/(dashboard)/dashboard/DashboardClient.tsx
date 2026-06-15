'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar, Users2, BookOpen, Hash, TrendingUp, ArrowRight, Clock, 
  Trophy, MessageSquare, Star, Sparkles, LayoutGrid, Bell
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useChannels } from '@/hooks/useChannels'
import { useEvents } from '@/hooks/useEvents'
import { useCourses } from '@/hooks/useCourses'
import type { User, Channel, Event, Course } from '@/types'

export default function DashboardClient({
  profile,
  initialEvents,
  initialCourses,
  initialChannels,
  completedIds,
  counts
}: {
  profile: User | null
  initialEvents: Event[]
  initialCourses: Course[]
  initialChannels: Channel[]
  completedIds: Set<string>
  counts: { events: number, clubs: number, courses: number }
}) {
  // Use our realtime hooks
  const allChannels = useChannels(initialChannels, profile)
  const events = useEvents(initialEvents)
  const courses = useCourses(initialCourses)

  // Filter channels using the same logic as the sidebar
  const yourChannels = allChannels.slice(0, 4) // Hooks already handle basic filtering

  const stats = [
    { label: 'Events', value: counts.events, icon: Calendar, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Clubs', value: counts.clubs, icon: Users2, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Courses', value: counts.courses, icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Channels', value: allChannels.length, icon: Hash, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ]

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date()).slice(0, 3)

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-32 bg-primary/5 -skew-x-12 translate-x-10" />
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Hello, {profile?.name?.split(' ')[0]}! <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Welcome to your MITAOE campus dashboard. Here's your overview for today.
          </p>
        </div>
        <div className="relative flex gap-3">
          <div className="rounded-xl bg-muted/50 px-4 py-2 border border-border">
            <p className="text-[10px] font-bold uppercase text-muted-foreground/80 tracking-wider">Year</p>
            <p className="text-base font-black text-foreground">{profile?.year ?? '—'}</p>
          </div>
          <div className="rounded-xl bg-muted/50 px-4 py-2 border border-border">
            <p className="text-[10px] font-bold uppercase text-muted-foreground/80 tracking-wider">PRN</p>
            <p className="text-base font-mono font-bold text-foreground">{profile?.email?.split('@')[0]}</p>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl shrink-0 shadow-sm", s.bg)}>
              <s.icon className={cn("h-6 w-6", s.color)} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide leading-none">{s.label}</p>
              <p className="text-2xl font-black text-foreground mt-1.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* Your Channels */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-500" /> Active Channels
              </h2>
              <Link href="/channels" className="text-xs font-bold text-primary hover:underline uppercase tracking-tight">Browse all</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {yourChannels.length === 0 ? (
                <div className="col-span-2 rounded-2xl border border-dashed p-8 text-center bg-muted/10">
                  <p className="text-sm font-medium text-muted-foreground">No active channels found for your academic year.</p>
                </div>
              ) : yourChannels.map((ch: any) => (
                <Link key={ch.id} href={`/channels/${ch.id}`}>
                  <div className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-all hover:bg-muted/50 hover:border-primary/20 hover:shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <Hash className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate text-foreground group-hover:text-primary transition-colors">#{ch.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate uppercase font-bold opacity-70 tracking-tighter mt-0.5">{ch.type}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Upcoming Events */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" /> Campus Schedule
              </h2>
            </div>
            <div className="grid gap-3">
              {upcomingEvents.length === 0 ? (
                <div className="rounded-2xl border p-8 text-center bg-muted/5">
                   <p className="text-sm text-muted-foreground">No upcoming events scheduled at the moment.</p>
                </div>
              ) : upcomingEvents.map((event: any) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className="group flex items-center gap-5 rounded-2xl border bg-card p-4 transition-all hover:bg-muted/50 hover:shadow-sm">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/10">
                      <span className="text-lg leading-none">{new Date(event.event_date).getDate()}</span>
                      <span className="text-[10px] uppercase tracking-tighter mt-0.5">{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">{event.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-semibold">
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {new Date(event.event_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>·</span>
                        <span className="truncate">{event.location ?? 'Campus'}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="rounded-2xl border bg-emerald-500/5 dark:bg-emerald-500/10 shadow-none border-emerald-500/10 overflow-hidden">
            <div className="bg-emerald-500/10 px-4 py-3 border-b border-emerald-500/10">
              <h3 className="text-xs font-black uppercase tracking-[0.25rem] text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                < BookOpen className="h-4 w-4" /> Academics
              </h3>
            </div>
            <CardContent className="space-y-2 px-3 py-3">
              {courses.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 italic">Discover and start new courses</p>
              ) : courses.map((course: any) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <div className="group flex items-center gap-3 rounded-xl bg-background/50 p-2.5 border border-transparent hover:border-emerald-500/20 transition-all hover:shadow-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <p className="font-bold text-xs truncate text-foreground flex-1 group-hover:text-emerald-600 transition-colors">{course.title}</p>
                    {completedIds.has(course.id) && <Trophy className="h-3.5 w-3.5 text-emerald-500" />}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
             <QuickNav label="Profile" icon={Users2} href="/settings" />
             <QuickNav label="Notifs" icon={Bell} href="/notifications" />
             <QuickNav label="Map" icon={LayoutGrid} href="/channels" />
             <QuickNav label="Help" icon={Star} href="/settings" />
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickNav({ label, icon: Icon, href }: { label: string, icon: any, href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-5 transition-all hover:bg-accent text-muted-foreground hover:text-foreground group border-border hover:shadow-md hover:-translate-y-0.5">
      <Icon className="h-5 w-5 group-hover:text-primary transition-all duration-300" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </Link>
  )
}

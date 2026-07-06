'use client'

import { 
  Calendar, Users2, BookOpen, Hash, Clock, 
  MessageSquare, Zap, Compass, PlayCircle, MapPin, Sparkles, MoveRight, TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useEvents } from '@/hooks/useEvents'
import { useCourses } from '@/hooks/useCourses'
import { useChannels } from '@/hooks/useChannels'
import { getProfileDepartmentDisplay } from '@/utils/department'
import { m } from 'framer-motion'
import type { User, Channel, Event, Course } from '@/types'
import { ReactNode } from 'react'
import { SpatialCard } from '@/components/ui/spatial-card'


function ActionButton({ icon: Icon, label, desc, href, delay }: any) {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, type: 'spring' }}
    >
      <Link href={href} className="relative flex items-center p-4 sm:p-5 rounded-[2rem] bg-card/40 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:bg-background/80 transition-all group overflow-hidden h-full">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
        <div className="h-12 w-12 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-4 group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all duration-500">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-foreground truncate">{label}</p>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5 truncate">{desc}</p>
        </div>
        <MoveRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 shrink-0" />
      </Link>
    </m.div>
  )
}

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
  const events = useEvents(initialEvents)
  const courses = useCourses(initialCourses)
  const allChannels = useChannels(initialChannels, profile)
  
  // Intelligence context
  const yourChannels = allChannels.slice(0, 3)
  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date())
  const nextEvent = upcomingEvents[0]
  
  // Find a course to resume (one that is NOT completed)
  const resumeCourse = courses.find(c => !completedIds.has(c.id))
  
  const departmentLabel = getProfileDepartmentDisplay(profile)

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-12 pt-4 px-2 sm:px-4">

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* 1. Dynamic Island Header */}
        <m.div 
          initial={{ opacity: 0, y: -40, width: '120px' }}
          animate={{ opacity: 1, y: 0, width: '100%' }}
          transition={{ 
            duration: 1.2, 
            type: 'spring', 
            bounce: 0.4,
            delay: 0.1
          }}
          className="mx-auto flex items-center justify-between gap-4 rounded-full bg-background/60 backdrop-blur-3xl border border-border/50 p-3 shadow-2xl mb-12 relative overflow-hidden origin-top"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          
          <m.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
            className="flex items-center gap-4 min-w-0"
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden whitespace-nowrap">
              <span className="text-sm sm:text-base font-black text-foreground leading-tight truncate">Welcome back, {profile?.name?.split(' ')[0]}</span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold truncate">
                {departmentLabel} • Year {profile?.year ?? '—'}
              </span>
            </div>
          </m.div>

          <m.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
            className="hidden sm:flex items-center gap-3 pr-4 shrink-0 whitespace-nowrap"
          >
             <div className="flex items-center gap-2 rounded-full bg-background/50 border border-border/50 px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">System Online</span>
             </div>
          </m.div>
        </m.div>

        {/* The Dashboard Command Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          
          {/* UP NEXT (Center Stage) - Spans 8 cols */}
          <SpatialCard delay={0.1} className="lg:col-span-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border-blue-200/40 dark:border-blue-500/30">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-400/20 rounded-full blur-[80px] opacity-60 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-10 z-10">
              <div className="flex items-center gap-3 rounded-full bg-background/60 backdrop-blur-xl px-4 py-2 border border-border/50 shadow-sm">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Priority Action</span>
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{upcomingEvents.length} Pending</span>
            </div>

            {nextEvent ? (
              <div className="flex-1 flex flex-col lg:flex-row gap-8 items-start lg:items-end justify-between z-10 mt-auto">
                <div className="max-w-xl">
                  <p className="text-[10px] uppercase font-bold text-primary mb-3 tracking-widest">Next Event</p>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.1] mb-6">
                    {nextEvent.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-bold text-muted-foreground">
                    <span className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-1.5"><Clock className="h-4 w-4" /> {formatTime(nextEvent.event_date)}</span>
                    <span className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-1.5"><MapPin className="h-4 w-4" /> {nextEvent.location ?? 'Campus'}</span>
                  </div>
                </div>
                <Link href={`/events/${nextEvent.id}`} className="shrink-0 group/btn relative overflow-hidden rounded-full bg-primary text-primary-foreground px-8 py-4 font-black uppercase tracking-wider text-[11px] shadow-[0_0_40px_rgba(var(--primary),0.3)] transition-transform duration-500 hover:scale-105 hover:shadow-[0_0_60px_rgba(var(--primary),0.5)] flex items-center gap-3">
                   <PlayCircle className="h-5 w-5" />
                   Join Event
                   <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform duration-500 group-hover/btn:translate-y-0" />
                </Link>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center py-10 opacity-50 z-10">
                 <Calendar className="h-12 w-12 mb-4" />
                 <p className="text-lg font-bold">Your schedule is perfectly clear!</p>
              </div>
            )}
          </SpatialCard>

          {/* QUICK ACTIONS ROW (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6">
            <ActionButton 
              icon={BookOpen} 
              label={resumeCourse ? "Resume Course" : "Browse Courses"} 
              desc={resumeCourse ? resumeCourse.title : "Start learning"} 
              href={resumeCourse ? `/courses/${resumeCourse.id}` : "/courses"} 
              delay={0.2} 
            />
            <ActionButton 
              icon={Compass} 
              label="Explore Campus" 
              desc="View map and locations" 
              href="/campus" 
              delay={0.25} 
            />
            <ActionButton 
              icon={Users2} 
              label="Join a Club" 
              desc="Discover communities" 
              href="/clubs" 
              delay={0.3} 
            />
          </div>

          {/* ACTIVE CHANNELS (Spans 6 cols) */}
          <SpatialCard delay={0.4} className="lg:col-span-6 flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-3 text-foreground/80">
                 <div className="h-8 w-8 rounded-full bg-sky-500/10 flex items-center justify-center">
                   <MessageSquare className="h-4 w-4 text-sky-500" /> 
                 </div>
                 Recent Chat Activity
              </h2>
            </div>
            <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto custom-scrollbar pr-2">
               {yourChannels.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-border/50 rounded-3xl">
                   <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">No recent messages</p>
                  </div>
               ) : (
                  yourChannels.map((ch: any) => (
                    <Link key={ch.id} href={`/channels/${ch.id}`} className="group/ch flex items-center gap-4 p-4 rounded-[1.5rem] bg-background/40 hover:bg-background/80 border border-transparent hover:border-border/50 transition-all shrink-0">
                       <div className="h-10 w-10 shrink-0 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover/ch:bg-sky-500 group-hover/ch:text-white transition-colors duration-500">
                         <Hash className="h-4 w-4" />
                       </div>
                       <div className="min-w-0 flex-1">
                         <div className="flex items-center justify-between">
                           <p className="font-black text-sm truncate text-foreground">{ch.name}</p>
                           <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                         </div>
                         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-70 truncate">{ch.type} • Tap to view</p>
                       </div>
                    </Link>
                  ))
               )}
            </div>
          </SpatialCard>

          {/* QUICK GLANCE STATS (Spans 6 cols) */}
          <SpatialCard delay={0.5} className="lg:col-span-6 flex flex-col min-h-[380px] bg-gradient-to-tr from-emerald-500/5 to-transparent">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-3 text-foreground/80">
                 <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                   <TrendingUp className="h-4 w-4 text-emerald-500" />
                 </div>
                 Your Progress
              </h2>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
               <div className="flex flex-col justify-center p-6 rounded-[2rem] bg-background/50 border border-border/50 hover:scale-[1.02] transition-transform">
                 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Completed</p>
                 <p className="text-4xl font-black text-emerald-500">{completedIds.size}</p>
                 <p className="text-xs font-bold text-foreground mt-2">Courses</p>
               </div>
               <div className="flex flex-col justify-center p-6 rounded-[2rem] bg-background/50 border border-border/50 hover:scale-[1.02] transition-transform">
                 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Engaged In</p>
                 <p className="text-4xl font-black text-purple-500">{counts.clubs}</p>
                 <p className="text-xs font-bold text-foreground mt-2">Clubs</p>
               </div>
               <div className="col-span-2 flex flex-col justify-center p-6 rounded-[2rem] bg-background/50 border border-border/50 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Campus</p>
                      <p className="text-2xl font-black text-amber-500">{counts.events}</p>
                      <p className="text-xs font-bold text-foreground mt-1">Upcoming Events</p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Calendar className="h-6 w-6" />
                    </div>
                  </div>
               </div>
            </div>
          </SpatialCard>

        </div>
      </div>
    </div>
  )
}

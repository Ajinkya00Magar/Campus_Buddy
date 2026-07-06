'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Users, Sparkles, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEvents } from '@/hooks/useEvents'
import Reveal from '@/components/motion/Reveal'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import TiltCard from '@/components/motion/TiltCard'
import { SpatialCard } from '@/components/ui/spatial-card'
import type { Event, UserRole } from '@/types'

const CATEGORIES = ['all', 'technical', 'cultural', 'sports', 'academic', 'placement', 'general']

const catColors: Record<string, string> = {
  technical:  'bg-blue-500/10 text-blue-600',
  cultural:   'bg-pink-500/10 text-pink-600',
  sports:     'bg-green-500/10 text-green-600',
  academic:   'bg-purple-500/10 text-purple-600',
  placement:  'bg-orange-500/10 text-orange-600',
  general:    'bg-gray-500/10 text-gray-600',
}

export default function EventsClient({
  events: initialEvents, userRole, userId
}: {
  events: Event[]
  userRole: UserRole
  userId: string
}) {
  const events = useEvents(initialEvents)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = events.filter((e) => {
    const matchCat = category === 'all' || e.category === category
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const upcoming = filtered.filter((e) => new Date(e.event_date) >= new Date())
  const past = filtered.filter((e) => new Date(e.event_date) < new Date())

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Header */}
      <Reveal as="section" direction="down" pop onView={false} className="relative overflow-hidden rounded-[2.5rem] bg-card/60 backdrop-blur-3xl border border-white/20 p-6 shadow-[0_24px_80px_rgba(30,58,138,0.12)] dark:border-white/10 dark:shadow-[0_24px_80px_rgba(0,0,0,0.3)] md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border border-sky-400/20 bg-sky-400/10 blur-sm animate-floaty" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between z-10">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-500/15 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-600 dark:text-sky-300">
              <Sparkles className="h-3.5 w-3.5" />
              Campus calendar
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Events</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{events.length} events on campus, organized for quick discovery.</p>
          </div>
          {(userRole === 'admin' || userRole === 'professor' || userRole === 'cr') && (
            <Link href="/events/create">
              <Button className="gap-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white border-0 transition-colors">
                <Plus className="h-4 w-4" /> Create Event
              </Button>
            </Link>
          )}
        </div>
      </Reveal>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-[2rem] bg-card/40 backdrop-blur-3xl border border-white/10 p-3 sm:flex-row shadow-lg">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 rounded-full bg-background/50 border-white/10 h-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                category === cat
                  ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]'
                  : 'bg-background/50 text-muted-foreground hover:-translate-y-0.5 hover:bg-background'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2">Upcoming</h2>
          <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map((event) => (
              <StaggerItem key={event.id} className="h-full">
                <EventCard event={event} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2">Past Events</h2>
          <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
            {past.map((event) => (
              <StaggerItem key={event.id} className="h-full">
                <EventCard event={event} isPast />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-muted-foreground">No events found</p>
        </div>
      )}
    </div>
  )
}

function EventCard({ event, isPast }: { event: Event; isPast?: boolean }) {
  return (
    <Link href={`/events/${event.id}`} className="block h-full group">
      <TiltCard max={4} className="h-full rounded-[2rem]">
      <SpatialCard contentClassName="p-0" className="h-full rounded-[2rem] border-white/30 dark:border-white/10 group-hover:border-sky-500/30 transition-colors duration-500">
        {event.banner_url ? (
          <div className="h-40 bg-gray-100 overflow-hidden shrink-0">
            <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-[#1E3A8A]/10 to-[#3B82F6]/10 flex items-center justify-center shrink-0">
            <Calendar className="h-12 w-12 text-[#3B82F6]/30" />
          </div>
        )}
        <div className="p-6 flex flex-col flex-1 space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors leading-snug text-base">{event.title}</h3>
            </div>
            <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest shrink-0 ${catColors[event.category] ?? catColors.general}`}>
              {event.category}
            </span>
          </div>
          
          <div className="space-y-2 text-xs font-bold text-muted-foreground mt-auto pt-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-sky-500" />
              <span>{new Date(event.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-amber-500" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-emerald-500" />
              <span>{event._participants_count ?? 0} attending</span>
              {isPast && <span className="ml-auto text-[9px] px-2 py-0.5 bg-foreground/10 text-foreground/50 uppercase tracking-widest rounded-full">Past</span>}
            </div>
          </div>
        </div>
      </SpatialCard>
      </TiltCard>
    </Link>
  )
}

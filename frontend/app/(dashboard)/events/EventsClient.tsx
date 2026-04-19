'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, MapPin, Users, Plus, Search, Sparkles } from 'lucide-react'
import { formatEventDate } from '@/lib/utils'
import type { Event, UserRole } from '@/types'

const CATEGORIES = ['all', 'technical', 'cultural', 'sports', 'academic', 'placement', 'general']

const catColors: Record<string, string> = {
  technical:  'bg-blue-100 text-blue-700',
  cultural:   'bg-pink-100 text-pink-700',
  sports:     'bg-green-100 text-green-700',
  academic:   'bg-purple-100 text-purple-700',
  placement:  'bg-orange-100 text-orange-700',
  general:    'bg-gray-100 text-gray-700',
}

export default function EventsClient({
  events, userRole, userId
}: {
  events: Event[]
  userRole: UserRole
  userId: string
}) {
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
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(240,249,255,0.76))] p-6 shadow-[0_24px_80px_rgba(30,58,138,0.12)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(17,24,39,0.86))] md:p-8">
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border border-sky-400/20 bg-sky-400/10 blur-sm" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-500/15 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-600 dark:text-sky-300">
              <Sparkles className="h-3.5 w-3.5" />
              Campus calendar
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Events</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{events.length} events on campus, organized for quick discovery.</p>
          </div>
          {(userRole === 'admin' || userRole === 'teacher') && (
            <Link href="/events/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Create Event
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Filters */}
      <div className="glass-surface flex flex-col gap-3 rounded-2xl p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat}
              onClick={() => setCategory(cat)}
              className={`interactive-control rounded-xl border px-3 py-2 text-xs font-bold capitalize transition-all ${
                category === cat
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                  : 'bg-card/70 text-muted-foreground border-border hover:-translate-y-0.5 hover:border-primary/30 hover:text-foreground'
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
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
            {past.map((event) => (
              <EventCard key={event.id} event={event} isPast />
            ))}
          </div>
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
  const catColors: Record<string, string> = {
    technical: 'bg-blue-100 text-blue-700',
    cultural: 'bg-pink-100 text-pink-700',
    sports: 'bg-green-100 text-green-700',
    academic: 'bg-purple-100 text-purple-700',
    placement: 'bg-orange-100 text-orange-700',
    general: 'bg-gray-100 text-gray-700',
  }

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="cursor-pointer group h-full overflow-hidden">
        {event.banner_url ? (
          <div className="h-36 bg-gray-100 overflow-hidden">
            <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        ) : (
          <div className="h-36 bg-gradient-to-br from-[#1E3A8A]/10 to-[#3B82F6]/10 flex items-center justify-center">
            <Calendar className="h-12 w-12 text-[#3B82F6]/30" />
          </div>
        )}
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{event.title}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${catColors[event.category] ?? catColors.general}`}>
              {event.category}
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>{new Date(event.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              <span>{event._participants_count ?? 0} attending</span>
              {isPast && <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">Past</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

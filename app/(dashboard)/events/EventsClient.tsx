'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, MapPin, Users, Plus, Filter } from 'lucide-react'
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-muted-foreground text-sm mt-1">{events.length} events on campus</p>
        </div>
        {(userRole === 'admin' || userRole === 'teacher') && (
          <Link href="/events/create">
            <Button className="bg-[#1E3A8A] hover:bg-[#1e40af] gap-2">
              <Plus className="h-4 w-4" /> Create Event
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-white px-3 py-2 text-sm flex-1 outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
        />
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
                category === cat
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
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
      <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden">
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
            <h3 className="font-semibold text-gray-900 group-hover:text-[#1E3A8A] transition-colors leading-tight">{event.title}</h3>
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

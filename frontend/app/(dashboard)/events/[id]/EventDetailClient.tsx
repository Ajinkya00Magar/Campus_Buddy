'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import QRCode from 'qrcode'
import { rsvpEvent } from '@/services/events.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Calendar, MapPin, Users, Clock, CheckCircle, HelpCircle, XCircle, ArrowLeft, CalendarPlus, QrCode, Download } from 'lucide-react'
import { getInitials, formatEventDate } from '@/lib/utils'
import { downloadIcs, googleCalendarUrl, type CalendarEvent } from '@/utils/calendar'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import type { Event, User, EventParticipant, EventStatus } from '@/types'

type RsvpStatus = EventStatus | null

export default function EventDetailClient({
  event, currentUser, initialRsvp, participants
}: {
  event: Event & { users?: any }
  currentUser: User | null
  initialRsvp: EventParticipant | null
  participants: any[]
}) {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(initialRsvp?.status ?? null)
  const [count, setCount] = useState(event._participants_count ?? 0)
  const [loading, setLoading] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

  const isStaff = !!currentUser && ['admin', 'professor', 'cr'].includes(currentUser.role)
  const isOrganizer = isStaff || event.created_by === currentUser?.id

  const calEvent: CalendarEvent = {
    title: event.title,
    description: event.description,
    location: event.location,
    startISO: event.event_date,
  }

  const handleRsvp = async (status: EventStatus, silent = false) => {
    if (!currentUser) return
    setLoading(true)
    const { error } = await rsvpEvent(event.id, currentUser.id, status)
    if (error) {
      if (!silent) toast({ title: 'Error', description: 'Failed to update RSVP', variant: 'destructive' })
    } else {
      const wasGoing = rsvpStatus === 'going'
      const nowGoing = status === 'going'
      if (!wasGoing && nowGoing) setCount((c) => c + 1)
      if (wasGoing && !nowGoing) setCount((c) => Math.max(0, c - 1))
      setRsvpStatus(status)
      if (!silent) toast({ title: 'RSVP updated!', description: `You are ${status.replace('_', ' ')} to this event.` })
    }
    setLoading(false)
  }

  // QR check-in: visiting /events/{id}?checkin=1 marks the user as attending.
  useEffect(() => {
    if (searchParams.get('checkin') === '1' && currentUser && rsvpStatus !== 'going') {
      handleRsvp('going', true).then(() => toast({ title: 'Checked in!', description: `You're marked attending "${event.title}".` }))
      window.history.replaceState(null, '', `/events/${event.id}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showAttendanceQr = async () => {
    const url = `${window.location.origin}/events/${event.id}?checkin=1`
    const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 2 })
    setQrDataUrl(dataUrl)
    setQrOpen(true)
  }

  const isPast = new Date(event.event_date) < new Date()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </Link>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <CalendarPlus className="h-4 w-4" /> Add to Calendar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => downloadIcs(calEvent)} className="gap-2">
                <Download className="h-4 w-4" /> Apple / Outlook (.ics)
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={googleCalendarUrl(calEvent)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Google Calendar
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isOrganizer && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={showAttendanceQr}>
              <QrCode className="h-4 w-4" /> Attendance QR
            </Button>
          )}
        </div>
      </div>

      {/* Banner */}
      {event.banner_url ? (
        <div className="rounded-2xl overflow-hidden h-56 md:h-72">
          <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="rounded-2xl h-40 bg-gradient-to-br from-[#1E3A8A]/10 to-[#3B82F6]/20 flex items-center justify-center">
          <Calendar className="h-16 w-16 text-[#3B82F6]/20" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">{event.category}</Badge>
                {isPast && <Badge variant="outline" className="text-gray-500">Past</Badge>}
              </div>
            </div>
            {event.description && (
              <p className="text-gray-600 mt-3 leading-relaxed">{event.description}</p>
            )}
          </div>

          {/* Details */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{new Date(event.event_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="text-muted-foreground text-xs">{new Date(event.event_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              {event.location && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="font-medium">{event.location}</p>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">{count} attending</p>
                  {event.max_capacity && (
                    <p className="text-muted-foreground text-xs">Max capacity: {event.max_capacity}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          {participants.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Attendees</h3>
              <div className="flex flex-wrap gap-2">
                {participants.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 bg-white border rounded-full pl-1 pr-3 py-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={p.users?.avatar_url} />
                      <AvatarFallback className="text-[10px] bg-[#1E3A8A] text-white">{getInitials(p.users?.name ?? '?')}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{p.users?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RSVP Card */}
        <div className="space-y-4">
          {!isPast && (
            <Card>
              <CardContent className="pt-5 space-y-3">
                <h3 className="font-semibold text-sm">Are you going?</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleRsvp('going')}
                    disabled={loading}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      rsvpStatus === 'going'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Going
                    {rsvpStatus === 'going' && <span className="ml-auto text-xs">✓ Selected</span>}
                  </button>
                  <button
                    onClick={() => handleRsvp('maybe')}
                    disabled={loading}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      rsvpStatus === 'maybe'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                    }`}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Maybe
                    {rsvpStatus === 'maybe' && <span className="ml-auto text-xs">✓ Selected</span>}
                  </button>
                  <button
                    onClick={() => handleRsvp('not_going')}
                    disabled={loading}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      rsvpStatus === 'not_going'
                        ? 'border-red-400 bg-red-50 text-red-600'
                        : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50'
                    }`}
                  >
                    <XCircle className="h-4 w-4" />
                    Not Going
                    {rsvpStatus === 'not_going' && <span className="ml-auto text-xs">✓ Selected</span>}
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {event.users && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-2">Organized by</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={event.users.avatar_url} />
                    <AvatarFallback className="bg-[#1E3A8A] text-white text-xs">{getInitials(event.users.name ?? '?')}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-sm">{event.users.name}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Attendance QR</DialogTitle>
            <DialogDescription>Attendees scan this to check in to “{event.title}”.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Event check-in QR code" className="h-56 w-56 rounded-lg border bg-white p-2" />
            )}
            <p className="text-center text-xs text-muted-foreground">
              Scanning marks the student as attending. Display this on screen at the venue.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

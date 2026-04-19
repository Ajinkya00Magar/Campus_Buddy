import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, ArrowLeft, MapPin, Users } from 'lucide-react'
import { formatEventDate } from '@/lib/utils'

export default async function AdminEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: events } = await supabase
    .from('events')
    .select('*, event_participants(count)')
    .order('event_date', { ascending: false })

  const catColors: Record<string, string> = {
    technical: 'bg-blue-100 text-blue-700',
    cultural: 'bg-pink-100 text-pink-700',
    sports: 'bg-green-100 text-green-700',
    academic: 'bg-purple-100 text-purple-700',
    placement: 'bg-orange-100 text-orange-700',
    general: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-muted-foreground hover:text-gray-900"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold">Manage Events</h1>
            <p className="text-muted-foreground text-sm">{events?.length ?? 0} events</p>
          </div>
        </div>
        <Link href="/events/create">
          <Button className="bg-[#1E3A8A] hover:bg-[#1e40af] gap-2"><Plus className="h-4 w-4" />Create Event</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {(events ?? []).map((event: any) => (
          <Link key={event.id} href={`/events/${event.id}`}>
            <Card className="hover:shadow-md transition cursor-pointer">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[#1E3A8A]/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-[#1E3A8A]">{new Date(event.event_date).getDate()}</span>
                    <span className="text-[9px] text-blue-500 uppercase">{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{event.title}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${catColors[event.category] ?? catColors.general}`}>{event.category}</span>
                      {!event.is_published && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Draft</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.event_participants?.[0]?.count ?? 0} RSVPs</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!events?.length && (
          <div className="text-center py-12 text-muted-foreground">No events yet</div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createEvent } from '@/services/events.service'
import { validateEventInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = ['technical', 'cultural', 'sports', 'academic', 'placement', 'general']

export default function CreateEventPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', category: 'general', location: '',
    event_date: '', event_time: '', max_capacity: ''
  })

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async () => {
    const dateTime = form.event_date && form.event_time
      ? `${form.event_date}T${form.event_time}:00`
      : form.event_date

    const err = validateEventInput({ title: form.title, event_date: dateTime, category: form.category })
    if (err) { toast({ title: 'Validation error', description: err, variant: 'destructive' }); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error } = await createEvent({
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      location: form.location || undefined,
      event_date: dateTime,
      created_by: user.id,
      max_capacity: form.max_capacity ? parseInt(form.max_capacity) : undefined,
      is_published: true,
    })

    setLoading(false)
    if (error) {
      toast({ title: 'Error creating event', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Event created! 🎉' })
      router.push(`/events/${data.id}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Create Event</h1>
        <p className="text-muted-foreground text-sm mt-1">Fill in the details for your event</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-1.5">
            <Label>Event Title *</Label>
            <Input placeholder="e.g. Tech Talk: Introduction to AI" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea placeholder="What is this event about?" value={form.description} onChange={(e) => set('description', e.target.value)} className="min-h-[100px]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Max Capacity</Label>
              <Input type="number" placeholder="Leave empty for unlimited" value={form.max_capacity} onChange={(e) => set('max_capacity', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input placeholder="e.g. Seminar Hall A, Block 3" value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={form.event_date} onChange={(e) => set('event_date', e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input type="time" value={form.event_time} onChange={(e) => set('event_time', e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => router.back()} className="flex-1">Cancel</Button>
            <Button
              className="flex-1 bg-[#1E3A8A] hover:bg-[#1e40af]"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

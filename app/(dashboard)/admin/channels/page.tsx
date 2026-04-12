'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createChannel, deleteChannel } from '@/services/channels.service'
import { validateChannelInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Hash, Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Channel } from '@/types'

export default function AdminChannelsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', type: 'academic', department: '', year: '' })
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const load = async () => {
      const [{ data: chs }, { data: { user } }] = await Promise.all([
        supabase.from('channels').select('*').order('type').order('name'),
        supabase.auth.getUser(),
      ])
      setChannels(chs ?? [])
      if (user) setUserId(user.id)
    }
    load()
  }, [])

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleCreate = async () => {
    const err = validateChannelInput({ name: form.name, type: form.type })
    if (err) { toast({ title: err, variant: 'destructive' }); return }
    setLoading(true)
    const { data, error } = await createChannel({
      name: form.name.toLowerCase().replace(/\s+/g, '-'),
      description: form.description || undefined,
      type: form.type as any,
      department: form.department || undefined,
      year: form.year ? parseInt(form.year) : undefined,
      created_by: userId,
    })
    setLoading(false)
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return }
    setChannels(prev => [...prev, data])
    setForm({ name: '', description: '', type: 'academic', department: '', year: '' })
    toast({ title: 'Channel created!' })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete #${name}? All messages will be lost.`)) return
    const { error } = await deleteChannel(id)
    if (error) { toast({ title: 'Error', variant: 'destructive' }); return }
    setChannels(prev => prev.filter(c => c.id !== id))
    toast({ title: 'Channel deleted' })
  }

  const typeColors: Record<string, string> = {
    academic: 'text-blue-600 bg-blue-50',
    subject: 'text-green-600 bg-green-50',
    club: 'text-violet-600 bg-violet-50',
    official: 'text-red-600 bg-red-50',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-muted-foreground hover:text-gray-900"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold">Manage Channels</h1>
          <p className="text-muted-foreground text-sm">{channels.length} channels</p>
        </div>
      </div>

      {/* Create Form */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4" />Create Channel</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Channel Name *</Label>
              <Input placeholder="e.g. cse-2nd-year" value={form.name} onChange={e => set('name', e.target.value)} />
              <p className="text-xs text-muted-foreground">Lowercase, hyphens only</p>
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="subject">Subject</SelectItem>
                  <SelectItem value="club">Club</SelectItem>
                  <SelectItem value="official">Official</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="What is this channel for?" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input placeholder="e.g. CSE" value={form.department} onChange={e => set('department', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Select value={form.year} onValueChange={v => set('year', v)}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {[1,2,3,4].map(y => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Button onClick={handleCreate} disabled={loading} className="bg-[#1E3A8A] hover:bg-[#1e40af]">
            {loading ? 'Creating...' : 'Create Channel'}
          </Button>
        </CardContent>
      </Card>

      {/* Channel List */}
      <div className="bg-white rounded-xl border divide-y overflow-hidden">
        {channels.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No channels yet</div>
        ) : (
          channels.map(ch => (
            <div key={ch.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${typeColors[ch.type] ?? typeColors.academic}`}>
                <Hash className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">#{ch.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="capitalize">{ch.type}</span>
                  {ch.department && <><span>·</span><span>{ch.department}</span></>}
                  {ch.year && <><span>·</span><span>Year {ch.year}</span></>}
                  {ch.description && <><span>·</span><span className="truncate max-w-xs">{ch.description}</span></>}
                </div>
              </div>
              <button onClick={() => handleDelete(ch.id, ch.name)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

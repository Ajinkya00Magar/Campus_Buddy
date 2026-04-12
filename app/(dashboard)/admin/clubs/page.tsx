'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createClub, deleteClub, getClubs } from '@/services/clubs.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Users2, Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Club } from '@/types'

export default function AdminClubsPage() {
  const { toast } = useToast()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', category: '', achievements: '' })

  useEffect(() => { getClubs().then(setClubs) }, [])

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleCreate = async () => {
    if (!form.name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return }
    setLoading(true)
    const { data, error } = await createClub({
      name: form.name.trim(),
      description: form.description || undefined,
      category: form.category || undefined,
      achievements: form.achievements ? form.achievements.split('\n').filter(Boolean) : undefined,
    })
    setLoading(false)
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return }
    setClubs(prev => [...prev, data])
    setForm({ name: '', description: '', category: '', achievements: '' })
    toast({ title: 'Club created!' })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return
    const { error } = await deleteClub(id)
    if (!error) {
      setClubs(prev => prev.filter(c => c.id !== id))
      toast({ title: 'Club deleted' })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-muted-foreground hover:text-gray-900"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold">Manage Clubs</h1>
          <p className="text-muted-foreground text-sm">{clubs.length} clubs</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4" />Create Club</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="e.g. Robotics Club" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input placeholder="e.g. Technical, Cultural, Sports" value={form.category} onChange={e => set('category', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea placeholder="What does this club do?" value={form.description} onChange={e => set('description', e.target.value)} className="min-h-[80px]" />
          </div>
          <div className="space-y-1.5">
            <Label>Achievements (one per line)</Label>
            <Textarea placeholder={"Winner RoboWars 2024\nFinalist SIH 2023"} value={form.achievements} onChange={e => set('achievements', e.target.value)} className="min-h-[80px]" />
          </div>
          <Button onClick={handleCreate} disabled={loading} className="bg-[#1E3A8A] hover:bg-[#1e40af]">
            {loading ? 'Creating...' : 'Create Club'}
          </Button>
        </CardContent>
      </Card>

      <div className="bg-white rounded-xl border divide-y overflow-hidden">
        {clubs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No clubs yet</div>
        ) : (
          clubs.map(club => (
            <div key={club.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50">
              <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm shrink-0">
                {club.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{club.name}</p>
                <p className="text-xs text-muted-foreground">
                  {club.category && <span className="capitalize">{club.category} · </span>}
                  {club.achievements?.length ?? 0} achievements
                </p>
              </div>
              <button onClick={() => handleDelete(club.id, club.name)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

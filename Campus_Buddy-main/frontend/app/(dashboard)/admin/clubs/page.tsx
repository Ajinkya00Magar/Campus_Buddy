'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addClubMember, createClub, deleteClub, getClubMembers, getClubs, removeClubMember, updateClubMemberRole } from '@/services/clubs.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Users2, Plus, Trash2, ArrowLeft, Search, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import type { Club, User } from '@/types'

type ClubMembership = {
  id: string
  club_id: string
  user_id: string
  role: 'member' | 'lead' | 'co-lead'
  users?: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
}

export default function AdminClubsPage() {
  const { toast } = useToast()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', category: '', achievements: '' })
  const [managingClub, setManagingClub] = useState<Club | null>(null)

  useEffect(() => {
    getClubs().then(setClubs)
  }, [])

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' })
      return
    }

    setLoading(true)
    const { data, error } = await createClub({
      name: form.name.trim(),
      description: form.description || undefined,
      category: form.category || undefined,
      achievements: form.achievements ? form.achievements.split('\n').filter(Boolean) : undefined,
    })
    setLoading(false)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }

    setClubs(prev => [...prev, data])
    setForm({ name: '', description: '', category: '', achievements: '' })
    toast({ title: 'Club created!' })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return

    const { error } = await deleteClub(id)
    if (error) {
      toast({ title: 'Error deleting club', description: error.message, variant: 'destructive' })
      return
    }

    setClubs(prev => prev.filter(c => c.id !== id))
    toast({ title: 'Club deleted' })
  }

  const handleMemberCountChange = (clubId: string, delta: number) => {
    setClubs(prev => prev.map(c => c.id === clubId ? { ...c, _members_count: (c._members_count ?? 0) + delta } : c))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
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
            <div key={club.id} className="flex flex-col gap-3 px-4 py-3.5 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm shrink-0">
                  {club.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{club.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {club.category && <span className="capitalize">{club.category} · </span>}
                    {_membersCount(club)} members · {club.achievements?.length ?? 0} achievements
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => setManagingClub(club)} variant="outline" size="sm" className="h-8">
                  Manage Members
                </Button>
                <Button onClick={() => handleDelete(club.id, club.name)} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {managingClub && (
        <ClubMembersDialog
          club={managingClub}
          onClose={() => setManagingClub(null)}
          onMemberCountChange={handleMemberCountChange}
        />
      )}
    </div>
  )
}

const _membersCount = (club: Club) => club._members_count ?? 0

function ClubMembersDialog({
  club,
  onClose,
  onMemberCountChange,
}: {
  club: Club
  onClose: () => void
  onMemberCountChange: (clubId: string, delta: number) => void
}) {
  const supabase = createClient()
  const { toast } = useToast()
  const [members, setMembers] = useState<ClubMembership[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: clubMembers, error: clubMemberError }, { data: users }] = await Promise.all([
        getClubMembers(club.id),
        supabase.from('users').select('id, name, email, avatar_url').limit(200),
      ])
      setLoading(false)

      if (clubMemberError) {
        toast({ title: 'Unable to load members', description: clubMemberError.message, variant: 'destructive' })
      }

      setMembers((clubMembers ?? []) as ClubMembership[])
      setAllUsers((users ?? []) as User[])
    }

    load()
  }, [club.id, supabase, toast])

  const handleAdd = async (user: User) => {
    setActionId(user.id)
    const { data, error } = await addClubMember(club.id, user.id)
    setActionId(null)

    if (error) {
      toast({ title: 'Error adding member', description: error.message, variant: 'destructive' })
      return
    }

    setMembers(prev => [...prev, { ...(data as ClubMembership), users: user }])
    onMemberCountChange(club.id, 1)
    toast({ title: 'Member added' })
  }

  const handleRemove = async (membership: ClubMembership) => {
    setActionId(membership.user_id)
    const { error } = await removeClubMember(club.id, membership.user_id)
    setActionId(null)

    if (error) {
      toast({ title: 'Error removing member', description: error.message, variant: 'destructive' })
      return
    }

    setMembers(prev => prev.filter(m => m.user_id !== membership.user_id))
    onMemberCountChange(club.id, -1)
    toast({ title: 'Member removed' })
  }

  const handleRoleChange = async (membership: ClubMembership, role: ClubMembership['role']) => {
    setUpdatingMemberId(membership.user_id)
    const { error } = await updateClubMemberRole(club.id, membership.user_id, role)
    setUpdatingMemberId(null)

    if (error) {
      toast({ title: 'Error updating role', description: error.message, variant: 'destructive' })
      return
    }

    setMembers(prev => prev.map(m => m.user_id === membership.user_id ? { ...m, role } : m))
    toast({ title: 'Role updated' })
  }

  const memberIds = new Set(members.map(member => member.user_id))
  const filteredUsers = allUsers.filter(user =>
    !memberIds.has(user.id) &&
    (user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden bg-card border-border">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Users2 className="h-5 w-5 text-rose-600" /> Manage Members
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email"
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-xl border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Current Members ({members.length})</h3>
              {loading ? (
                <div className="py-8 flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Loading members...</p>
                </div>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members assigned yet.</p>
              ) : (
                <div className="space-y-3">
                  {members.map(member => (
                    <div key={member.user_id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm shrink-0">
                          {member.users?.name?.[0] ?? 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{member.users?.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{member.users?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={member.role} onValueChange={(value) => handleRoleChange(member, value as ClubMembership['role'])}>
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="lead">President</SelectItem>
                            <SelectItem value="co-lead">Co-lead</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(member)}
                          disabled={actionId === member.user_id}
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        >
                          {actionId === member.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Add Members</h3>
              <p className="text-sm text-muted-foreground mb-3">Search users by name or email and add them to this club.</p>
              {search.trim().length === 0 ? (
                <p className="text-sm text-muted-foreground">Start typing to search current users.</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users match your search.</p>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.slice(0, 8).map(user => (
                    <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAdd(user)}
                        disabled={actionId === user.id}
                        className="h-8"
                      >
                        {actionId === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

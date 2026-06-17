'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createChannel, deleteChannel, getChannelMembers, addChannelMember, removeChannelMember } from '@/services/channels.service'
import { validateChannelInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Hash, Plus, Trash2, ArrowLeft, Users, X, Search, Loader2, Lock, Unlock } from 'lucide-react'
import Link from 'next/link'
import { useChannels } from '@/hooks/useChannels'
import type { Channel, User } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

export default function AdminChannelsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()
  
  const [initialChannels, setInitialChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<User | null>(null)
  
  // Realtime state management via hook
  const channels = useChannels(initialChannels, profile)

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    type: 'academic', 
    department: '', 
    year: 'none',
    is_private: false 
  })
  const [userId, setUserId] = useState('')
  const [managingChannel, setManagingChannel] = useState<Channel | null>(null)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/dashboard'); return }
      
      setProfile(profile)
      setUserId(user.id)
      const { data: chs } = await supabase.from('channels').select('*').order('type').order('name')
      setInitialChannels(chs ?? [])
      setLoading(false)
    }
    checkAdmin()
  }, [])

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const handleCreate = async () => {
    const err = validateChannelInput({ name: form.name, type: form.type })
    if (err) { toast({ title: err, variant: 'destructive' }); return }
    
    setCreating(true)
    const { error } = await createChannel({
      name: form.name.trim(),
      description: form.description || undefined,
      type: form.type as any,
      department: form.department || undefined,
      year: (form.year && form.year !== 'none') ? parseInt(form.year) : undefined,
      is_private: form.is_private,
      created_by: userId,
    })
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setCreating(false)
      return
    }

    // No need to manually refresh state, useChannels hook will catch the INSERT event
    setForm({ name: '', description: '', type: 'academic', department: '', year: 'none', is_private: false })
    setCreating(false)
    toast({ title: 'Channel created successfully!' })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to delete #${name}? This cannot be undone.`)) return
    
    const { error } = await deleteChannel(id)
    if (error) { 
      toast({ title: 'Error deleting channel', description: error.message, variant: 'destructive' })
      return 
    }
    
    // No need to manually filter state, useChannels hook will catch the DELETE event
    toast({ title: 'Channel deleted' })
  }

  const typeColors: Record<string, string> = {
    academic: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
    subject: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-blue-900/20',
    club: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-blue-900/20',
    official: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-blue-900/20',
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Channels</h1>
          <p className="text-muted-foreground text-sm">{channels.length} channels active</p>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-foreground"><Plus className="h-4 w-4 text-primary" />Create New Channel</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-foreground/80">Channel Name *</Label>
              <Input placeholder="e.g. cse-2nd-year" value={form.name} onChange={e => set('name', e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground/80">Type *</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="subject">Subject</SelectItem>
                  <SelectItem value="club">Club</SelectItem>
                  <SelectItem value="official">Official</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground/80">Description</Label>
              <Input placeholder="What is this channel for?" value={form.description} onChange={e => set('description', e.target.value)} className="bg-background" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground/80">Department</Label>
                <Input placeholder="e.g. CSE" value={form.department} onChange={e => set('department', e.target.value)} className="bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground/80">Year</Label>
                <Select value={form.year} onValueChange={v => set('year', v)}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any</SelectItem>
                    {[1,2,3,4].map(y => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_private} onCheckedChange={v => set('is_private', v)} />
              <div className="flex flex-col">
                <Label className="flex items-center gap-1.5 cursor-pointer text-foreground" onClick={() => set('is_private', !form.is_private)}>
                  {form.is_private ? <Lock className="h-3 w-3 text-amber-500" /> : <Unlock className="h-3 w-3 text-emerald-500" />}
                  Private Channel
                </Label>
                <span className="text-[10px] text-muted-foreground font-medium">Only members can view messages in private channels.</span>
              </div>
            </div>
            <Button onClick={handleCreate} disabled={creating} className="bg-primary text-primary-foreground hover:opacity-90 px-6">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Channel
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden shadow-sm">
        {channels.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No channels found</div>
        ) : (
          channels.map(ch => (
            <div key={ch.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 group transition-colors">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${typeColors[ch.type] ?? typeColors.academic}`}>
                <Hash className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                  #{ch.name}
                  {ch.is_private && (
                    <span className="inline-flex items-center gap-1 text-[9px] bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/30 font-bold uppercase tracking-wider">
                      <Lock className="h-2 w-2" /> Private
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <span className="capitalize">{ch.type}</span>
                  {ch.department && <><span>·</span><span>{ch.department}</span></>}
                  {ch.year && <><span>·</span><span>Year {ch.year}</span></>}
                </div>
              </div>
              <div className="flex items-center gap-2 pr-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setManagingChannel(ch)} 
                  className="h-8 gap-2 text-xs font-bold hover:bg-primary/5 hover:text-primary border-border"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Members</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(ch.id, ch.name)} 
                  className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {managingChannel && (
        <MemberManagerDialog
          channel={managingChannel}
          onClose={() => setManagingChannel(null)}
        />
      )}
    </div>
  )
}

function MemberManagerDialog({ channel, onClose }: { channel: Channel, onClose: () => void }) {
  const supabase = createClient()
  const { toast } = useToast()
  
  const [members, setMembers] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const [{ data: mbs }, { data: us }] = await Promise.all([
        getChannelMembers(channel.id),
        supabase.from('users').select('*').limit(200)
      ])
      setMembers(mbs ?? [])
      setAllUsers(us ?? [])
      setLoading(false)
    }
    load()
  }, [channel.id])

  const handleAdd = async (user: User) => {
    setActionId(user.id)
    const { data, error } = await addChannelMember(channel.id, user.id)
    if (error) {
      toast({ title: 'Error adding member', description: error.message, variant: 'destructive' })
      setActionId(null)
    } else {
      setMembers(prev => [...prev, { ...data, users: user }])
      toast({ title: 'Member added' })
      setActionId(null)
    }
  }

  const handleRemove = async (userId: string) => {
    setActionId(userId)
    const { error } = await removeChannelMember(channel.id, userId)
    if (error) {
      toast({ title: 'Error removing member', description: error.message, variant: 'destructive' })
      setActionId(null)
    } else {
      setMembers(prev => prev.filter(m => m.user_id !== userId))
      toast({ title: 'Member removed' })
      setActionId(null)
    }
  }

  const memberIds = new Set(members.map(m => m.user_id))
  const filteredUsers = allUsers.filter(u => 
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    !memberIds.has(u.id)
  )

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden bg-card border-border">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Manage Members: #{channel.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students to add..."
              className="pl-9 h-9 text-sm bg-background border-border"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-5 pr-1 custom-scrollbar">
            {loading ? (
              <div className="py-10 flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Loading members...</p>
              </div>
            ) : (
              <>
                {/* Current Members */}
                <div>
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-2 px-1">Current Members ({members.length})</h3>
                  <div className="space-y-1">
                    {members.map(m => (
                      <div key={m.user_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 border border-primary/20">
                            {m.users?.name?.[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{m.users?.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium truncate">{m.users?.email}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemove(m.user_id)}
                          disabled={actionId === m.user_id}
                          className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {actionId === m.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-4 w-4" />}
                        </Button>
                      </div>
                    ))}
                    {members.length === 0 && (
                      <p className="text-[11px] text-center text-muted-foreground py-4 bg-muted/20 rounded-lg border border-dashed border-border">No members yet</p>
                    )}
                  </div>
                </div>

                {/* Suggestions */}
                {search.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-2 px-1">Suggestions</h3>
                    <div className="space-y-1">
                      {filteredUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground text-[11px] font-bold flex items-center justify-center shrink-0 border border-border">
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{u.name}</p>
                              <p className="text-[10px] text-muted-foreground font-medium truncate">{u.email}</p>
                            </div>
                          </div>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => handleAdd(u)}
                            disabled={actionId === u.id}
                            className="h-7 text-[10px] font-bold uppercase tracking-tight px-3 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-none"
                          >
                            {actionId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                          </Button>
                        </div>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="text-[11px] text-center text-muted-foreground py-4">No users found matching "{search}"</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

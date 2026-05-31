'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/layout/ThemeContext'
import { getInitials, getRoleBadgeColor, cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  Sun, Moon, Monitor, User, BookOpen, Users2,
  Trophy, LogOut, Shield, Mail, Calendar, Pencil, Check, X,
} from 'lucide-react'
import type { User as UserType } from '@/types'

type ThemeOption = 'light' | 'dark'

export default function SettingsClient({
  profile,
  completions,
  clubMemberships,
}: {
  profile: UserType | null
  completions: any[]
  clubMemberships: any[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

  const [editing, setEditing] = useState(false)
  const [name, setName]       = useState(profile?.name ?? '')
  const [saving, setSaving]   = useState(false)

  const handleSaveName = async () => {
    if (!name.trim() || !profile) return
    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', profile.id)
    setSaving(false)
    if (error) {
      toast({ title: 'Failed to update name', variant: 'destructive' })
    } else {
      toast({ title: 'Name updated!' })
      setEditing(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const themeOptions: { value: ThemeOption; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark',  label: 'Dark',  icon: Moon },
  ]

  if (!profile) return null

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile and preferences</p>
      </div>

      {/* ── Profile card ── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar + info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg text-foreground">{profile.name}</p>
                <span className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-semibold border capitalize',
                  getRoleBadgeColor(profile.role)
                )}>
                  {profile.role}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-0.5">
                <Mail className="h-3.5 w-3.5" />
                {profile.email}
              </div>
              {(profile.department || profile.year) && (
                <div className="flex items-center gap-3 text-muted-foreground text-xs mt-1">
                  {profile.department && <span>{profile.department}</span>}
                  {profile.year && <span>Year {profile.year}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Editable name */}
          <div className="space-y-1.5">
            <Label>Display Name</Label>
            {editing && profile.role !== 'student' ? (
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') { setEditing(false); setName(profile.name) }
                  }}
                />
                <Button size="icon" onClick={handleSaveName} disabled={saving}
                  className="bg-primary text-primary-foreground h-10 w-10 shrink-0">
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => { setEditing(false); setName(profile.name) }}
                  className="h-10 w-10 shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between h-10 px-3 rounded-md border bg-muted/40">
                <span className="text-sm text-foreground">{profile.name}</span>
                {profile.role !== 'student' && (
                  <button onClick={() => setEditing(true)}
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                {profile.role === 'student' && (
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Verified</span>
                )}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {[
              { label: 'Courses Done', value: completions.length, icon: BookOpen, color: 'text-emerald-600' },
              { label: 'Clubs Joined', value: clubMemberships.length, icon: Users2, color: 'text-violet-600' },
              { label: 'Badges Earned', value: completions.length, icon: Trophy, color: 'text-amber-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border">
                <Icon className={`h-5 w-5 ${color} shrink-0`} />
                <div>
                  <p className="text-lg font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Appearance ── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="h-4 w-4 text-primary" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Choose how Campus Buddy looks for you.</p>
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all',
                  theme === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/40 hover:bg-muted/50 text-muted-foreground'
                )}
              >
                {/* Mini preview */}
                <div className={cn(
                  'w-full h-12 rounded-lg border overflow-hidden',
                  value === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                )}>
                  <div className={cn('h-3 w-full', value === 'dark' ? 'bg-gray-800' : 'bg-white border-b')} />
                  <div className="flex gap-1 p-1.5">
                    <div className={cn('h-2 rounded w-8', value === 'dark' ? 'bg-gray-700' : 'bg-gray-200')} />
                    <div className={cn('h-2 rounded w-5', value === 'dark' ? 'bg-blue-700' : 'bg-blue-300')} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </div>
                {theme === value && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Courses completed ── */}
      {completions.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Earned Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completions.map((c: any) => (
                <div key={c.course_id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30">
                  <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                    <Trophy className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {c.courses?.title ?? 'Course'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Completed {c.completed_at ? new Date(c.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full shrink-0">
                    Badge
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Account ── */}
      <Card className="border-destructive/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <Shield className="h-4 w-4" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border">
            <div>
              <p className="text-sm font-medium text-foreground">Registered Email</p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Cannot change</span>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

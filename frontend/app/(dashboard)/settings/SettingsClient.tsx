'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
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
import { uploadAvatar, deleteAvatar } from '@/services/channels.service'
import { generateCourseCertificate } from '@/utils/courseCertificates'
import { getProfileDepartmentDisplay, STUDENT_DEPARTMENT_SHORT } from '@/utils/department'
import { getLocalCourseCompletions, type LocalCourseCompletion } from '@/utils/localCourseCompletions'
import {
  Sun, Palette, User, BookOpen, Users2,
  Trophy, LogOut, Shield, Mail, Pencil, Check, X, Camera, Loader2, Trash2
} from 'lucide-react'
import type { User as UserType } from '@/types'

type ThemeOption = 'light' | 'charcoal'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState(false)
  const [name, setName]       = useState(profile?.name ?? '')
  const [saving, setSaving]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [localCompletions, setLocalCompletions] = useState<LocalCourseCompletion[]>([])

  useEffect(() => {
    if (!profile?.id) return

    const loadLocalCompletions = () => {
      setLocalCompletions(getLocalCourseCompletions(profile.id))
    }

    loadLocalCompletions()
    window.addEventListener('campus-buddy:course-completions-changed', loadLocalCompletions)
    window.addEventListener('storage', loadLocalCompletions)

    return () => {
      window.removeEventListener('campus-buddy:course-completions-changed', loadLocalCompletions)
      window.removeEventListener('storage', loadLocalCompletions)
    }
  }, [profile?.id])

  const completedCourses = useMemo(() => {
    const normalizedDbCompletions = completions.map((completion: any) => {
      const courseTitle = Array.isArray(completion.courses)
        ? completion.courses[0]?.title
        : completion.courses?.title

      return {
        course_id: completion.course_id,
        title: courseTitle ?? 'Completed Course',
        completed_at: completion.completed_at,
      }
    })

    const byId = new Map<string, LocalCourseCompletion>()
    for (const completion of [...normalizedDbCompletions, ...localCompletions]) {
      byId.set(completion.course_id, completion)
    }

    return Array.from(byId.values())
  }, [completions, localCompletions])

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
      router.refresh()
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploading(true)
    const { error } = await uploadAvatar(file, profile.id)
    setUploading(false)

    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Avatar updated!' })
      router.refresh()
    }
  }

  const handleRemoveAvatar = async () => {
    if (!profile || !confirm('Remove your profile picture?')) return
    
    setUploading(true)
    const { error } = await deleteAvatar(profile.id)
    setUploading(false)

    if (error) {
      toast({ title: 'Removal failed', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Avatar removed' })
      router.refresh()
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleGenerateCertificate = (completion: LocalCourseCompletion) => {
    if (!profile) return

    generateCourseCertificate({
      courseId: completion.course_id,
      courseTitle: completion.title,
      userId: profile.id,
      userName: profile.name,
      completedAt: completion.completed_at,
    })
    toast({ title: 'Certificate generated', description: 'Your certificate has been downloaded.' })
  }

  const themeOptions: { value: ThemeOption; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'light',    label: 'Light',    icon: Sun },
    { value: 'charcoal', label: 'Charcoal', icon: Palette },
  ]

  if (!profile) return null

  const departmentLabel = getProfileDepartmentDisplay(profile)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your campus profile and preferences</p>
      </div>

      {/* ── Profile card ── */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-widest">
            <User className="h-4 w-4 text-primary" /> Profile Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Avatar + info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative group self-start sm:self-center">
              <Avatar className="h-24 w-24 border-4 border-muted shadow-md group-hover:border-primary/20 transition-all duration-300">
                <AvatarImage src={profile.avatar_url} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-black">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs rounded-full bg-black/40">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 text-white hover:text-primary transition-colors disabled:cursor-not-allowed"
                  title="Upload photo"
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                </button>
                {profile.avatar_url && (
                  <button 
                    onClick={handleRemoveAvatar}
                    disabled={uploading}
                    className="p-2 text-white hover:text-red-400 transition-colors disabled:cursor-not-allowed"
                    title="Remove photo"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center flex-wrap gap-2">
                <p className="font-bold text-xl text-foreground">{profile.name}</p>
                <span className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider',
                  getRoleBadgeColor(profile.role)
                )}>
                  {profile.role}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <Mail className="h-4 w-4" />
                {profile.email}
              </div>
              {(departmentLabel || profile.year) && (
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-tight">
                  {departmentLabel && (
                    <span className="rounded-lg border border-border bg-muted px-2.5 py-1">
                      <span className="text-[10px] text-muted-foreground/80">{STUDENT_DEPARTMENT_SHORT}</span>
                      <span className="mx-1.5 text-muted-foreground/40">·</span>
                      <span className="normal-case">{departmentLabel}</span>
                    </span>
                  )}
                  {profile.year && <span className="bg-muted px-2 py-0.5 rounded">Year {profile.year}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Editable name (Hidden for Students) */}
          <div className="space-y-2 pt-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Display Name</Label>
            {editing && profile.role !== 'student' ? (
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 h-11 rounded-xl bg-background border-border"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') { setEditing(false); setName(profile.name) }
                  }}
                />
                <Button size="icon" onClick={handleSaveName} disabled={saving}
                  className="h-11 w-11 shrink-0 rounded-xl bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => { setEditing(false); setName(profile.name) }}
                  className="h-11 w-11 shrink-0 rounded-xl border-border hover:bg-muted">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between h-12 px-4 rounded-xl border border-border bg-muted/20">
                <span className="text-sm font-semibold text-foreground">{profile.name}</span>
                {profile.role !== 'student' ? (
                  <button onClick={() => setEditing(true)}
                    className="text-muted-foreground hover:text-primary transition-all p-2 hover:bg-background rounded-lg shadow-xs">
                    <Pencil className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                    <Check className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Verified Identity</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[
              { label: 'Courses Done', value: completedCourses.length, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Clubs Joined', value: clubMemberships.length, icon: Users2, color: 'text-violet-500', bg: 'bg-violet-500/10' },
              { label: 'Badges Earned', value: completedCourses.length, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border transition-all hover:shadow-sm">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0', bg)}>
                  <Icon className={cn('h-5 w-5', color)} />
                </div>
                <div>
                  <p className="text-lg font-black text-foreground">{value}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight leading-none">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {completedCourses.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-widest">
              <Trophy className="h-4 w-4 text-amber-500" /> Course Certificates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {completedCourses.map((completion) => (
              <div key={completion.course_id} className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{completion.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Completed on {new Date(completion.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleGenerateCertificate(completion)}
                  className="shrink-0 bg-amber-500 text-white hover:bg-amber-600"
                >
                  <Trophy className="h-3.5 w-3.5" />
                  Certificate
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Appearance ── */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-widest">
            <Sun className="h-4 w-4 text-primary" /> System Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all',
                  theme === value
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-border hover:border-primary/40 hover:bg-muted/50 text-muted-foreground'
                )}
              >
                <div className={cn(
                  'w-full h-14 rounded-xl border overflow-hidden relative',
                  value === 'charcoal' ? 'bg-slate-900' : 'bg-slate-50'
                )}>
                  <div className={cn('h-3.5 w-full', value === 'charcoal' ? 'bg-slate-800' : 'bg-white border-b')} />
                  <div className="flex flex-col gap-1 p-2">
                    <div className={cn('h-1.5 rounded w-10', value === 'charcoal' ? 'bg-slate-700' : 'bg-slate-200')} />
                    <div className={cn('h-1.5 rounded w-6', value === 'charcoal' ? 'bg-primary/40' : 'bg-primary/20')} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Account Security ── */}
      <Card className="border-destructive/20 bg-card">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive uppercase tracking-widest">
            <Shield className="h-4 w-4" /> Session Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Registered Identity</p>
              <p className="text-xs text-muted-foreground truncate font-medium">{profile.email}</p>
            </div>
            <span className="shrink-0 text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded-lg border border-border">READ-ONLY</span>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full h-11 border-destructive/30 text-destructive hover:bg-destructive dark:hover:text-destructive-foreground hover:text-white rounded-xl font-bold uppercase tracking-widest transition-all"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out of Campus Buddy
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateSignupInput, isValidMitaoeEmail } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { GraduationCap, Eye, EyeOff, AlertCircle } from 'lucide-react'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student', department: '', year: '1'
  })

  const set = (k: string, v: string) => {
    setError('')
    setForm(prev => ({ ...prev, [k]: v }))
  }

  const handleLogin = async () => {
    setError('')
    if (!isValidMitaoeEmail(form.email)) {
      setError('Use your PRN email: 123456789012@mitaoe.ac.in')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleSignup = async () => {
    setError('')
    const err = validateSignupInput(form)
    if (err) { setError(err); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        data: {
          name: form.name.trim(),
          role: form.role,
          department: form.department.trim(),
          year: parseInt(form.year),
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      toast({ title: 'Account created! 🎉', description: 'Check your email to verify your account, then sign in.' })
      setMode('login')
    }
  }

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="hidden border-r bg-[hsl(var(--sidebar-bg))] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="mb-6 flex h-11 w-11 items-center justify-center border border-white/15 bg-white/10">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Campus Buddy</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/68">
            A focused workspace for MIT Academy of Engineering students, professors, and admins.
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/45">MITAOE campus portal</p>
      </aside>

      <main className="flex min-h-screen items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center border bg-card">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Campus Buddy</h1>
              <p className="text-xs text-muted-foreground">MIT Academy of Engineering</p>
            </div>
          </div>

          <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Sign in with your PRN email address'
                : 'Register with your 12-digit PRN email'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Signup extras */}
            {mode === 'signup' && (
              <>
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input placeholder="e.g. Rahul Sharma" value={form.name}
                    onChange={(e) => set('name', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => set('role', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="professor">Professor</SelectItem>
                      <SelectItem value="cr">Class Representative (CR)</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Department</Label>
                    <Input placeholder="e.g. CSE" value={form.department}
                      onChange={(e) => set('department', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Year</Label>
                    <Select value={form.year} onValueChange={(v) => set('year', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map((y) => (
                          <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label>College Email</Label>
              <Input
                type="email"
                placeholder="123456789012@mitaoe.ac.in"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && mode === 'login' && handleLogin()}
              />
              <p className="text-[11px] text-muted-foreground">12-digit PRN followed by @mitaoe.ac.in</p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'signup' ? 'Min 8 characters' : '••••••••'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && mode === 'login' && handleLogin()}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              className="mt-2 h-10 w-full text-sm font-medium"
              onClick={mode === 'login' ? handleLogin : handleSignup}
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>

            {/* Toggle */}
            <p className="text-center text-sm text-muted-foreground pt-1">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                className="font-medium text-primary hover:underline"
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              >
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  )
}

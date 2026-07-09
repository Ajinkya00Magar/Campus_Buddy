'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateSignupInput, isValidMitaoeEmail } from '@/lib/validations'
import { STUDENT_DEPARTMENT_CODE, STUDENT_DEPARTMENT_LABEL } from '@/utils/department'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { GraduationCap, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { LazyMotion, domAnimation, m } from 'framer-motion'

type Mode = 'login' | 'signup'

function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  // Gate entrance animations until after hydration so the server HTML and the
  // first client render are identical (no framer `initial` transforms in SSR).
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student', department: STUDENT_DEPARTMENT_CODE, year: '1'
  })

  const set = (k: string, v: string) => {
    setError('')
    setForm(prev => ({ ...prev, [k]: v }))
  }

  const handleLogin = async () => {
    setError('')
    if (!isValidMitaoeEmail(form.email)) {
      setError('Use your official @mitaoe.ac.in email address')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })

      if (error) {
        setError(error.message)
        return
      }

      router.replace('/dashboard')
      router.refresh()
    } catch (error) {
      setError(getAuthErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    setError('')
    const err = validateSignupInput(form)
    if (err) { setError(err); return }
    setLoading(true)

    const isStudent = form.role === 'student' || form.role === 'cr'
    const signupData: any = {
      name: form.name.trim(),
      role: form.role,
      department: isStudent ? STUDENT_DEPARTMENT_CODE : form.department.trim(),
    }
    if (isStudent) signupData.year = parseInt(form.year)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: signupData,
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      toast({ title: 'Account created! 🎉', description: 'Check your email to verify your account, then sign in.' })
      setMode('login')
    } catch (error) {
      setError(getAuthErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
   <LazyMotion features={domAnimation} strict>
    <div className="grid min-h-[100dvh] overflow-hidden bg-background text-foreground lg:grid-cols-[0.9fr_1.1fr]">
      <m.aside
        initial={mounted ? { x: -60, opacity: 0 } : false}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative hidden overflow-hidden border-r bg-[hsl(var(--sidebar-bg))] p-10 text-white lg:flex lg:flex-col lg:justify-between"
      >
        {/* Ambient grid-paper texture + floating glow behind the brand panel */}
        <div className="grid-paper pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden />
        <div className="pointer-events-none absolute -left-16 top-1/3 h-64 w-64 rounded-full bg-primary/25 blur-3xl animate-floaty" aria-hidden />
        <m.div
          initial={mounted ? { y: 24, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative"
        >
          <div className="mb-6 flex h-11 w-11 items-center justify-center border border-white/15 bg-white/10 glow-soft animate-floaty">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Campus Buddy</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/68">
            A focused workspace for MIT Academy of Engineering students, professors, and admins.
          </p>
        </m.div>
        <p className="relative text-xs uppercase tracking-[0.18em] text-white/45">MITAOE campus portal</p>
      </m.aside>

      <main className="flex min-h-[100dvh] items-center justify-center p-4 sm:p-8">
        <m.div
          initial={mounted ? { opacity: 0, y: 30, scale: 0.94, rotateX: 10 } : false}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.9, 0.2, 1.05], delay: 0.1 }}
          style={{ transformPerspective: 1200 }}
          className="w-full max-w-md"
        >
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center border bg-card">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Campus Buddy</h1>
              <p className="text-xs text-muted-foreground">MIT Academy of Engineering</p>
            </div>
          </div>

          {/* No 3D tilt on the auth card: a mouse-tracking transform makes the
              form fields/button shift under the cursor and breaks click hit-testing. */}
          <Card className="elev-2 overflow-hidden rounded-lg">
          <CardHeader className="pb-3">
            <CardTitle>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Sign in with your campus email address'
                : 'Register with your official @mitaoe.ac.in email'}
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
                <div className={cn("grid gap-3", (form.role === 'student' || form.role === 'cr') ? "grid-cols-2" : "grid-cols-1")}>
                  {(form.role === 'student' || form.role === 'cr') ? (
                    <div className="space-y-1.5">
                      <Label>Department</Label>
                      <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium text-foreground">
                        {STUDENT_DEPARTMENT_LABEL}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label>Department</Label>
                      <Input placeholder="e.g. CSE" value={form.department}
                        onChange={(e) => set('department', e.target.value)} />
                    </div>
                  )}
                  {(form.role === 'student' || form.role === 'cr') && (
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
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label>College Email</Label>
              <Input
                type="email"
                placeholder="email@mitaoe.ac.in"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && mode === 'login' && handleLogin()}
              />
              <p className="text-[11px] text-muted-foreground">Use your official MITAOE email address</p>
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
              type="button"
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
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              >
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </CardContent>
          </Card>
        </m.div>
      </main>
    </div>
   </LazyMotion>
  )
}

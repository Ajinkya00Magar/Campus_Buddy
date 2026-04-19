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
    <div className="min-h-screen bg-gradient-to-br from-[#0f2460] via-[#1E3A8A] to-[#1d4ed8] flex items-center justify-center p-4">
      {/* Background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-white/3 border border-white/5" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-4 shadow-xl">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Campus Buddy</h1>
          <p className="text-blue-200 text-sm mt-1">MIT Academy of Engineering</p>
        </div>

        <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">
              {mode === 'login' ? 'Welcome back 👋' : 'Create your account'}
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
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
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
                      <SelectItem value="student">🎓 Student</SelectItem>
                      <SelectItem value="teacher">📚 Teacher</SelectItem>
                      <SelectItem value="admin">🛡️ Admin</SelectItem>
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
              className="w-full bg-[#1E3A8A] hover:bg-[#1e40af] text-white h-11 text-base font-semibold mt-2"
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
                className="text-[#1E3A8A] hover:underline font-semibold"
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              >
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

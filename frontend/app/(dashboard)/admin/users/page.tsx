'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, getInitials } from '@/lib/utils'
import { Users, ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAllUsers } from '@/hooks/useAllUsers'
import type { User, UserRole } from '@/types'

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  professor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  cr: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
}

export default function AdminUsersPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const { users, setUsers, loading } = useAllUsers()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updatingYearId, setUpdatingYearId] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId)
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    setUpdatingId(null)
    if (error) {
      toast({ title: 'Error updating role', description: error.message, variant: 'destructive' })
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      toast({ title: 'Role updated' })
    }
  }

  const handleYearChange = async (userId: string, newYear: number | null) => {
    setUpdatingYearId(userId)
    const { error } = await supabase
      .from('users')
      .update({ year: newYear })
      .eq('id', userId)

    setUpdatingYearId(null)
    if (error) {
      toast({ title: 'Error updating year', description: error.message, variant: 'destructive' })
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, year: newYear ?? undefined } : u))
      toast({ title: 'Student year updated' })
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
          <p className="text-muted-foreground text-sm">{users.length} registered users</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department & Year</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border shadow-sm shrink-0">
                        <AvatarImage src={u.avatar_url} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Select
                        defaultValue={u.role}
                        onValueChange={(v) => handleRoleChange(u.id, v as UserRole)}
                        disabled={updatingId === u.id}
                      >
                        <SelectTrigger className={`h-8 w-32 text-xs font-medium border border-border shadow-none ${roleColors[u.role] ?? roleColors.student}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="cr">CR</SelectItem>
                          <SelectItem value="professor">Professor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {updatingId === u.id && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="text-sm text-foreground/80 font-medium">
                        {u.department ?? '—'}
                      </div>
                      {u.role === 'student' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Year</span>
                          <Select
                            defaultValue={u.year ? String(u.year) : 'none'}
                            onValueChange={(value) => handleYearChange(u.id, value === 'none' ? null : parseInt(value, 10))}
                            disabled={updatingYearId === u.id}
                          >
                            <SelectTrigger className="h-8 w-24 text-xs font-medium border border-border shadow-none bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4</SelectItem>
                            </SelectContent>
                          </Select>
                          {updatingYearId === u.id && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not a student</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground font-medium">
                    {formatDate(u.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

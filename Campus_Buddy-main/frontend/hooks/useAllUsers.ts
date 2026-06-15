'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

export function useAllUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      setUsers(data ?? [])
      setLoading(false)
    }

    fetchUsers()

    const channelIdSuffix = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`public:users:admin:${channelIdSuffix}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setUsers((prev) => [payload.new as User, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as User
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
          } else if (payload.eventType === 'DELETE') {
            setUsers((prev) => prev.filter((u) => u.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { users, setUsers, loading }
}

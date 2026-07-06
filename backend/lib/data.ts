import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { User, Channel } from '@/types'

export const getUserProfile = cache(async (userId: string): Promise<User | null> => {
  const supabase = await createClient()
  const { data } = await supabase.from('users').select('*').eq('id', userId).single()
  return data
})

export const getChannels = cache(async (): Promise<Channel[]> => {
  const supabase = await createClient()
  const { data } = await supabase.from('channels').select('*').order('type').order('name')
  return data ?? []
})

import { createClient } from '@/lib/supabase/client'
import type { Notification, NotifType } from '@/types'

export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return data ?? []
}

export async function markAsRead(notifId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notifId)
  return { error }
}

export async function markAllAsRead(userId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  return { error }
}

export async function createNotification(payload: {
  user_id: string
  title: string
  body?: string
  type: NotifType
  link?: string
}) {
  const supabase = createClient()
  const { error } = await supabase.from('notifications').insert(payload)
  return { error }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient()
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  return count ?? 0
}

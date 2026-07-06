import { createClient } from '@/lib/supabase/client'
import type { Message, User } from '@/types'

export type ReportStatus = 'open' | 'reviewed' | 'dismissed'

export type MessageReport = {
  id: string
  message_id: string
  reporter_id: string
  reason: string | null
  status: ReportStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  reporter?: Pick<User, 'name' | 'avatar_url' | 'role'> | null
  messages?:
    | (Pick<Message, 'id' | 'content' | 'file_name' | 'channel_id' | 'sender_id' | 'created_at'> & {
        users?: Pick<User, 'name' | 'role'> | null
        channels?: { id: string; name: string } | null
      })
    | null
}

/** File a report against a message. UNIQUE(message_id, reporter_id) prevents dupes. */
export async function reportMessage(messageId: string, reporterId: string, reason: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('message_reports')
    .insert({ message_id: messageId, reporter_id: reporterId, reason: reason.trim() || null })
  // A duplicate report (already flagged by this user) is not a user-facing error.
  if (error && (error as { code?: string }).code === '23505') {
    return { error: null, duplicate: true }
  }
  return { error, duplicate: false }
}

/** Staff-only: list reports (optionally filtered by status) with context joins. */
export async function getMessageReports(status?: ReportStatus): Promise<MessageReport[]> {
  const supabase = createClient()
  let query = supabase
    .from('message_reports')
    .select(
      '*, reporter:users!message_reports_reporter_id_fkey(name, avatar_url, role), messages(id, content, file_name, channel_id, sender_id, created_at, users(name, role), channels(id, name))'
    )
    .order('created_at', { ascending: false })
    .limit(100)
  if (status) query = query.eq('status', status)
  const { data } = await query
  return (data ?? []) as unknown as MessageReport[]
}

export async function getOpenReportCount(): Promise<number> {
  const supabase = createClient()
  const { count } = await supabase
    .from('message_reports')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open')
  return count ?? 0
}

/** Staff-only: mark a report reviewed or dismissed. */
export async function updateReportStatus(reportId: string, status: ReportStatus, reviewerId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('message_reports')
    .update({ status, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq('id', reportId)
  return { error }
}

import { createClient } from '@/lib/supabase/client'
import type { Channel, Message, User } from '@/types'

export type SearchMessage = Message & { channels?: { id: string; name: string } | null }
export type SearchUser = Pick<User, 'id' | 'name' | 'email' | 'role' | 'avatar_url'>

export type SearchResults = {
  channels: Channel[]
  messages: SearchMessage[]
  users: SearchUser[]
}

const EMPTY: SearchResults = { channels: [], messages: [], users: [] }

function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const row of rows) {
    if (seen.has(row.id)) continue
    seen.add(row.id)
    out.push(row)
  }
  return out
}

/**
 * Global search across channels, messages and people.
 * - Uses per-column `.ilike()` (values are sent as bound parameters, so this is
 *   injection-safe) and escapes the user's `%`/`_` so they can't inject wildcards.
 * - RLS scopes `channels`/`messages` to what the caller may see, so a student's
 *   results never leak other years'/departments' content.
 */
export async function searchAll(query: string): Promise<SearchResults> {
  const q = query.trim()
  if (q.length < 2) return EMPTY

  const supabase = createClient()
  const like = `%${q.replace(/[%_\\]/g, '\\$&')}%`

  const [chName, chDesc, msgs, uName, uEmail] = await Promise.all([
    supabase.from('channels').select('*').ilike('name', like).limit(8),
    supabase.from('channels').select('*').ilike('description', like).limit(8),
    supabase
      .from('messages')
      .select('*, users:users!messages_sender_id_fkey(name, avatar_url, role), channels(id, name)')
      .ilike('content', like)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase.from('users').select('id, name, email, role, avatar_url').ilike('name', like).limit(8),
    supabase.from('users').select('id, name, email, role, avatar_url').ilike('email', like).limit(8),
  ])

  return {
    channels: dedupeById([...(chName.data ?? []), ...(chDesc.data ?? [])]).slice(0, 8),
    messages: (msgs.data ?? []) as SearchMessage[],
    users: dedupeById([...(uName.data ?? []), ...(uEmail.data ?? [])]).slice(0, 8),
  }
}

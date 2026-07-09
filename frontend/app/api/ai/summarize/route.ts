import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiReady, aiComplete } from '@/lib/ai'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!aiReady()) return NextResponse.json({ ok: false, reason: 'ai-not-configured' })

  const { channelId } = (await req.json().catch(() => ({}))) as { channelId?: string }
  if (!channelId) return NextResponse.json({ error: 'channelId required' }, { status: 400 })

  // RLS scopes this read to channels the caller may access — no cross-year leakage.
  const { data: msgs } = await supabase
    .from('messages')
    .select('content, created_at, users:users!messages_sender_id_fkey(name)')
    .eq('channel_id', channelId)
    .is('deleted_at', null)
    .not('content', 'is', null)
    .order('created_at', { ascending: false })
    .limit(80)

  if (!msgs || msgs.length === 0) {
    return NextResponse.json({ ok: true, summary: 'No recent discussion to summarize.' })
  }

  const transcript = msgs
    .reverse()
    .map((m: any) => `${m.users?.name ?? 'User'}: ${m.content}`)
    .join('\n')
    .slice(0, 8000)

  try {
    const summary = await aiComplete({
      system:
        'You summarize a college channel conversation into a concise digest of at most 6 bullet points. Focus on decisions, deadlines, questions, and action items. Be factual and do not invent anything not present in the text.',
      prompt: `Summarize this channel conversation:\n\n${transcript}`,
      maxTokens: 500,
    })
    return NextResponse.json({ ok: true, summary })
  } catch {
    return NextResponse.json({ ok: false, reason: 'ai-error' }, { status: 502 })
  }
}

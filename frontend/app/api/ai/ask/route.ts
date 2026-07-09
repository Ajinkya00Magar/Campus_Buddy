import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiReady, aiComplete } from '@/lib/ai'

export const runtime = 'nodejs'

/** Campus FAQ assistant. Auth-gated; degrades to a graceful no-op when AI is off. */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!aiReady()) return NextResponse.json({ ok: false, reason: 'ai-not-configured' })

  const { question } = (await req.json().catch(() => ({}))) as { question?: string }
  if (!question || !question.trim()) return NextResponse.json({ error: 'question required' }, { status: 400 })

  try {
    const answer = await aiComplete({
      system:
        'You are Campus Buddy, a friendly assistant for students at MIT Academy of Engineering (MITAOE). Help with campus life, academics, events, clubs, and using this app. Keep answers concise and practical. If you are unsure or the question needs official confirmation, say so and suggest contacting the relevant department or faculty. Never invent policies, dates, or contacts.',
      prompt: question.slice(0, 2000),
      maxTokens: 600,
    })
    return NextResponse.json({ ok: true, answer })
  } catch {
    return NextResponse.json({ ok: false, reason: 'ai-error' }, { status: 502 })
  }
}

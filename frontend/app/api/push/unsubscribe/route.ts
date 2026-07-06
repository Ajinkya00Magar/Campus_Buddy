import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { endpoint } = (await req.json().catch(() => ({}))) as { endpoint?: string }
  if (endpoint) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', user.id)
  }
  return NextResponse.json({ ok: true })
}

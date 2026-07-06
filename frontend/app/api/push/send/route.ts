import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceClient, sendPushToUser, webPushReady } from '@/lib/webpush'

export const runtime = 'nodejs'

/**
 * Fan out push notifications for already-created notification rows.
 *
 * Security: the caller must be authenticated, and the pushed title/body/target
 * are read from the `notifications` rows (never from client input) — each push
 * goes only to that row's own user_id. So the worst a caller can do is re-send a
 * notification its rightful owner would already receive. Capped at 100 ids.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!webPushReady()) return NextResponse.json({ ok: false, reason: 'push-not-configured' })

  const body = (await req.json().catch(() => null)) as { notificationIds?: unknown } | null
  const ids = Array.isArray(body?.notificationIds)
    ? (body!.notificationIds as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, 100)
    : []
  if (ids.length === 0) return NextResponse.json({ ok: true, sent: 0 })

  const admin = serviceClient()
  const { data: notifs } = await admin
    .from('notifications')
    .select('user_id, title, body, link')
    .in('id', ids)

  if (!notifs || notifs.length === 0) return NextResponse.json({ ok: true, sent: 0 })

  await Promise.all(
    notifs.map((n) =>
      sendPushToUser(n.user_id, { title: n.title, body: n.body ?? undefined, url: n.link ?? '/' })
    )
  )
  return NextResponse.json({ ok: true, sent: notifs.length })
}

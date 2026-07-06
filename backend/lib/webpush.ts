import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// ── VAPID configuration (server-only secrets) ──
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

let configured = false
export function webPushReady(): boolean {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false
  if (!configured) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
    configured = true
  }
  return true
}

// Service-role client for the send path (reads any user's subscriptions,
// prunes dead ones). NEVER import this into client code.
export function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export type PushPayload = { title: string; body?: string; url?: string; icon?: string }

/**
 * Send a push to every subscription belonging to `userId`.
 * Subscriptions that return 404/410 (expired/unsubscribed) are pruned.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!webPushReady()) return
  const supabase = serviceClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return
  const body = JSON.stringify(payload)

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body
        )
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', s.id)
        }
      }
    })
  )
}

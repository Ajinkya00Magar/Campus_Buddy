// Client-side Web Push helpers. Call only in the browser.

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  // Back the view with a concrete ArrayBuffer so it satisfies BufferSource.
  const output = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

/**
 * Ensure this browser is subscribed to Web Push and the subscription is stored
 * server-side. Safe to call repeatedly and on browsers without support — it just
 * returns false. Requires notification permission to already be granted.
 */
export async function subscribeToPush(): Promise<boolean> {
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapid) return false
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false

  try {
    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
      })
    }
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Fire-and-forget: ask the server to push these (already-created) notifications. */
export function triggerPush(notificationIds: string[]): void {
  if (typeof window === 'undefined' || notificationIds.length === 0) return
  fetch('/api/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationIds }),
  }).catch(() => {
    /* best-effort — notifications still land in-app via realtime */
  })
}

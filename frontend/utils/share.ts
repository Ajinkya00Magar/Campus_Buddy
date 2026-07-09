/**
 * Share content via the native OS share sheet (Web Share API) when available,
 * falling back to copying a link/text to the clipboard. Returns how it resolved
 * so callers can show the right toast.
 */
export async function shareContent(payload: { title?: string; text?: string; url?: string }): Promise<'shared' | 'copied' | 'failed'> {
  const url = payload.url ?? (typeof window !== 'undefined' ? window.location.href : undefined)
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: payload.title, text: payload.text, url })
      return 'shared'
    }
  } catch (err) {
    // AbortError = user cancelled the share sheet; treat as a no-op success.
    if ((err as { name?: string })?.name === 'AbortError') return 'shared'
  }
  try {
    const toCopy = url ?? payload.text ?? payload.title ?? ''
    if (toCopy && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(toCopy)
      return 'copied'
    }
  } catch {
    /* ignore */
  }
  return 'failed'
}

/** Absolute URL for a channel (for sharing). */
export function channelShareUrl(channelId: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  return `${base}/channels/${channelId}`
}

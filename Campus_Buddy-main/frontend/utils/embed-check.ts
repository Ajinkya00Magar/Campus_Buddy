function cspBlocksEmbed(csp: string): boolean {
  const normalized = csp.toLowerCase()
  if (normalized.includes("frame-ancestors 'none'")) return true

  const match = normalized.match(/frame-ancestors\s+([^;]+)/)
  if (!match) return false

  const directives = match[1].trim()
  if (directives === "'self'") return true
  if (directives.includes('*')) return false

  // Restrictive host list without wildcard — likely blocks our origin.
  return directives.split(/\s+/).some((part) => part.startsWith('http'))
}

export async function canEmbedUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })

    const xfo = response.headers.get('x-frame-options')?.toLowerCase()
    if (xfo === 'deny' || xfo === 'sameorigin') return false

    const csp = response.headers.get('content-security-policy')
    if (csp && cspBlocksEmbed(csp)) return false

    return true
  } catch {
    // Many hosts reject HEAD; try embed optimistically and fall back in the UI if needed.
    return true
  }
}

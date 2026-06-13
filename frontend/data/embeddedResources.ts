export type EmbeddedResource = {
  id: string
  title: string
  provider: string
  source_url: string
  /** Skip iframe attempt when the host is known to block embedding */
  embed_blocked?: boolean
}

export const embeddedResources: Record<string, EmbeddedResource> = {
  notes: {
    id: 'notes',
    title: 'MITAOE Notes',
    provider: 'Campus Buddy',
    source_url: 'https://mitaoe-notes.vercel.app/',
  },
  pyqs: {
    id: 'pyqs',
    title: 'MITAOE PYQs',
    provider: 'Campus Buddy',
    source_url: 'https://mitaoe-pyqs.vercel.app/',
  },
}

export function getEmbeddedResource(id: string): EmbeddedResource | undefined {
  return embeddedResources[id]
}

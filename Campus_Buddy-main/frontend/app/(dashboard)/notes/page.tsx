import { notFound } from 'next/navigation'
import { getEmbeddedResource } from '@/data/embeddedResources'
import { canEmbedUrl } from '@/utils/embed-check'
import EmbeddedResourceViewer from '@/components/embed/EmbeddedResourceViewer'

export default async function NotesPage() {
  const resource = getEmbeddedResource('notes')
  if (!resource) notFound()

  const embedAllowed = resource.embed_blocked ? false : await canEmbedUrl(resource.source_url)

  return (
    <div className="h-full min-h-0">
      <EmbeddedResourceViewer resource={resource} embedAllowed={embedAllowed} />
    </div>
  )
}

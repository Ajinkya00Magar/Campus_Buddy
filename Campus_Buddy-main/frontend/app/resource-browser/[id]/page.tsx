import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEmbeddedResource } from '@/data/embeddedResources'
import ResourceBrowserClient from './ResourceBrowserClient'

export default async function ResourceBrowserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const resource = getEmbeddedResource(id)
  if (!resource?.source_url) notFound()

  return (
    <ResourceBrowserClient
      resourceId={resource.id}
      resourceTitle={resource.title}
      provider={resource.provider}
      sourceUrl={resource.source_url}
    />
  )
}

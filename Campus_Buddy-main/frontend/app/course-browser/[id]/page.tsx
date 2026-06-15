import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLiveCourse } from '@/data/liveCourses'
import CourseBrowserClient from './CourseBrowserClient'

export default async function CourseBrowserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const course = getLiveCourse(id)
  if (!course?.source_url) notFound()

  return (
    <CourseBrowserClient
      courseId={course.id}
      courseTitle={course.title}
      provider={course.provider ?? 'External Course'}
      sourceUrl={course.source_url}
    />
  )
}

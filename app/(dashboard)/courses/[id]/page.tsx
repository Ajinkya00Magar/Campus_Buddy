import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CourseDetailClient from './CourseDetailClient'
import type { CourseModule } from '@/types'

export default async function CoursePage({ params }: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: course }, { data: progress }, { data: completion }] = await Promise.all([
    supabase.from('courses').select('*, course_modules(*)').eq('id', params.id).single(),
    supabase.from('course_progress').select('*').eq('user_id', user.id).eq('course_id', params.id),
    supabase.from('course_completions').select('id').eq('user_id', user.id).eq('course_id', params.id).maybeSingle(),
  ])

  if (!course) notFound()

  course.course_modules = [...(course.course_modules ?? [])].sort(
    (a: CourseModule, b: CourseModule) => a.order_index - b.order_index
  )

  return (
    <CourseDetailClient
      course={course}
      progress={progress ?? []}
      isCompleted={!!completion}
      userId={user.id}
    />
  )
}

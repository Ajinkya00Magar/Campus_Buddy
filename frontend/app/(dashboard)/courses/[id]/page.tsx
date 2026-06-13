import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CourseDetailClient from './CourseDetailClient'
import type { CourseModule } from '@/types'
import { getLiveCourse } from '../../../../data/liveCourses'

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()
  const userName = profile?.name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Campus Buddy Learner'

  const liveCourse = getLiveCourse(id)
  if (liveCourse) {
    const { data: courseStatus } = await supabase
      .from('course_learning_status')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', id)
      .maybeSingle()

    return (
      <CourseDetailClient
        course={liveCourse}
        progress={[]}
        isCompleted={courseStatus?.status === 'completed'}
        completedAt={courseStatus?.completed_at}
        courseStatus={courseStatus}
        userId={user.id}
        userName={userName}
      />
    )
  }

  const [{ data: course }, { data: progress }, { data: completion }, { data: courseStatus }] = await Promise.all([
    supabase.from('courses').select('*, course_modules(*)').eq('id', id).single(),
    supabase.from('course_progress').select('*').eq('user_id', user.id).eq('course_id', id),
    supabase.from('course_completions').select('id, completed_at').eq('user_id', user.id).eq('course_id', id).maybeSingle(),
    supabase.from('course_learning_status').select('*').eq('user_id', user.id).eq('course_id', id).maybeSingle(),
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
      completedAt={completion?.completed_at}
      courseStatus={courseStatus}
      userId={user.id}
      userName={userName}
    />
  )
}

import { createClient } from '@/lib/supabase/client'
import type { Course, CourseModule, CourseProgress } from '@/types'

export async function getCourses(): Promise<Course[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('courses')
    .select('*, course_modules(count)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  return (data ?? []).map((c: any) => ({
    ...c,
    _modules_count: c.course_modules?.[0]?.count ?? 0,
  }))
}

export async function getCourse(id: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('courses')
    .select('*, course_modules(*)')
    .eq('id', id)
    .single()
  if (data?.course_modules) {
    data.course_modules = [...data.course_modules].sort(
      (a: CourseModule, b: CourseModule) => a.order_index - b.order_index
    )
  }
  return data as Course | null
}

export async function getUserProgress(
  userId: string,
  courseId: string
): Promise<CourseProgress[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
  return data ?? []
}

export async function markModuleComplete(
  userId: string,
  courseId: string,
  moduleId: string
) {
  const supabase = createClient()
  const { error } = await supabase.from('course_progress').upsert(
    {
      user_id: userId,
      course_id: courseId,
      module_id: moduleId,
      completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,course_id,module_id' }
  )
  return { error }
}

export async function checkCourseComplete(
  userId: string,
  courseId: string
): Promise<boolean> {
  const supabase = createClient()
  const [{ count: total }, { count: done }] = await Promise.all([
    supabase
      .from('course_modules')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId),
    supabase
      .from('course_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('completed', true),
  ])
  return (total ?? 0) > 0 && total === done
}

export async function awardCourseCompletion(userId: string, courseId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('course_completions').upsert(
    { user_id: userId, course_id: courseId, completed_at: new Date().toISOString() },
    { onConflict: 'user_id,course_id' }
  )
  return { error }
}

export async function isCourseCompleted(
  userId: string,
  courseId: string
): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('course_completions')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()
  return !!data
}

export async function getAllCourses(): Promise<Course[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('courses')
    .select('*, course_modules(count)')
    .order('created_at', { ascending: false })
  return (data ?? []).map((c: any) => ({
    ...c,
    _modules_count: c.course_modules?.[0]?.count ?? 0,
  }))
}

export async function createCourse(payload: Partial<Course>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('courses')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export async function createModule(payload: Partial<CourseModule>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('course_modules')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

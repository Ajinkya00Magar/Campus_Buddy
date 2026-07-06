import { createClient } from '@/lib/supabase/server'
import { liveCourses } from '@/data/liveCourses'
import CoursesClient from './CoursesClient'



export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: courses }, { data: completions }, { data: progressData }] = await Promise.all([
    supabase.from('courses').select('*, course_modules(count)').eq('is_published', true).order('created_at', { ascending: false }),
    supabase.from('course_completions').select('course_id').eq('user_id', user.id),
    supabase.from('course_progress').select('course_id, module_id').eq('user_id', user.id).eq('completed', true),
  ])

  const completedIds = new Set((completions ?? []).map((c: any) => c.course_id))
  const progressMap: Record<string, number> = {}
  for (const p of (progressData ?? [])) {
    progressMap[p.course_id] = (progressMap[p.course_id] ?? 0) + 1
  }

  const dbCourses = (courses ?? []).map((c: any) => ({
    ...c,
    _modules_count: c.course_modules?.[0]?.count ?? 0,
  }))
  const mapped = [...liveCourses, ...dbCourses]

  return (
    <CoursesClient 
      mapped={mapped}
      completionsCount={completions?.length ?? 0}
      completedIds={completedIds}
      progressMap={progressMap}
    />
  )
}

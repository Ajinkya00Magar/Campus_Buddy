import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, Trophy, Layers } from 'lucide-react'
import { getLevelColor } from '@/lib/utils'

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

  const mapped = (courses ?? []).map((c: any) => ({
    ...c,
    _modules_count: c.course_modules?.[0]?.count ?? 0,
  }))

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {completions?.length ?? 0} of {mapped.length} completed
          </p>
        </div>
        {(completions?.length ?? 0) > 0 && (
          <div className="flex items-center gap-2 text-sm text-amber-600 font-medium">
            <Trophy className="h-4 w-4" />
            {completions?.length} badge{completions?.length !== 1 ? 's' : ''} earned
          </div>
        )}
      </div>

      {mapped.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-muted-foreground">No courses available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mapped.map((course: any) => {
            const done = completedIds.has(course.id)
            const completed = progressMap[course.id] ?? 0
            const total = course._modules_count
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0

            return (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <Card className="h-full hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden">
                  {course.thumbnail ? (
                    <div className="h-32 overflow-hidden">
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-emerald-500/10 to-teal-600/20 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-emerald-400/40" />
                    </div>
                  )}
                  <CardContent className="pt-4 pb-4 space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors text-sm leading-snug">{course.title}</h3>
                        {done && <Trophy className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
                      </div>
                      {course.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${getLevelColor(course.level)}`}>
                        {course.level}
                      </span>
                      {course.duration && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />{course.duration}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Layers className="h-2.5 w-2.5" />{total} modules
                      </span>
                    </div>

                    {/* Progress bar */}
                    {total > 0 && (
                      <div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>{done ? 'Completed' : pct > 0 ? 'In Progress' : 'Not started'}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${done ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

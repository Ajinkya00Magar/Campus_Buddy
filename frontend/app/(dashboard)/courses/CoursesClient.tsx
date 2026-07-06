'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, Trophy, Layers, Sparkles } from 'lucide-react'
import { getLevelColor } from '@/lib/utils'
import Reveal from '@/components/motion/Reveal'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import TiltCard from '@/components/motion/TiltCard'
import { SpatialCard } from '@/components/ui/spatial-card'

export default function CoursesClient({
  mapped,
  completionsCount,
  completedIds,
  progressMap
}: {
  mapped: any[]
  completionsCount: number
  completedIds: Set<string>
  progressMap: Record<string, number>
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <Reveal as="section" direction="down" pop onView={false} className="relative overflow-hidden rounded-[2.5rem] bg-card/60 backdrop-blur-3xl border border-white/20 p-6 shadow-[0_24px_80px_rgba(6,95,70,0.12)] dark:border-white/10 dark:shadow-[0_24px_80px_rgba(0,0,0,0.3)] md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border border-emerald-400/20 bg-emerald-400/10 blur-sm animate-floaty" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between z-10">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Learning studio
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Courses</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{completionsCount} of {mapped.length} completed.</p>
          </div>
          {completionsCount > 0 && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-300/40 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-600">
              <Trophy className="h-4 w-4" />
              {completionsCount} badge{completionsCount !== 1 ? 's' : ''} earned
            </div>
          )}
        </div>
      </Reveal>

      {mapped.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-muted-foreground">No courses available yet</p>
        </div>
      ) : (
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mapped.map((course: any) => {
            const done = completedIds.has(course.id)
            const completed = progressMap[course.id] ?? 0
            const total = course._modules_count
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0
            const quizCount = course.quiz_questions?.length ?? 0

            return (
              <StaggerItem key={course.id} className="h-full">
                <Link href={`/courses/${course.id}`} className="block h-full group">
                  <TiltCard max={4} className="h-full rounded-[2rem]">
                    <SpatialCard contentClassName="p-0" className="h-full rounded-[2rem] border-white/30 dark:border-white/10 group-hover:border-emerald-500/30 transition-colors duration-500">
                      {course.thumbnail ? (
                        <div className="h-40 overflow-hidden shrink-0">
                          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                      ) : (
                        <div className="h-40 bg-gradient-to-br from-emerald-500/10 to-teal-600/20 flex items-center justify-center shrink-0">
                          <BookOpen className="h-10 w-10 text-emerald-400/40" />
                        </div>
                      )}
                      <div className="p-6 flex flex-col flex-1 space-y-4">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-base leading-snug">{course.title}</h3>
                            {done && <Trophy className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 drop-shadow-md" />}
                          </div>
                          {course.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {course.provider && (
                            <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none">
                              Live
                            </Badge>
                          )}
                          {quizCount > 0 && (
                            <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-bold tracking-wider uppercase bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-none">
                              MCQ
                            </Badge>
                          )}
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${getLevelColor(course.level)}`}>
                            {course.level}
                          </span>
                          {course.duration && (
                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />{course.duration}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                            <Layers className="h-3 w-3" />{quizCount > 0 ? `${quizCount} MCQs` : `${total} modules`}
                          </span>
                        </div>

                        {/* Progress bar */}
                        {total > 0 && (
                          <div className="mt-auto pt-2">
                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                              <span>{done ? 'Completed' : pct > 0 ? 'In Progress' : 'Not started'}</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${done ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </SpatialCard>
                  </TiltCard>
                </Link>
              </StaggerItem>
            )
          })}
        </Stagger>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { markModuleComplete, awardCourseCompletion, checkCourseComplete } from '@/services/courses.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CheckCircle2, Circle, PlayCircle, Clock, Layers, ArrowLeft, Trophy, Download, BookOpen } from 'lucide-react'
import { getLevelColor } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import type { Course, CourseModule, CourseProgress } from '@/types'

export default function CourseDetailClient({
  course, progress: initialProgress, isCompleted: initialCompleted, userId
}: {
  course: Course & { course_modules: CourseModule[] }
  progress: CourseProgress[]
  isCompleted: boolean
  userId: string
}) {
  const { toast } = useToast()
  const [progress, setProgress] = useState(initialProgress)
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [showBadge, setShowBadge] = useState(false)
  const [activeModule, setActiveModule] = useState<CourseModule | null>(
    course.course_modules[0] ?? null
  )
  const [marking, setMarking] = useState(false)

  const completedIds = new Set(progress.filter((p) => p.completed).map((p) => p.module_id))
  const total = course.course_modules.length
  const pct = total > 0 ? Math.round((completedIds.size / total) * 100) : 0

  const handleMarkComplete = async (mod: CourseModule) => {
    if (completedIds.has(mod.id) || marking) return
    setMarking(true)
    const { error } = await markModuleComplete(userId, course.id, mod.id)
    if (error) {
      toast({ title: 'Error', description: 'Could not save progress', variant: 'destructive' })
      setMarking(false)
      return
    }

    const updatedProgress = [...progress, {
      user_id: userId, course_id: course.id, module_id: mod.id, completed: true
    }] as CourseProgress[]
    setProgress(updatedProgress)

    const done = await checkCourseComplete(userId, course.id)
    if (done && !isCompleted) {
      await awardCourseCompletion(userId, course.id)
      setIsCompleted(true)
      setShowBadge(true)
      toast({ title: '🎉 Course Completed!', description: 'You earned a badge!' })
    } else {
      toast({ title: 'Module completed!', description: `${completedIds.size + 1} of ${total} done.` })
    }

    // Auto-advance
    const idx = course.course_modules.findIndex((m) => m.id === mod.id)
    if (idx < course.course_modules.length - 1) {
      setActiveModule(course.course_modules[idx + 1])
    }
    setMarking(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${getLevelColor(course.level)}`}>{course.level}</span>
            {course.duration && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>}
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Layers className="h-3 w-3" />{total} modules</span>
            {isCompleted && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                <Trophy className="h-3 w-3" /> Completed
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          {course.description && <p className="text-muted-foreground mt-1.5 text-sm">{course.description}</p>}
        </div>
        {/* Progress */}
        <div className="w-full md:w-52 shrink-0">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-gray-700">{pct}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-right">{completedIds.size}/{total} modules</p>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module List */}
        <div className="lg:col-span-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">Course Modules</h3>
          <div className="space-y-1">
            {course.course_modules.map((mod, idx) => {
              const done = completedIds.has(mod.id)
              const active = activeModule?.id === mod.id
              return (
                <button key={mod.id} onClick={() => setActiveModule(mod)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                    active
                      ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                      : 'hover:bg-gray-50 border-transparent hover:border-gray-100'
                  }`}>
                  <div className="shrink-0">
                    {done
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      : <Circle className={`h-5 w-5 ${active ? 'text-emerald-400' : 'text-gray-300'}`} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${active ? 'text-emerald-800' : done ? 'text-gray-500' : 'text-gray-800'}`}>
                      {idx + 1}. {mod.title}
                    </p>
                    {mod.duration && <p className="text-[11px] text-muted-foreground">{mod.duration}</p>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Module Content */}
        <div className="lg:col-span-2">
          {activeModule ? (
            <Card>
              <CardContent className="pt-5 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-bold text-lg leading-tight">{activeModule.title}</h2>
                  <Button
                    size="sm"
                    onClick={() => handleMarkComplete(activeModule)}
                    disabled={completedIds.has(activeModule.id) || marking}
                    className={`shrink-0 ${
                      completedIds.has(activeModule.id)
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-[#1E3A8A] hover:bg-[#1e40af] text-white'
                    }`}
                  >
                    {completedIds.has(activeModule.id)
                      ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Done</>
                      : marking ? 'Saving...' : 'Mark Complete'
                    }
                  </Button>
                </div>

                {/* Video */}
                {activeModule.video_url && (
                  <div className="rounded-xl overflow-hidden bg-black aspect-video">
                    {activeModule.video_url.includes('youtube.com') || activeModule.video_url.includes('youtu.be') ? (
                      <iframe
                        src={activeModule.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    ) : (
                      <a href={activeModule.video_url} target="_blank" rel="noreferrer"
                        className="flex items-center justify-center h-full text-white gap-3 hover:bg-white/5 transition">
                        <PlayCircle className="h-16 w-16 text-white/60" />
                        <span className="text-sm">Open Video</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Text content */}
                {activeModule.content && (
                  <div className="prose prose-sm max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm bg-gray-50 rounded-xl p-4 border">
                      {activeModule.content}
                    </div>
                  </div>
                )}

                {!activeModule.video_url && !activeModule.content && (
                  <div className="text-center py-12">
                    <BookOpen className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No content yet for this module.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Select a module to get started
            </div>
          )}
        </div>
      </div>

      {/* Badge Modal */}
      {showBadge && (
        <Dialog open onOpenChange={() => setShowBadge(false)}>
          <DialogContent className="max-w-sm text-center">
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="relative">
                <div className="h-28 w-28 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl">
                  <Trophy className="h-14 w-14 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white text-lg shadow">✓</div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">Course Complete! 🎉</h2>
                <p className="text-muted-foreground text-sm mt-1">You&apos;ve mastered</p>
                <p className="font-semibold text-gray-900 mt-0.5">{course.title}</p>
              </div>

              {/* Certificate UI */}
              <div className="w-full border-2 border-dashed border-amber-200 rounded-2xl p-5 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="flex items-center justify-center mb-3">
                  <Trophy className="h-6 w-6 text-amber-600 mr-2" />
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">Certificate of Completion</span>
                </div>
                <p className="font-bold text-gray-900 text-lg">{course.title}</p>
                <p className="text-xs text-gray-500 mt-1">MIT Academy of Engineering • Campus Buddy</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1" onClick={() => setShowBadge(false)}>Close</Button>
                <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white gap-2">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

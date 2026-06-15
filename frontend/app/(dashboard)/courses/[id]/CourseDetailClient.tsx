'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { markModuleComplete, awardCourseCompletion, checkCourseComplete, saveCourseLearningStatus } from '@/services/courses.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle2, Circle, PlayCircle, Clock, Layers, ArrowLeft, Trophy, Download, BookOpen, ArrowUpRight, ExternalLink, Loader2, Maximize2, Minimize2 } from 'lucide-react'
import { cn, getLevelColor } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import type { Course, CourseLearningStatus, CourseModule, CourseProgress } from '@/types'
import type { QuizQuestion } from '@/data/liveCourses'
import { generateCourseCertificate } from '@/utils/courseCertificates'
import { getLocalCourseCompletion, saveLocalCourseCompletion } from '@/utils/localCourseCompletions'

type CourseWithModules = Course & {
  course_modules: CourseModule[]
  course_no?: string
  provider?: string
  source_url?: string
  embed_blocked?: boolean
  quiz_questions?: QuizQuestion[]
}

export default function CourseDetailClient({
  course, progress: initialProgress, isCompleted: initialCompleted, completedAt: initialCompletedAt, courseStatus, userId, userName
}: {
  course: CourseWithModules
  progress: CourseProgress[]
  isCompleted: boolean
  completedAt?: string
  courseStatus?: CourseLearningStatus | null
  userId: string
  userName: string
}) {
  const { toast } = useToast()
  const [progress, setProgress] = useState(initialProgress)
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [showBadge, setShowBadge] = useState(false)
  const [activeModule, setActiveModule] = useState<CourseModule | null>(
    course.course_modules[0] ?? null
  )
  const [marking, setMarking] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [localCompletedAt, setLocalCompletedAt] = useState<string | undefined>(undefined)
  const [statusProgress, setStatusProgress] = useState(courseStatus?.progress_percent ?? (initialCompleted ? 100 : 0))
  const [savingStatus, setSavingStatus] = useState(false)
  const [iframeFailed, setIframeFailed] = useState(false)
  const [iframeLoading, setIframeLoading] = useState(Boolean(course.source_url && !course.embed_blocked))
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showExitControl, setShowExitControl] = useState(false)
  const loadTimerRef = useRef<number | null>(null)
  const embedRef = useRef<HTMLDivElement>(null)
  const hideControlTimerRef = useRef<number | null>(null)

  const embeddedCourseUrl = course.source_url
  const providerBlocksEmbed = Boolean(course.embed_blocked || iframeFailed)
  const quizQuestions = course.quiz_questions ?? []
  const hasQuiz = quizQuestions.length > 0
  const singleStepCourse = Boolean(embeddedCourseUrl || hasQuiz)
  const completedIds = new Set(progress.filter((p) => p.completed).map((p) => p.module_id))
  const total = embeddedCourseUrl || hasQuiz ? 1 : course.course_modules.length
  const answeredPct = hasQuiz ? Math.round((Object.keys(quizAnswers).length / Math.max(quizQuestions.length, 1)) * 100) : 0
  const modulePct = total > 0 ? Math.round((completedIds.size / total) * 100) : 0
  const pct = isCompleted
    ? 100
    : singleStepCourse
      ? Math.max(statusProgress, hasQuiz ? answeredPct : 0)
      : modulePct
  const quizScore = quizQuestions.reduce(
    (score, question) => score + (quizAnswers[question.id] === question.answer_index ? 1 : 0),
    0
  )
  const quizComplete = quizQuestions.length > 0 && Object.keys(quizAnswers).length === quizQuestions.length
  const certificateReady = isCompleted || (hasQuiz && quizSubmitted)
  const certificateCompletedAt = localCompletedAt ?? initialCompletedAt

  useEffect(() => {
    const localCompletion = getLocalCourseCompletion(userId, course.id)
    const storedCompletionAt = courseStatus?.completed_at ?? localCompletion?.completed_at

    if (courseStatus?.status === 'completed' || localCompletion) {
      setIsCompleted(true)
      setQuizSubmitted(true)
      setStatusProgress(100)
      setLocalCompletedAt(storedCompletionAt)

      if (singleStepCourse && course.course_modules[0]) {
        setProgress([{
          user_id: userId,
          course_id: course.id,
          module_id: course.course_modules[0].id,
          completed: true,
          completed_at: storedCompletionAt,
        }])
      }
    } else if (courseStatus?.status === 'ongoing') {
      setStatusProgress(courseStatus.progress_percent)
    }
  }, [course.id, course.course_modules, courseStatus, singleStepCourse, userId])

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    }
  }, [])

  const enterFullscreen = useCallback(async () => {
    if (!embedRef.current) return
    await embedRef.current.requestFullscreen()
  }, [])

  const revealExitControl = useCallback(() => {
    setShowExitControl(true)
    if (hideControlTimerRef.current !== null) {
      window.clearTimeout(hideControlTimerRef.current)
    }
    hideControlTimerRef.current = window.setTimeout(() => {
      setShowExitControl(false)
    }, 2800)
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === embedRef.current)
      if (!document.fullscreenElement) {
        setShowExitControl(false)
      }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      if (hideControlTimerRef.current !== null) {
        window.clearTimeout(hideControlTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!embeddedCourseUrl || course.embed_blocked) return

    loadTimerRef.current = window.setTimeout(() => {
      setIframeFailed(true)
      setIframeLoading(false)
    }, 12000)

    return () => {
      if (loadTimerRef.current !== null) {
        window.clearTimeout(loadTimerRef.current)
      }
    }
  }, [course.embed_blocked, embeddedCourseUrl])

  const handleCourseIframeLoad = () => {
    if (loadTimerRef.current !== null) {
      window.clearTimeout(loadTimerRef.current)
      loadTimerRef.current = null
    }
    setIframeLoading(false)
    setIframeFailed(false)
    handleStartLiveCourse()
  }

  const generateCertificate = () => {
    if (!certificateReady) return

    generateCourseCertificate({
      courseId: course.id,
      courseTitle: course.title,
      userId,
      userName,
      completedAt: certificateCompletedAt,
    })
    toast({ title: 'Certificate generated', description: 'Your certificate has been downloaded.' })
  }

  const selectQuizAnswer = (questionId: string, answerIndex: number) => {
    if (quizSubmitted) return
    setQuizAnswers((prev) => ({ ...prev, [questionId]: answerIndex }))
  }

  const saveUnifiedStatus = async (status: 'ongoing' | 'completed', progressPercent: number, completedAt?: string) => {
    const { error } = await saveCourseLearningStatus({
      user_id: userId,
      course_id: course.id,
      course_title: course.title,
      provider: course.provider,
      status,
      progress_percent: progressPercent,
      completed_at: completedAt,
    })

    if (error) {
      toast({
        title: 'Progress saved locally',
        description: 'Run the course status migration to store this in Supabase too.',
        variant: 'destructive',
      })
    }
  }

  const submitQuiz = async () => {
    if (!quizComplete) {
      toast({ title: 'Answer all questions', description: 'Complete all 5 MCQs before submitting.' })
      return
    }
    const localCompletion = saveLocalCourseCompletion(userId, {
      course_id: course.id,
      title: course.title,
    })
    await saveUnifiedStatus('completed', 100, localCompletion?.completed_at)
    if (course.course_modules[0]) {
      setProgress([{
        user_id: userId,
        course_id: course.id,
        module_id: course.course_modules[0].id,
        completed: true,
        completed_at: localCompletion?.completed_at,
      }])
    }
    setQuizSubmitted(true)
    setIsCompleted(true)
    setStatusProgress(100)
    setLocalCompletedAt(localCompletion?.completed_at)
    setShowBadge(true)
    toast({ title: 'Quiz submitted', description: `You scored ${quizScore}/${quizQuestions.length}.` })
  }

  const resetQuiz = () => {
    setQuizAnswers({})
    if (!isCompleted) setQuizSubmitted(false)
  }

  const handleStartLiveCourse = async () => {
    if (isCompleted || savingStatus) return
    setSavingStatus(true)
    await saveUnifiedStatus('ongoing', Math.max(statusProgress, 1))
    setStatusProgress((current) => Math.max(current, 1))
    setSavingStatus(false)
  }

  const handleMarkLiveCourseComplete = async () => {
    if (isCompleted || savingStatus) return
    setSavingStatus(true)
    const completion = saveLocalCourseCompletion(userId, {
      course_id: course.id,
      title: course.title,
    })
    await saveUnifiedStatus('completed', 100, completion?.completed_at)
    if (course.course_modules[0]) {
      setProgress([{
        user_id: userId,
        course_id: course.id,
        module_id: course.course_modules[0].id,
        completed: true,
        completed_at: completion?.completed_at,
      }])
    }
    setIsCompleted(true)
    setStatusProgress(100)
    setLocalCompletedAt(completion?.completed_at)
    setShowBadge(true)
    setSavingStatus(false)
    toast({ title: 'Course completed', description: 'Your progress is ready in the Courses page.' })
  }

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
    const nextPct = total > 0 ? Math.round((updatedProgress.filter((p) => p.completed).length / total) * 100) : 0
    await saveUnifiedStatus(nextPct >= 100 ? 'completed' : 'ongoing', nextPct)

    const done = await checkCourseComplete(userId, course.id)
    if (done && !isCompleted) {
      await awardCourseCompletion(userId, course.id)
      await saveUnifiedStatus('completed', 100)
      setIsCompleted(true)
      setStatusProgress(100)
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

  if (embeddedCourseUrl) {
    return (
      <div
        ref={embedRef}
        className={cn(
          'relative flex h-full min-h-0 flex-col bg-background',
          isFullscreen && 'h-screen w-screen',
        )}
        onMouseMove={isFullscreen ? revealExitControl : undefined}
        onTouchStart={isFullscreen ? revealExitControl : undefined}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1E3A8A]/10 text-[#1E3A8A]">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {course.provider ?? 'Campus Buddy'}
              </p>
              <p className="truncate text-sm font-semibold text-foreground">{course.title}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`rounded-full text-white ${
              providerBlocksEmbed ? 'bg-amber-600 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-600'
            }`}>
              {providerBlocksEmbed ? 'WebView mode' : 'Embedded'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (isFullscreen ? exitFullscreen() : enterFullscreen())}
              title={isFullscreen ? 'Exit full screen (Esc)' : 'Full screen (like F11)'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  Exit full screen
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  Fit to screen
                </>
              )}
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={embeddedCourseUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Open site
              </a>
            </Button>
          </div>
        </div>

        {providerBlocksEmbed ? (
          <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 text-center dark:bg-background">
            <div className="max-w-lg">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-amber-500" />
              <h2 className="text-xl font-bold text-foreground">Open in app browser</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                This site blocks iframe embedding, so Campus Buddy opens it as a full-screen in-app course browser instead. Use your browser back control to return here.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                <Button asChild className="bg-[#1E3A8A] text-white hover:bg-[#1e40af]">
                  <Link href={`/course-browser/${course.id}`} onClick={handleStartLiveCourse}>
                    <ArrowUpRight className="h-4 w-4" />
                    Start Course
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMarkLiveCourseComplete}
                  disabled={isCompleted || savingStatus}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isCompleted ? 'Completed' : savingStatus ? 'Saving...' : 'Mark Complete'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {isCompleted ? 'This course is marked complete.' : 'Mark this course complete after finishing the embedded lesson.'}
              </p>
              <Button
                size="sm"
                onClick={handleMarkLiveCourseComplete}
                disabled={isCompleted || savingStatus}
                className="bg-[#1E3A8A] text-white hover:bg-[#1e40af]"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isCompleted ? 'Completed' : savingStatus ? 'Saving...' : 'Mark Complete'}
              </Button>
            </div>
            <div
              className={cn(
                'relative min-h-0 flex-1 bg-white',
                isFullscreen && 'flex h-screen w-screen flex-col',
              )}
            >
              {iframeLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}

              <iframe
                src={embeddedCourseUrl}
                title={`${course.title} embedded course`}
                className="h-full w-full flex-1 border-0"
                allow="fullscreen; clipboard-read; clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={handleCourseIframeLoad}
              />

              {isFullscreen && (
                <>
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 z-20 h-20 bg-gradient-to-b from-black/50 to-transparent"
                    aria-hidden
                  />
                  <div
                    className={cn(
                      'absolute left-1/2 top-4 z-30 -translate-x-1/2 transition-all duration-300',
                      showExitControl
                        ? 'pointer-events-auto translate-y-0 opacity-100'
                        : 'pointer-events-none -translate-y-2 opacity-0',
                    )}
                  >
                    <Button
                      size="sm"
                      onClick={exitFullscreen}
                      className="gap-2 bg-black/75 text-white shadow-lg backdrop-blur-sm hover:bg-black/90"
                    >
                      <Minimize2 className="h-4 w-4" />
                      Exit full screen
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-3 md:p-4">
      <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${getLevelColor(course.level)}`}>{course.level}</span>
            {course.duration && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Layers className="h-3 w-3" />{hasQuiz ? `${quizQuestions.length} MCQs` : `${total} modules`}
            </span>
            {isCompleted && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                <Trophy className="h-3 w-3" /> Completed
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          {course.description && <p className="text-muted-foreground mt-1.5 text-sm">{course.description}</p>}
        </div>
        {hasQuiz ? (
          <div className="w-full md:w-56 shrink-0 rounded-xl border bg-card px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quiz</span>
              <Badge variant="secondary" className="rounded-full text-[10px]">5 MCQs</Badge>
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {quizSubmitted ? `Score ${quizScore}/${quizQuestions.length}` : `${Object.keys(quizAnswers).length}/${quizQuestions.length} answered`}
            </p>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                <span>{isCompleted ? 'Completed' : 'Progress'}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        ) : embeddedCourseUrl ? (
          <div className="w-full md:w-56 shrink-0 rounded-xl border bg-card px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live Course</span>
              <Badge variant="secondary" className="rounded-full text-[10px]">{course.provider ?? 'Embedded'}</Badge>
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground">Course {course.course_no}</p>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                <span>{isCompleted ? 'Completed' : pct > 0 ? 'Ongoing' : 'Not started'}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {certificateReady && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Certificate ready</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generate a completion certificate for {userName}.
                </p>
              </div>
            </div>
            <Button onClick={generateCertificate} className="bg-amber-500 text-white hover:bg-amber-600">
              <Download className="h-4 w-4" />
              Generate Certificate
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {hasQuiz ? (
        <Card>
          <CardContent className="pt-5 space-y-5">
            <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">{course.course_modules[0]?.title ?? 'MCQ Quiz'}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose one answer for each question.</p>
              </div>
              {quizSubmitted && (
                <Badge className="w-fit rounded-full bg-emerald-600 text-white hover:bg-emerald-600">
                  Score {quizScore}/{quizQuestions.length}
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              {quizQuestions.map((question, questionIndex) => {
                const selected = quizAnswers[question.id]

                return (
                  <div key={question.id} className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      {questionIndex + 1}. {question.question}
                    </p>
                    <div className="mt-3 grid gap-2">
                      {question.options.map((option, optionIndex) => {
                        const isSelected = selected === optionIndex
                        const isCorrect = question.answer_index === optionIndex
                        const reveal = quizSubmitted && (isSelected || isCorrect)

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => selectQuizAnswer(question.id, optionIndex)}
                            className={`flex min-h-10 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                              reveal && isCorrect
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : reveal && isSelected
                                  ? 'border-red-300 bg-red-50 text-red-800'
                                  : isSelected
                                    ? 'border-[#1E3A8A] bg-blue-50 text-blue-900'
                                    : 'border-border bg-card text-foreground hover:bg-accent'
                            }`}
                          >
                            <span>{option}</span>
                            {reveal && isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
                            {isSelected && !reveal && <Circle className="h-4 w-4 shrink-0 text-[#1E3A8A]" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {quizSubmitted
                  ? quizScore >= 4 ? 'Great work. You passed this practice quiz.' : 'Review the highlighted answers and try again.'
                  : `${Object.keys(quizAnswers).length}/${quizQuestions.length} questions answered`}
              </p>
              <div className="flex gap-2">
                {quizSubmitted && (
                  <Button variant="outline" onClick={resetQuiz}>Try Again</Button>
                )}
                <Button onClick={submitQuiz} disabled={!quizComplete || quizSubmitted} className="bg-[#1E3A8A] text-white hover:bg-[#1e40af]">
                  Submit Quiz
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
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
      )}

      {/* Badge Modal */}
      {showBadge && (
        <Dialog open onOpenChange={() => setShowBadge(false)}>
          <DialogContent className="max-w-sm text-center">
            <DialogTitle className="sr-only">Course Complete</DialogTitle>
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
                <p className="text-xs text-gray-500">Awarded to</p>
                <p className="font-bold text-gray-900 text-lg">{userName}</p>
                <p className="font-bold text-gray-900 text-lg">{course.title}</p>
                <p className="text-xs text-gray-500 mt-1">MIT Academy of Engineering • Campus Buddy</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1" onClick={() => setShowBadge(false)}>Close</Button>
                <Button onClick={generateCertificate} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white gap-2">
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

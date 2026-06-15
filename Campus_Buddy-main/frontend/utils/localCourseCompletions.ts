export type LocalCourseCompletion = {
  course_id: string
  title: string
  completed_at: string
}

function storageKey(userId: string) {
  return `campus-buddy:course-completions:${userId}`
}

export function getLocalCourseCompletions(userId: string): LocalCourseCompletion[] {
  if (typeof window === 'undefined') return []

  try {
    const value = window.localStorage.getItem(storageKey(userId))
    if (!value) return []
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getLocalCourseCompletion(userId: string, courseId: string) {
  return getLocalCourseCompletions(userId).find((completion) => completion.course_id === courseId) ?? null
}

export function saveLocalCourseCompletion(userId: string, completion: Omit<LocalCourseCompletion, 'completed_at'> & { completed_at?: string }) {
  if (typeof window === 'undefined') return null

  const nextCompletion: LocalCourseCompletion = {
    ...completion,
    completed_at: completion.completed_at ?? new Date().toISOString(),
  }
  const completions = getLocalCourseCompletions(userId)
  const next = [
    nextCompletion,
    ...completions.filter((item) => item.course_id !== completion.course_id),
  ]

  window.localStorage.setItem(storageKey(userId), JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('campus-buddy:course-completions-changed'))
  return nextCompletion
}

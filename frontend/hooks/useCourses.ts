'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Course } from '@/types'

export function useCourses(initialCourses: Course[]) {
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const supabase = createClient()

  useEffect(() => {
    setCourses(initialCourses)
  }, [initialCourses.map(c => c.id).join(',')])

  useEffect(() => {
    const channel = supabase
      .channel('public:courses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCourse = payload.new as Course
            if (newCourse.is_published) {
              setCourses((prev) => [newCourse, ...prev].slice(0, 10))
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Course
            if (updated.is_published) {
              setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
            } else {
              setCourses((prev) => prev.filter((c) => c.id !== updated.id))
            }
          } else if (payload.eventType === 'DELETE') {
            setCourses((prev) => prev.filter((c) => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return courses
}

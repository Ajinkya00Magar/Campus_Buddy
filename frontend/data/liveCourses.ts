import type { Course, CourseModule } from '@/types'

export type LiveCourse = Course & {
  course_no?: string
  provider?: string
  source_url?: string
  embed_blocked?: boolean
  quiz_questions?: QuizQuestion[]
  course_modules: CourseModule[]
}

export type QuizQuestion = {
  id: string
  question: string
  options: string[]
  answer_index: number
}

const createdAt = '2026-06-13T00:00:00.000Z'

export const liveCourses: LiveCourse[] = [
  {
    id: 'dummy-mcq-course',
    title: 'Dummy MCQ Practice Course',
    description: 'A short sample course with 5 multiple-choice questions for testing the in-app quiz flow.',
    duration: '10 min',
    level: 'beginner',
    tags: ['practice', 'mcq', 'demo'],
    is_published: true,
    created_at: createdAt,
    _modules_count: 1,
    course_modules: [
      {
        id: 'dummy-mcq-course-quiz',
        course_id: 'dummy-mcq-course',
        title: '5-Question MCQ Quiz',
        order_index: 1,
        duration: '10 min',
        created_at: createdAt,
      },
    ],
    quiz_questions: [
      {
        id: 'dummy-mcq-q1',
        question: 'What does AI commonly stand for?',
        options: ['Automated Internet', 'Artificial Intelligence', 'Applied Interface', 'Advanced Input'],
        answer_index: 1,
      },
      {
        id: 'dummy-mcq-q2',
        question: 'Which file is commonly used to document a project?',
        options: ['README.md', 'package-lock.json', 'node_modules', '.next'],
        answer_index: 0,
      },
      {
        id: 'dummy-mcq-q3',
        question: 'What is the main purpose of authentication?',
        options: ['To resize images', 'To verify user identity', 'To delete old files', 'To compile CSS only'],
        answer_index: 1,
      },
      {
        id: 'dummy-mcq-q4',
        question: 'Which role should normally have full platform administration access?',
        options: ['Student', 'Admin', 'Guest', 'Unauthenticated user'],
        answer_index: 1,
      },
      {
        id: 'dummy-mcq-q5',
        question: 'What does a course progress bar usually represent?',
        options: ['Screen brightness', 'Completed learning work', 'Network speed', 'Browser cache size'],
        answer_index: 1,
      },
    ],
  },
  {
    id: 'netacad-introduction-to-modern-ai',
    course_no: '01',
    provider: 'Cisco NetAcad',
    source_url: 'https://www.netacad.com/courses/introduction-to-modern-ai?courseLang=en-US&instance_id=ad983490-9d9e-4482-9f3d-4da341095b04',
    embed_blocked: true,
    title: 'Introduction to Modern AI',
    description: 'A Cisco Networking Academy live course for understanding modern AI concepts and practical use cases.',
    duration: 'Self-paced',
    level: 'beginner',
    tags: ['ai', 'cisco netacad', 'live course'],
    is_published: true,
    created_at: createdAt,
    _modules_count: 1,
    course_modules: [
      {
        id: 'netacad-introduction-to-modern-ai-live',
        course_id: 'netacad-introduction-to-modern-ai',
        title: 'Cisco NetAcad Live Course',
        order_index: 1,
        duration: 'Self-paced',
        created_at: createdAt,
      },
    ],
  },
  {
    id: 'netacad-apply-ai-analyze-customer-reviews',
    course_no: '02',
    provider: 'Cisco NetAcad',
    source_url: 'https://www.netacad.com/courses/apply-ai-analyze-customer-reviews?courseLang=en-US&instance_id=bcd37c91-b148-40fe-aa45-e16b62088285',
    embed_blocked: true,
    title: 'Apply AI: Analyze Customer Reviews',
    description: 'A Cisco Networking Academy live course focused on using AI to analyze customer review data.',
    duration: 'Self-paced',
    level: 'beginner',
    tags: ['ai', 'analytics', 'cisco netacad'],
    is_published: true,
    created_at: createdAt,
    _modules_count: 1,
    course_modules: [
      {
        id: 'netacad-apply-ai-analyze-customer-reviews-live',
        course_id: 'netacad-apply-ai-analyze-customer-reviews',
        title: 'Cisco NetAcad Live Course',
        order_index: 1,
        duration: 'Self-paced',
        created_at: createdAt,
      },
    ],
  },
  {
    id: 'netacad-data-analytics-essentials',
    course_no: '03',
    provider: 'Cisco NetAcad',
    source_url: 'https://www.netacad.com/courses/data-analytics-essentials?courseLang=en-US&instance_id=36992db8-9e0e-4d1d-870f-2c44fd2d2655',
    embed_blocked: true,
    title: 'Data Analytics Essentials',
    description: 'A Cisco Networking Academy live course covering core data analytics skills and workflows.',
    duration: 'Self-paced',
    level: 'intermediate',
    tags: ['data analytics', 'cisco netacad', 'live course'],
    is_published: true,
    created_at: createdAt,
    _modules_count: 1,
    course_modules: [
      {
        id: 'netacad-data-analytics-essentials-live',
        course_id: 'netacad-data-analytics-essentials',
        title: 'Cisco NetAcad Live Course',
        order_index: 1,
        duration: 'Self-paced',
        created_at: createdAt,
      },
    ],
  },
]

export function getLiveCourse(id: string) {
  return liveCourses.find((course) => course.id === id) ?? null
}

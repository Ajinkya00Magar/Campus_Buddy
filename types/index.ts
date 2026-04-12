export type UserRole = 'student' | 'teacher' | 'admin'
export type ChannelType = 'academic' | 'subject' | 'club' | 'official'
export type EventStatus = 'going' | 'maybe' | 'not_going'
export type NotifType = 'message' | 'event' | 'course' | 'info'
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department?: string
  year?: number
  avatar_url?: string
  created_at: string
}

export interface Event {
  id: string
  title: string
  description?: string
  category: string
  location?: string
  event_date: string
  banner_url?: string
  created_by?: string
  max_capacity?: number
  is_published: boolean
  created_at: string
  _participants_count?: number
  users?: Pick<User, 'name' | 'avatar_url'>
}

export interface EventParticipant {
  id: string
  event_id: string
  user_id: string
  status: EventStatus
  created_at: string
}

export interface Club {
  id: string
  name: string
  description?: string
  category?: string
  logo_url?: string
  cover_url?: string
  achievements?: string[]
  links?: { label: string; url: string }[]
  faculty_advisor?: string
  created_at: string
  _members_count?: number
}

export interface Course {
  id: string
  title: string
  description?: string
  thumbnail?: string
  duration?: string
  level: CourseLevel
  tags?: string[]
  is_published: boolean
  created_by?: string
  created_at: string
  _modules_count?: number
  course_modules?: CourseModule[]
}

export interface CourseModule {
  id: string
  course_id: string
  title: string
  content?: string
  video_url?: string
  order_index: number
  duration?: string
  created_at: string
}

export interface CourseProgress {
  id?: string
  user_id: string
  course_id: string
  module_id: string
  completed: boolean
  completed_at?: string
}

export interface CourseCompletion {
  id: string
  user_id: string
  course_id: string
  completed_at: string
}

export interface Channel {
  id: string
  name: string
  description?: string
  type: ChannelType
  department?: string
  year?: number
  is_private: boolean
  created_by?: string
  created_at: string
}

export interface Message {
  id: string
  channel_id: string
  sender_id: string
  content?: string
  file_url?: string
  file_name?: string
  is_pinned: boolean
  reply_to?: string
  created_at: string
  users?: Pick<User, 'name' | 'avatar_url' | 'role'>
}

export interface Poll {
  id: string
  channel_id: string
  message_id?: string
  question: string
  options: string[]
  created_by: string
  ends_at?: string
  created_at: string
}

export interface PollVote {
  id: string
  poll_id: string
  user_id: string
  option_idx: number
  voted_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body?: string
  type: NotifType
  link?: string
  is_read: boolean
  created_at: string
}

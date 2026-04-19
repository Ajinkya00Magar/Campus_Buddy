export function isValidMitaoeEmail(email: string): boolean {
  const pattern = /^\d{12}@mitaoe\.ac\.in$/
  return pattern.test(email.trim().toLowerCase())
}

export function validateSignupInput(data: {
  name: string
  email: string
  password: string
  role: string
}): string | null {
  if (!data.name.trim() || data.name.trim().length < 2)
    return 'Name must be at least 2 characters'
  if (!isValidMitaoeEmail(data.email))
    return 'Email must be 12-digit PRN followed by @mitaoe.ac.in (e.g. 123456789012@mitaoe.ac.in)'
  if (data.password.length < 8)
    return 'Password must be at least 8 characters'
  if (!['student', 'teacher', 'admin'].includes(data.role))
    return 'Please select a valid role'
  return null
}

export function validateEventInput(data: {
  title: string
  event_date: string
  category: string
}): string | null {
  if (!data.title.trim()) return 'Event title is required'
  if (!data.event_date) return 'Event date is required'
  if (!data.category.trim()) return 'Category is required'
  return null
}

export function validateChannelInput(data: {
  name: string
  type: string
}): string | null {
  if (!data.name.trim()) return 'Channel name is required'
  if (!/^[a-z0-9-]+$/.test(data.name))
    return 'Channel name can only contain lowercase letters, numbers, and hyphens'
  if (!['academic', 'subject', 'club', 'official'].includes(data.type))
    return 'Invalid channel type'
  return null
}

export function isValidMitaoeEmail(email: string): boolean {
  // Matches both:
  // 1. PRN format: 123456789012@mitaoe.ac.in
  // 2. Name format: john.doe@mitaoe.ac.in
  const pattern = /^[a-z0-9.]+@mitaoe\.ac\.in$/i
  return pattern.test(email.trim().toLowerCase())
}

export function validateSignupInput(data: {
  name: string
  email: string
  password: string
  role: string
  year?: string
}): string | null {
  if (!data.name.trim() || data.name.trim().length < 2)
    return 'Name must be at least 2 characters'
  
  if (!isValidMitaoeEmail(data.email))
    return 'Please use your official @mitaoe.ac.in email'

  if (data.role === 'student' || data.role === 'cr') {
    const isPRN = /^\d{12}@mitaoe\.ac\.in$/i.test(data.email)
    if (!isPRN) return 'Students must use their 12-digit PRN email'
    if (!data.year) return 'Please select your academic year'
  }

  if (data.password.length < 8)
    return 'Password must be at least 8 characters'
  
  if (!['student', 'professor', 'cr', 'admin'].includes(data.role))
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

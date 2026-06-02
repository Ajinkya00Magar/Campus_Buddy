import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return ''
  }
}

export function formatDate(date: string): string {
  try {
    return format(new Date(date), 'dd MMM yyyy, hh:mm a')
  } catch {
    return date
  }
}

export function formatEventDate(date: string): string {
  try {
    return format(new Date(date), 'EEE, dd MMM yyyy • hh:mm a')
  } catch {
    return date
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'professor':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'cr':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    default:
      return 'bg-blue-100 text-blue-700 border-blue-200'
  }
}

export function getChannelTypeColor(type: string): string {
  switch (type) {
    case 'official':
      return 'text-red-500'
    case 'subject':
      return 'text-green-500'
    case 'club':
      return 'text-purple-500'
    default:
      return 'text-blue-500'
  }
}

export function getLevelColor(level: string): string {
  switch (level) {
    case 'advanced':
      return 'bg-red-100 text-red-700'
    case 'intermediate':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-green-100 text-green-700'
  }
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str
}

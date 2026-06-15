import type { User } from '@/types'

export const STUDENT_DEPARTMENT_CODE = 'CSE'
export const STUDENT_DEPARTMENT_LABEL = 'Computer Science Engineering'
export const STUDENT_DEPARTMENT_SHORT = 'CSE'

const DEPARTMENT_LABELS: Record<string, string> = {
  CSE: STUDENT_DEPARTMENT_LABEL,
  IT: 'Information Technology',
}

export function formatDepartmentLabel(code?: string | null) {
  if (!code?.trim()) return null
  const normalized = code.trim().toUpperCase()
  return DEPARTMENT_LABELS[normalized] ?? code.trim()
}

export function getProfileDepartmentDisplay(profile: Pick<User, 'role' | 'department'> | null | undefined) {
  if (!profile) return null

  if (profile.role === 'student' || profile.role === 'cr') {
    return STUDENT_DEPARTMENT_LABEL
  }

  return formatDepartmentLabel(profile.department) ?? profile.department ?? null
}

export function getProfileDepartmentCode(profile: Pick<User, 'role' | 'department'> | null | undefined) {
  if (!profile) return null

  if (profile.role === 'student' || profile.role === 'cr') {
    return STUDENT_DEPARTMENT_CODE
  }

  return profile.department?.trim().toUpperCase() ?? null
}

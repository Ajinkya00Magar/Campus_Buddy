import type { Channel, User } from '@/types'
import { getProfileDepartmentCode } from '@/utils/department'

export const YEAR_LABELS: Record<number, string> = {
  1: 'First Year',
  2: 'Second Year',
  3: 'Third Year',
  4: 'Fourth Year',
}

export const YEAR_VALUES = [1, 2, 3, 4] as const

export function canManageAllYearChannels(profile: Pick<User, 'role'> | null | undefined) {
  return !!profile && ['admin', 'professor', 'cr'].includes(profile.role)
}

export function isYearChannel(channel: Channel) {
  return channel.type === 'academic' || channel.type === 'subject'
}

export function isYearNoticeChannel(channel: Channel) {
  return isYearChannel(channel) && channel.name?.toLowerCase() === 'notices' && typeof channel.year === 'number'
}

export function isNoticeChannel(channel: Channel) {
  return channel.name?.toLowerCase() === 'notices'
}

/** Notices live under Channels → year curriculum; keep them out of the sidebar list. */
export function shouldShowChannelInSidebar(channel: Channel) {
  if (isYearNoticeChannel(channel)) return false
  if (channel.type === 'official' && isNoticeChannel(channel)) return false
  return true
}

export function shouldShowChannelForUser(channel: Channel, profile: Pick<User, 'role' | 'year' | 'department'> | null | undefined) {
  if (!profile) return false
  if (canManageAllYearChannels(profile)) return true

  if (isYearChannel(channel)) {
    if (channel.year !== profile.year) return false
    if (channel.department) {
      const userDept = getProfileDepartmentCode(profile)
      if (userDept && channel.department.toUpperCase() !== userDept) return false
    }
    return true
  }

  if (channel.is_private) return false

  return true
}

export function filterChannelsForUser(channels: Channel[], profile: Pick<User, 'role' | 'year'> | null | undefined) {
  return channels.filter((channel) => shouldShowChannelForUser(channel, profile))
}

export function getVisibleChannelYears(profile: Pick<User, 'role' | 'year'> | null | undefined) {
  if (!profile) return []
  if (canManageAllYearChannels(profile)) return [...YEAR_VALUES]
  return typeof profile.year === 'number' ? [profile.year] : []
}


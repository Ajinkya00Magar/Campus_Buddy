function storageKey(userId: string) {
  return `campus-buddy:club-memberships:${userId}`
}

export function getLocalClubMemberships(userId: string): string[] {
  if (typeof window === 'undefined') return []

  try {
    const value = window.localStorage.getItem(storageKey(userId))
    if (!value) return []
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function isLocalClubMember(userId: string, clubId: string) {
  return getLocalClubMemberships(userId).includes(clubId)
}

export function saveLocalClubMembership(userId: string, clubId: string) {
  if (typeof window === 'undefined') return

  const memberships = getLocalClubMemberships(userId)
  if (!memberships.includes(clubId)) {
    window.localStorage.setItem(storageKey(userId), JSON.stringify([...memberships, clubId]))
  }
}

export function removeLocalClubMembership(userId: string, clubId: string) {
  if (typeof window === 'undefined') return

  const memberships = getLocalClubMemberships(userId)
  window.localStorage.setItem(storageKey(userId), JSON.stringify(memberships.filter((id) => id !== clubId)))
}

export type CourseCertificatePayload = {
  courseId: string
  courseTitle: string
  userId: string
  userName: string
  completedAt?: string
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function splitCertificateLine(value: string, maxLength: number) {
  const words = value.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxLength && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) lines.push(current)
  return lines.slice(0, 2)
}

export function generateCourseCertificate({
  courseId,
  courseTitle,
  userId,
  userName,
  completedAt,
}: CourseCertificatePayload) {
  const issuedOn = new Date(completedAt ?? Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const certificateId = `CB-${courseId.slice(0, 12).toUpperCase()}-${userId.slice(0, 8).toUpperCase()}`
  const courseLines = splitCertificateLine(courseTitle, 34).map(escapeXml)
  const fileName = `${courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-certificate.svg`
  const courseText = courseLines.map((line, index) => (
    `<text x="700" y="${560 + index * 50}" text-anchor="middle" font-family="Georgia, serif" font-size="${courseLines.length > 1 ? 42 : 48}" font-weight="700" fill="#111827">${line}</text>`
  )).join('')

  const certificateSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1000" viewBox="0 0 1400 1000">
  <rect width="1400" height="1000" fill="#f8fafc"/>
  <rect x="52" y="52" width="1296" height="896" fill="#ffffff" stroke="#0f766e" stroke-width="6"/>
  <rect x="82" y="82" width="1236" height="836" fill="none" stroke="#f59e0b" stroke-width="3"/>
  <circle cx="700" cy="190" r="58" fill="#ecfdf5" stroke="#0f766e" stroke-width="4"/>
  <path d="M672 190l18 18 38-44" fill="none" stroke="#0f766e" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="700" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="64" font-weight="700" fill="#111827">Certificate of Completion</text>
  <text x="700" y="370" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#64748b">This certificate is proudly presented to</text>
  <text x="700" y="455" text-anchor="middle" font-family="Georgia, serif" font-size="58" font-weight="700" fill="#0f766e">${escapeXml(userName)}</text>
  <line x1="390" y1="490" x2="1010" y2="490" stroke="#cbd5e1" stroke-width="2"/>
  <text x="700" y="530" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#64748b">for successfully completing</text>
  ${courseText}
  <text x="700" y="680" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#64748b">MIT Academy of Engineering - Campus Buddy</text>
  <text x="260" y="790" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#64748b">Issued On</text>
  <text x="260" y="830" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#111827">${escapeXml(issuedOn)}</text>
  <text x="700" y="790" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#64748b">Certificate ID</text>
  <text x="700" y="830" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#111827">${escapeXml(certificateId)}</text>
  <text x="1140" y="790" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#64748b">Authorized By</text>
  <text x="1140" y="830" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#111827">Campus Buddy</text>
</svg>`

  const blob = new Blob([certificateSvg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName || 'course-certificate.svg'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

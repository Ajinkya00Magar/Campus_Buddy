'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users2, Trophy, Link as LinkIcon, ArrowLeft } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import Link from 'next/link'

export default function ClubDetailClient({
  club,
  userId,
  userRole,
  membershipRole,
  isOfficialSeed,
}: {
  club: any
  userId: string
  userRole: string
  membershipRole: string | null
  isOfficialSeed: boolean
}) {
  const members = (club.club_members ?? []).map((membership: any) => ({
    id: membership.id,
    name: membership.users?.name ?? 'Unknown member',
    avatar_url: membership.users?.avatar_url,
    role: membership.role,
  }))

  const memberCount = club._members_count ?? members.length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/clubs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to Clubs
      </Link>

      {club.cover_url ? (
        <div className="rounded-2xl overflow-hidden h-48">
          <img src={club.cover_url} alt={club.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="rounded-2xl h-36 bg-gradient-to-br from-violet-500/10 to-purple-600/20" />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {club.logo_url ? (
            <img src={club.logo_url} alt={club.name} className="h-16 w-16 rounded-2xl object-cover border-2 border-white shadow-md" />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-2xl border-2 border-white shadow-md">
              {club.name[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{club.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
              {club.category && <span className="capitalize">{club.category}</span>}
              <span>·</span>
              <span className="flex items-center gap-1"><Users2 className="h-3.5 w-3.5" />{memberCount} members</span>
              {isOfficialSeed && <span>Official MITAOE</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {club.description ?? 'No description available.'}
              </p>
            </CardContent>
          </Card>

          {club.achievements?.length > 0 && (
            <Card>
              <CardContent className="pt-5">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" /> Achievements
                </h2>
                <ul className="space-y-2">
                  {club.achievements.map((achievement: string, index: number) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm">
                      <span className="text-amber-500 mt-0.5">🏆</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {club.links?.length > 0 && (
            <Card>
              <CardContent className="pt-5">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" /> Links
                </h2>
                <div className="space-y-2">
                  {club.links.map((link: { label: string; url: string }, index: number) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardContent className="pt-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Users2 className="h-4 w-4" /> Members
            </h2>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet</p>
            ) : (
              <div className="space-y-3">
                {members.slice(0, 15).map((member: any) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="bg-[#1E3A8A] text-white text-[10px]">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-tight">{member.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{member.role}</p>
                    </div>
                  </div>
                ))}
                {members.length > 15 && (
                  <p className="text-xs text-muted-foreground">+{members.length - 15} more</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

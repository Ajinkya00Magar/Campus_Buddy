'use client'

import { useState } from 'react'
import { joinClub, leaveClub } from '@/services/clubs.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users2, Trophy, Link as LinkIcon, ArrowLeft, UserPlus, UserMinus } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function ClubDetailClient({
  club, isMember: initialMember, userId
}: {
  club: any
  isMember: boolean
  userId: string
}) {
  const { toast } = useToast()
  const [isMember, setIsMember] = useState(initialMember)
  const [memberCount, setMemberCount] = useState(club._members_count ?? 0)
  const [loading, setLoading] = useState(false)

  const members = club.club_members?.flatMap((m: any) =>
    m.users ? [m.users] : []
  ) ?? []

  const handleJoinLeave = async () => {
    setLoading(true)
    if (isMember) {
      const { error } = await leaveClub(club.id, userId)
      if (!error) {
        setIsMember(false)
        setMemberCount((c: number) => Math.max(0, c - 1))
        toast({ title: 'Left club' })
      }
    } else {
      const { error } = await joinClub(club.id, userId)
      if (!error) {
        setIsMember(true)
        setMemberCount((c: number) => c + 1)
        toast({ title: 'Joined club! 🎉' })
      }
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/clubs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to Clubs
      </Link>

      {/* Cover */}
      {club.cover_url ? (
        <div className="rounded-2xl overflow-hidden h-48">
          <img src={club.cover_url} alt={club.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="rounded-2xl h-36 bg-gradient-to-br from-violet-500/10 to-purple-600/20" />
      )}

      {/* Header */}
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
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {club.category && <span className="capitalize">{club.category}</span>}
              <span>·</span>
              <span className="flex items-center gap-1"><Users2 className="h-3.5 w-3.5" />{memberCount} members</span>
            </div>
          </div>
        </div>
        <Button
          onClick={handleJoinLeave}
          disabled={loading}
          variant={isMember ? 'outline' : 'default'}
          className={isMember ? '' : 'bg-[#1E3A8A] hover:bg-[#1e40af]'}
        >
          {isMember ? <><UserMinus className="h-4 w-4 mr-2" />Leave Club</> : <><UserPlus className="h-4 w-4 mr-2" />Join Club</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          {club.description && (
            <Card>
              <CardContent className="pt-5">
                <h2 className="font-semibold mb-2">About</h2>
                <p className="text-gray-600 leading-relaxed">{club.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          {club.achievements?.length > 0 && (
            <Card>
              <CardContent className="pt-5">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" /> Achievements
                </h2>
                <ul className="space-y-2">
                  {club.achievements.map((a: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="text-amber-500 mt-0.5">🏆</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Links */}
          {club.links?.length > 0 && (
            <Card>
              <CardContent className="pt-5">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" /> Links
                </h2>
                <div className="space-y-2">
                  {club.links.map((link: { label: string; url: string }, i: number) => (
                    <a key={i} href={link.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <LinkIcon className="h-3.5 w-3.5" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Members */}
        <Card className="h-fit">
          <CardContent className="pt-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Users2 className="h-4 w-4" /> Members
            </h2>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet</p>
            ) : (
              <div className="space-y-2.5">
                {members.slice(0, 15).map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={m.avatar_url} />
                      <AvatarFallback className="bg-[#1E3A8A] text-white text-[10px]">{getInitials(m.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-tight">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
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

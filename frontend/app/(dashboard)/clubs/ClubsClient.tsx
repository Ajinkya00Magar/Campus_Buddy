'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Users2 } from 'lucide-react'
import { useClubs } from '@/hooks/useClubs'
import type { Club } from '@/types'

export default function ClubsClient({ initialClubs }: { initialClubs: Club[] }) {
  const clubs = useClubs(initialClubs)

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(245,243,255,0.76))] p-6 shadow-[0_24px_80px_rgba(88,28,135,0.12)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(167,139,250,0.18),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(17,24,39,0.86))] md:p-8">
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border border-violet-400/20 bg-violet-400/10 blur-sm" />
        <div className="relative max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/15 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-600 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            Campus communities
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Clubs</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{clubs.length} clubs at MITAOE, from technical teams to culture and creativity.</p>
        </div>
      </section>

      {clubs.length === 0 ? (
        <div className="text-center py-16">
          <Users2 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-muted-foreground">No clubs yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clubs.map((club) => (
            <Link key={club.id} href={`/clubs/${club.id}`}>
              <Card className="cursor-pointer group h-full overflow-hidden">
                {club.cover_url ? (
                  <div className="h-28 overflow-hidden">
                    <img src={club.cover_url} alt={club.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-28 bg-gradient-to-br from-violet-500/10 to-purple-600/20 flex items-center justify-center">
                    <Users2 className="h-10 w-10 text-violet-400/40" />
                  </div>
                )}
                <CardContent className="pt-4 pb-5">
                  <div className="flex items-start gap-3">
                    {club.logo_url ? (
                      <img src={club.logo_url} alt={club.name} className="h-10 w-10 rounded-xl object-cover border border-gray-100 shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 text-violet-700 font-bold text-sm">
                        {club.name[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors truncate">{club.name}</h3>
                      {club.category && <p className="text-xs text-muted-foreground capitalize">{club.category}</p>}
                    </div>
                  </div>
                  {club.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">{club.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users2 className="h-3 w-3" />{club._members_count} members</span>
                    {(club.achievements?.length ?? 0) > 0 && (
                      <span>🏆 {club.achievements?.length} achievement{(club.achievements?.length ?? 0) > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Sparkles, Users2, Trophy } from 'lucide-react'
import { useClubs } from '@/hooks/useClubs'
import Reveal from '@/components/motion/Reveal'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import TiltCard from '@/components/motion/TiltCard'
import { SpatialCard } from '@/components/ui/spatial-card'
import type { Club } from '@/types'

export default function ClubsClient({ initialClubs }: { initialClubs: Club[] }) {
  const clubs = useClubs(initialClubs)

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <Reveal as="section" direction="down" pop onView={false} className="relative overflow-hidden rounded-[2.5rem] bg-card/60 backdrop-blur-3xl border border-white/20 p-6 shadow-[0_24px_80px_rgba(88,28,135,0.12)] dark:border-white/10 dark:shadow-[0_24px_80px_rgba(0,0,0,0.3)] md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border border-violet-400/20 bg-violet-400/10 blur-sm animate-floaty" />
        <div className="relative max-w-2xl z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/15 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-600 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            Campus communities
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Clubs</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{clubs.length} clubs at MITAOE, from technical teams to culture and creativity.</p>
        </div>
      </Reveal>

      {clubs.length === 0 ? (
        <div className="text-center py-16">
          <Users2 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-muted-foreground">No clubs yet</p>
        </div>
      ) : (
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <StaggerItem key={club.id} className="h-full">
            <Link href={`/clubs/${club.id}`} className="block h-full group">
              <TiltCard max={4} className="h-full rounded-[2rem]">
              <SpatialCard contentClassName="p-0" className="h-full rounded-[2rem] border-white/30 dark:border-white/10 group-hover:border-violet-500/30 transition-colors duration-500">
                {club.cover_url ? (
                  <div className="h-32 overflow-hidden shrink-0">
                    <img src={club.cover_url} alt={club.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-violet-500/10 to-purple-600/20 flex items-center justify-center shrink-0">
                    <Users2 className="h-10 w-10 text-violet-400/40" />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1 space-y-4">
                  <div className="flex items-start gap-4">
                    {club.logo_url ? (
                      <img src={club.logo_url} alt={club.name} className="h-12 w-12 rounded-2xl object-cover border border-white/20 shadow-lg shrink-0" />
                    ) : (
                      <div className="h-12 w-12 rounded-2xl bg-violet-500/20 flex items-center justify-center shrink-0 text-violet-600 font-black text-sm border border-violet-500/30 shadow-lg">
                        {club.name[0]}
                      </div>
                    )}
                    <div className="min-w-0 pt-1">
                      <h3 className="font-bold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate text-base">{club.name}</h3>
                      {club.category && <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{club.category}</p>}
                    </div>
                  </div>
                  {club.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">{club.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-auto pt-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Users2 className="h-3 w-3 text-violet-500" />{club._members_count} members</span>
                    {(club.achievements?.length ?? 0) > 0 && (
                      <span className="flex items-center gap-1.5"><Trophy className="h-3 w-3 text-amber-500" /> {club.achievements?.length} win{(club.achievements?.length ?? 0) > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              </SpatialCard>
              </TiltCard>
            </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Users2, ExternalLink } from 'lucide-react'

export default async function ClubsPage() {
  const supabase = await createClient()
  const { data: clubs } = await supabase
    .from('clubs')
    .select('*, club_members(count)')
    .order('name')

  const mapped = (clubs ?? []).map((c: any) => ({
    ...c,
    _members_count: c.club_members?.[0]?.count ?? 0,
  }))

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clubs</h1>
        <p className="text-muted-foreground text-sm mt-1">{mapped.length} clubs at MITAOE</p>
      </div>

      {mapped.length === 0 ? (
        <div className="text-center py-16">
          <Users2 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-muted-foreground">No clubs yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mapped.map((club: any) => (
            <Link key={club.id} href={`/clubs/${club.id}`}>
              <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group h-full overflow-hidden">
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
                      <h3 className="font-semibold text-gray-900 group-hover:text-violet-700 transition-colors truncate">{club.name}</h3>
                      {club.category && <p className="text-xs text-muted-foreground capitalize">{club.category}</p>}
                    </div>
                  </div>
                  {club.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">{club.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users2 className="h-3 w-3" />{club._members_count} members</span>
                    {club.achievements?.length > 0 && (
                      <span>🏆 {club.achievements.length} achievement{club.achievements.length > 1 ? 's' : ''}</span>
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

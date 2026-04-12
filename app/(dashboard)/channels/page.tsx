import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Hash, Lock, BookOpen, Trophy, Briefcase, GraduationCap, Plus } from 'lucide-react'
import type { Channel, ChannelType } from '@/types'

const typeConfig: Record<ChannelType, { icon: any; color: string; bg: string; label: string }> = {
  academic: { icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Academic' },
  subject:  { icon: BookOpen,      color: 'text-green-600', bg: 'bg-green-50', label: 'Subject' },
  club:     { icon: Trophy,        color: 'text-violet-600', bg: 'bg-violet-50', label: 'Club' },
  official: { icon: Briefcase,     color: 'text-red-600', bg: 'bg-red-50', label: 'Official' },
}

export default async function ChannelsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  const { data: channels } = await supabase.from('channels').select('*').order('type').order('name')

  const grouped = (channels ?? []).reduce<Record<ChannelType, Channel[]>>(
    (acc, ch) => {
      if (!acc[ch.type as ChannelType]) acc[ch.type as ChannelType] = []
      acc[ch.type as ChannelType].push(ch)
      return acc
    },
    { academic: [], subject: [], club: [], official: [] }
  )

  const order: ChannelType[] = ['official', 'academic', 'subject', 'club']

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Channels</h1>
          <p className="text-muted-foreground text-sm mt-1">{channels?.length ?? 0} channels available</p>
        </div>
        {profile?.role === 'admin' && (
          <Link href="/admin/channels">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-sm font-medium hover:bg-[#1e40af] transition">
              <Plus className="h-4 w-4" /> Manage Channels
            </button>
          </Link>
        )}
      </div>

      {order.map((type) => {
        const chs = grouped[type]
        if (!chs?.length) return null
        const config = typeConfig[type]
        const Icon = config.icon
        return (
          <section key={type}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-6 w-6 rounded-md ${config.bg} flex items-center justify-center`}>
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
              </div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{config.label}</h2>
              <span className="text-xs text-muted-foreground">({chs.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {chs.map((ch) => (
                <Link key={ch.id} href={`/channels/${ch.id}`}>
                  <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                          <Hash className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm truncate group-hover:text-[#1E3A8A] transition-colors">{ch.name}</p>
                            {ch.is_private && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                          </div>
                          {ch.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{ch.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {ch.department && <span className="text-[10px] text-muted-foreground">{ch.department}</span>}
                            {ch.year && <span className="text-[10px] text-muted-foreground">Year {ch.year}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )
      })}

      {!channels?.length && (
        <div className="text-center py-16">
          <Hash className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-muted-foreground">No channels yet</p>
        </div>
      )}
    </div>
  )
}

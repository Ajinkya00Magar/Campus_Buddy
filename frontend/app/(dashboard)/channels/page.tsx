import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Hash,
  Plus,
  Sparkles,
  Trophy,
  Users2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Channel, ChannelType } from '@/types'
import type { ElementType } from 'react'
import YearDisclosure from '@/components/channels/YearDisclosure'

const SUBJECTS_PER_SEMESTER = 8

const companionConfig: Record<Exclude<ChannelType, 'academic' | 'subject'>, {
  icon: ElementType
  label: string
  tone: string
}> = {
  official: {
    icon: Briefcase,
    label: 'Official',
    tone: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300',
  },
  club: {
    icon: Trophy,
    label: 'Clubs',
    tone: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300',
  },
}

export default async function ChannelsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: channels }] = await Promise.all([
    supabase.from('users').select('role, year, department').eq('id', user.id).single(),
    supabase.from('channels').select('*').order('type').order('year').order('name'),
  ])

  const allChannels = channels ?? []
  const subjectChannels = allChannels.filter((ch) => ch.type === 'academic' || ch.type === 'subject')
  const officialChannels = allChannels.filter((ch) => ch.type === 'official')
  const clubChannels = allChannels.filter((ch) => ch.type === 'club')

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(239,246,255,0.74))] p-6 shadow-[0_24px_80px_rgba(30,58,138,0.14)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.2),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(17,24,39,0.86))] md:p-8">
        <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-primary/20 bg-primary/10 blur-sm md:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Curriculum channels
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Channels organized by year, semester, and subject
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              Jump straight into the right classroom stream. Each year contains two semesters, and every semester has eight subject lanes ready for notes, files, discussion, and announcements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Metric label="Years" value="4" />
            <Metric label="Semesters" value="8" />
            <Metric label="Subject slots" value="64" />
            {profile?.role === 'admin' && (
              <Link
                href="/admin/channels"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Plus className="h-4 w-4" />
                Manage Channels
              </Link>
            )}
          </div>
        </div>
      </section>

          <div className="grid gap-6">
        {[1, 2, 3, 4].map((year) => (
          <YearDisclosure
            key={year}
            year={year}
            channels={subjectChannels}
            currentYear={profile?.year ?? null}
          />
        ))}
      </div>

      {(officialChannels.length > 0 || clubChannels.length > 0) && (
        <section className="grid gap-4 lg:grid-cols-2">
          <CompanionChannels type="official" channels={officialChannels} />
          <CompanionChannels type="club" channels={clubChannels} />
        </section>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <p className="text-2xl font-extrabold leading-none text-foreground">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    </div>
  )
}


function SemesterPanel({
  year,
  semester,
  channels,
}: {
  year: number
  semester: number
  channels: Channel[]
}) {
  return (
    <div className="rounded-2xl border bg-background/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Semester {String(semester).padStart(2, '0')}
          </p>
          <h3 className="mt-1 text-lg font-bold text-foreground">Subject channels</h3>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpen className="h-5 w-5" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: SUBJECTS_PER_SEMESTER }, (_, index) => {
          const subjectNumber = index + 1
          const channel = findSubjectChannel(channels, year, semester, subjectNumber)
          return (
            <SubjectSlot
              key={`${year}-${semester}-${subjectNumber}`}
              channel={channel}
              year={year}
              semester={semester}
              subjectNumber={subjectNumber}
            />
          )
        })}
      </div>
    </div>
  )
}

function SubjectSlot({
  channel,
  year,
  semester,
  subjectNumber,
}: {
  channel: Channel | undefined
  year: number
  semester: number
  subjectNumber: number
}) {
  const title = channel?.description || channel?.name || `Subject ${String(subjectNumber).padStart(2, '0')}`
  const meta = `Y${year} · Sem ${String(semester).padStart(2, '0')} · Subject ${String(subjectNumber).padStart(2, '0')}`

  const content = (
    <div className={cn(
      'group relative overflow-hidden rounded-2xl border p-4 transition duration-300',
      channel
        ? 'border-primary/15 bg-card shadow-sm hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10'
        : 'border-dashed bg-muted/35 opacity-75'
    )}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          channel ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'
        )}>
          <Hash className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-bold text-foreground">{formatChannelTitle(title)}</p>
            {channel?.is_private && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          </div>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{meta}</p>
          {channel ? (
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Open channel
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Channel not created yet</p>
          )}
        </div>
      </div>
    </div>
  )

  if (!channel) return content
  return <Link href={`/channels/${channel.id}`}>{content}</Link>
}

function CompanionChannels({
  type,
  channels,
}: {
  type: Exclude<ChannelType, 'academic' | 'subject'>
  channels: Channel[]
}) {
  if (!channels.length) return null
  const config = companionConfig[type]
  const Icon = config.icon

  return (
    <section className="rounded-[1.5rem] border bg-card p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', config.tone)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">{config.label} channels</h2>
            <p className="text-xs text-muted-foreground">{channels.length} available</p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {channels.map((channel) => (
          <Link
            key={channel.id}
            href={`/channels/${channel.id}`}
            className="group flex items-center gap-3 rounded-2xl border bg-background/70 p-3 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Hash className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{channel.name}</p>
              {channel.description && <p className="truncate text-xs text-muted-foreground">{channel.description}</p>}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </section>
  )
}

function findSubjectChannel(
  channels: Channel[],
  year: number,
  semester: number,
  subjectNumber: number
) {
  const strictPatterns = [
    `y${year}-sem-${semester}-subject-${subjectNumber}`,
    `year-${year}-sem-${semester}-subject-${subjectNumber}`,
    `year-${year}-semester-${semester}-subject-${subjectNumber}`,
    `sem-${semester}-subject-${subjectNumber}`,
    `semester-${semester}-subject-${subjectNumber}`,
    `subject-${String(subjectNumber).padStart(2, '0')}`,
    `sub-${String(subjectNumber).padStart(2, '0')}`,
  ]

  const yearScoped = channels.filter((channel) => channel.year === year)
  const strictMatch = yearScoped.find((channel) => {
    const text = normalize(`${channel.name} ${channel.description ?? ''}`)
    return strictPatterns.some((pattern) => text.includes(pattern))
  })

  if (strictMatch) return strictMatch

  const semesterScoped = yearScoped.filter((channel) => {
    const text = normalize(`${channel.name} ${channel.description ?? ''}`)
    return text.includes(`sem-${semester}`) || text.includes(`semester-${semester}`)
  })
  if (semesterScoped[subjectNumber - 1]) return semesterScoped[subjectNumber - 1]

  return yearScoped[(semester - 1) * SUBJECTS_PER_SEMESTER + subjectNumber - 1]
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function formatChannelTitle(value: string) {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

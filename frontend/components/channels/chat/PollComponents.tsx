import { BarChart2 } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import type { Poll } from '@/types'

export function PollTimelineItem({
  poll,
  currentUserId,
  onVote,
}: {
  poll: Poll
  currentUserId: string
  onVote: (pollId: string, optionIdx: number) => void
}) {
  return (
    <div className="animate-message-in flex justify-start gap-2 py-0.5">
      <div className="w-8 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center border bg-primary/10 text-primary">
          <BarChart2 className="h-4 w-4" />
        </div>
      </div>

      <div className="max-w-[min(680px,78%)]">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Poll</span>
          <span className="text-[11px] text-muted-foreground">{timeAgo(poll.created_at)}</span>
        </div>
        <PollCard poll={poll} currentUserId={currentUserId} onVote={onVote} />
      </div>
    </div>
  )
}

export function PollCard({
  poll,
  currentUserId,
  onVote,
}: {
  poll: Poll
  currentUserId: string
  onVote: (pollId: string, optionIdx: number) => void
}) {
  const votes = poll.poll_votes ?? []
  const totalVotes = Math.max(votes.length, 1)
  const selected = votes.find((vote) => vote.user_id === currentUserId)?.option_idx

  return (
    <div className="border bg-card p-3">
      <div className="mb-2 flex items-start gap-2">
        <BarChart2 className="h-4 w-4 text-primary" />
        <p className="min-w-0 flex-1 break-words text-sm font-semibold text-foreground">{poll.question}</p>
        <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{votes.length} votes</span>
      </div>
      <div className="space-y-1.5">
        {poll.options.map((option, index) => {
          const count = votes.filter((vote) => vote.option_idx === index).length
          const percent = Math.round((count / totalVotes) * 100)
          return (
            <button
              key={`${poll.id}-${index}`}
              onClick={() => onVote(poll.id, index)}
              className={cn(
                'interactive-control relative w-full overflow-hidden border px-3 py-1.5 text-left text-sm transition hover:border-primary/35',
                selected === index ? 'border-primary/45 bg-primary/10' : 'bg-background'
              )}
            >
              <span className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${percent}%` }} />
              <span className="relative flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">{option}</span>
                <span className="text-xs font-medium text-muted-foreground">{percent}%</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

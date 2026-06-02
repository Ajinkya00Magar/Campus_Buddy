import type { ReactNode } from 'react'
import { Search, Download, FileText, Video, Music, Image as ImageIcon, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getFileKind, previewLabel, type FileKind, type ChatFilter } from '@/lib/chat-utils'

export function InfoMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border bg-background p-2.5">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
    </div>
  )
}

export function InfoSection({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</h3>
      {children ?? <p className="border bg-background p-3 text-xs text-muted-foreground">{empty}</p>}
    </section>
  )
}

export function NoResults({ query, filter }: { query: string; filter: ChatFilter }) {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center text-center">
      <div>
        <Search className="mx-auto h-8 w-8 text-muted-foreground" />
        <h2 className="mt-3 text-lg font-semibold text-foreground">Nothing found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {query ? `No messages match "${query}".` : `No ${filter} messages yet.`}
        </p>
      </div>
    </div>
  )
}

export function FilePreview({
  url,
  fileName,
  isMine,
}: {
  url: string
  fileName: string
  isMine: boolean
}) {
  const kind = getFileKind(fileName, url)

  return (
    <div className={cn('mt-2 overflow-hidden border', isMine ? 'border-white/20 bg-white/10' : 'bg-background')}>
      <div className="flex items-center gap-2 border-b px-2 py-1.5">
        <FileKindIcon kind={kind} />
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-xs font-semibold', isMine ? 'text-white' : 'text-foreground')}>{fileName}</p>
          <p className={cn('text-[10px] font-medium uppercase tracking-[0.12em]', isMine ? 'text-white/65' : 'text-muted-foreground')}>
            {previewLabel(fileName)}
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={cn('interactive-control flex h-7 w-7 items-center justify-center', isMine ? 'text-white hover:bg-white/15' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}
          title="Open file"
        >
          <Download className="h-4 w-4" />
        </a>
      </div>

      {kind === 'image' && (
        <a href={url} target="_blank" rel="noreferrer" className="block bg-black/5">
          <img src={url} alt={fileName} className="max-h-80 w-full object-contain" />
        </a>
      )}

      {kind === 'pdf' && (
        <iframe
          src={url}
          title={fileName}
          className="h-80 w-full bg-white"
        />
      )}

      {kind === 'video' && (
        <video controls className="max-h-80 w-full bg-black">
          <source src={url} />
        </video>
      )}

      {kind === 'audio' && (
        <div className="p-3">
          <audio controls className="w-full">
            <source src={url} />
          </audio>
        </div>
      )}

      {kind === 'office' && (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
          title={fileName}
          className="h-80 w-full bg-white"
        />
      )}

      {kind === 'document' && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={cn('flex items-center gap-3 p-3 transition', isMine ? 'hover:bg-white/10' : 'hover:bg-accent')}
        >
          <div className={cn('flex h-10 w-10 items-center justify-center border', isMine ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary')}>
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className={cn('text-sm font-bold', isMine ? 'text-white' : 'text-foreground')}>Open document</p>
            <p className={cn('text-xs', isMine ? 'text-white/70' : 'text-muted-foreground')}>Preview is not available for this file type.</p>
          </div>
        </a>
      )}
    </div>
  )
}

export function FileKindIcon({ kind }: { kind: FileKind }) {
  const className = 'h-4 w-4 text-current'
  if (kind === 'image') return <ImageIcon className={className} />
  if (kind === 'pdf') return <FileText className={className} />
  if (kind === 'video') return <Video className={className} />
  if (kind === 'audio') return <Music className={className} />
  return <FileText className={className} />
}

export function MessageSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className={cn('flex gap-3', index % 2 ? 'justify-end' : 'justify-start')}>
          {index % 2 === 0 && <div className="h-10 w-10 rounded-full bg-muted shimmer" />}
          <div className="w-[min(620px,78%)] border bg-card p-3">
            <div className="h-3 w-28 rounded-full bg-muted shimmer" />
            <div className="mt-3 h-3 w-full rounded-full bg-muted shimmer" />
            <div className="mt-2 h-3 w-2/3 rounded-full bg-muted shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ channelName }: { channelName: string }) {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border bg-primary/10 text-primary">
          <Hash className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Start #{channelName}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Share a note, upload a file, or pin an important update. File previews will appear right inside the conversation.
        </p>
      </div>
    </div>
  )
}

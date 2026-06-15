import { Info, Users2, File as FileIcon, FileText, Link as LinkIcon, Star, X, BellOff, BellRing } from 'lucide-react'
import type { Channel, ChannelStats, Message } from '@/types'
import { InfoMetric, InfoSection } from './UIComponents'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export function ChannelInfoPanel({
  channel,
  stats,
  mediaItems,
  docItems,
  linkItems,
  starredCount,
  isMuted,
  onToggleMute,
  onClose,
}: {
  channel: Channel
  stats: ChannelStats
  mediaItems: Message[]
  docItems: Message[]
  linkItems: { message: Message; url: string }[]
  starredCount: number
  isMuted: boolean
  onToggleMute: (muted: boolean) => void
  onClose: () => void
}) {
  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-l bg-card hidden md:block">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Info className="h-4 w-4" /> Channel Info
        </h2>
        <button
          onClick={onClose}
          className="interactive-control flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-6 p-4">
        <section>
          <h3 className="text-sm font-semibold text-foreground">#{channel.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{channel.description || 'No description provided.'}</p>
        </section>

        <section className="flex items-center justify-between rounded-lg border bg-background p-3">
          <div className="flex items-center gap-2">
            {isMuted ? <BellOff className="h-4 w-4 text-muted-foreground" /> : <BellRing className="h-4 w-4 text-primary" />}
            <Label htmlFor="mute-channel" className="text-xs font-semibold cursor-pointer">Mute Channel</Label>
          </div>
          <Switch id="mute-channel" checked={isMuted} onCheckedChange={onToggleMute} />
        </section>

        <div className="grid grid-cols-2 gap-2">
          <InfoMetric label="Members" value={stats.members} />
          <InfoMetric label="Starred" value={starredCount} />
          <InfoMetric label="Files" value={stats.media + stats.docs} />
          <InfoMetric label="Links" value={stats.links} />
        </div>

        <InfoSection title="Media" empty="No media shared yet">
          {mediaItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {mediaItems.slice(0, 6).map((message) => (
                <a key={message.id} href={message.file_url} target="_blank" rel="noreferrer" className="aspect-square border bg-muted hover:opacity-80">
                  {message.file_url && /\.(png|jpe?g|gif|webp)$/i.test(message.file_url) ? (
                    <img src={message.file_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-primary/5 text-primary">
                      <FileIcon className="h-6 w-6" />
                    </div>
                  )}
                </a>
              ))}
            </div>
          ) : null}
        </InfoSection>

        <InfoSection title="Documents" empty="No documents yet">
          {docItems.length > 0 ? (
            <div className="space-y-2">
              {docItems.slice(0, 5).map((message) => (
                <a key={message.id} href={message.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 border bg-background p-2 hover:bg-accent">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold">{message.file_name ?? 'Document'}</span>
                </a>
              ))}
            </div>
          ) : null}
        </InfoSection>

        <InfoSection title="Links" empty="No links yet">
          {linkItems.length > 0 ? (
            <div className="space-y-2">
              {linkItems.slice(0, 5).map((item) => (
                <a key={`${item.message.id}-${item.url}`} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 border bg-background p-2 hover:bg-accent">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold">{item.url}</span>
                </a>
              ))}
            </div>
          ) : null}
        </InfoSection>
      </div>
    </aside>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert, Loader2, Check, Trash2, Hash, Flag } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useUser } from '@/hooks/useUser'
import { cn, getInitials, formatDate } from '@/lib/utils'
import { deleteMessage } from '@/services/channels.service'
import {
  getMessageReports,
  updateReportStatus,
  type MessageReport,
  type ReportStatus,
} from '@/services/moderation.service'

const TABS: { key: 'open' | 'all'; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'all', label: 'All' },
]

const statusStyle: Record<ReportStatus, string> = {
  open: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  reviewed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  dismissed: 'bg-muted text-muted-foreground',
}

export default function AdminModerationPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const [tab, setTab] = useState<'open' | 'all'>('open')
  const [reports, setReports] = useState<MessageReport[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getMessageReports(tab === 'open' ? 'open' : undefined)
    setReports(data)
    setLoading(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  const setStatus = async (report: MessageReport, status: ReportStatus) => {
    if (!user) return
    setBusyId(report.id)
    const { error } = await updateReportStatus(report.id, status, user.id)
    setBusyId(null)
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: status === 'reviewed' ? 'Marked reviewed' : 'Report dismissed' })
    load()
  }

  const removeMessage = async (report: MessageReport) => {
    if (!report.messages?.id) {
      toast({ title: 'Message already deleted' })
      await setStatus(report, 'reviewed')
      return
    }
    setBusyId(report.id)
    const { error } = await deleteMessage(report.messages.id)
    if (error) {
      setBusyId(null)
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
      return
    }
    // Deleting the message resolves the report.
    if (user) await updateReportStatus(report.id, 'reviewed', user.id)
    setBusyId(null)
    toast({ title: 'Message deleted' })
    load()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="interactive-control flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground hover:bg-accent hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center">
          <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Moderation</h1>
          <p className="text-muted-foreground text-sm">Review messages reported by students.</p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
          <Flag className="h-8 w-8 opacity-40" />
          <p className="text-sm">{tab === 'open' ? 'No open reports. All clear!' : 'No reports yet.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const msg = report.messages
            return (
              <div key={report.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn('rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide', statusStyle[report.status])}>
                      {report.status}
                    </span>
                    {msg?.channels?.name && (
                      <Link href={`/channels/${msg.channel_id}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                        <Hash className="h-3 w-3" />{msg.channels.name}
                      </Link>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(report.created_at)}</span>
                </div>

                <div className="mt-3 rounded-md border bg-muted/40 p-3">
                  {msg ? (
                    <>
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                        {msg.content ?? msg.file_name ?? 'Shared file'}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Sent by <span className="font-medium">{msg.users?.name ?? 'Unknown'}</span>
                        {msg.users?.role ? ` · ${msg.users.role}` : ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">This message has been deleted.</p>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={report.reporter?.avatar_url ?? ''} />
                    <AvatarFallback className="text-[10px]">{getInitials(report.reporter?.name ?? '?')}</AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-muted-foreground">
                    Reported by <span className="font-medium text-foreground">{report.reporter?.name ?? 'Unknown'}</span>
                    {report.reason ? <> — “{report.reason}”</> : ' (no reason given)'}
                  </p>
                </div>

                {report.status === 'open' && (
                  <div className="mt-3 flex flex-wrap justify-end gap-2 border-t pt-3">
                    <Button variant="outline" size="sm" disabled={busyId === report.id} onClick={() => setStatus(report, 'dismissed')}>
                      Dismiss
                    </Button>
                    <Button variant="outline" size="sm" disabled={busyId === report.id} onClick={() => setStatus(report, 'reviewed')} className="gap-1.5">
                      <Check className="h-3.5 w-3.5" /> Mark reviewed
                    </Button>
                    <Button size="sm" disabled={busyId === report.id} onClick={() => removeMessage(report)} className="gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {busyId === report.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Delete message
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

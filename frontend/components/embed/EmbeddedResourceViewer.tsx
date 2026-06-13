'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Archive, ArrowUpRight, ExternalLink, FileText, Loader2, Maximize2, Minimize2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EmbeddedResource } from '@/data/embeddedResources'

export default function EmbeddedResourceViewer({
  resource,
  embedAllowed,
}: {
  resource: EmbeddedResource
  embedAllowed: boolean
}) {
  const [iframeFailed, setIframeFailed] = useState(false)
  const [iframeLoading, setIframeLoading] = useState(embedAllowed)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showExitControl, setShowExitControl] = useState(false)
  const loadTimerRef = useRef<number | null>(null)
  const embedRef = useRef<HTMLDivElement>(null)
  const hideControlTimerRef = useRef<number | null>(null)
  const providerBlocksEmbed = resource.embed_blocked || !embedAllowed || iframeFailed
  const Icon = resource.id === 'pyqs' ? Archive : FileText

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    }
  }, [])

  const enterFullscreen = useCallback(async () => {
    if (!embedRef.current) return
    await embedRef.current.requestFullscreen()
  }, [])

  const revealExitControl = useCallback(() => {
    setShowExitControl(true)
    if (hideControlTimerRef.current !== null) {
      window.clearTimeout(hideControlTimerRef.current)
    }
    hideControlTimerRef.current = window.setTimeout(() => {
      setShowExitControl(false)
    }, 2800)
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === embedRef.current)
      if (!document.fullscreenElement) {
        setShowExitControl(false)
      }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      if (hideControlTimerRef.current !== null) {
        window.clearTimeout(hideControlTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!embedAllowed || resource.embed_blocked) return

    loadTimerRef.current = window.setTimeout(() => {
      setIframeFailed(true)
      setIframeLoading(false)
    }, 12000)

    return () => {
      if (loadTimerRef.current !== null) {
        window.clearTimeout(loadTimerRef.current)
      }
    }
  }, [embedAllowed, resource.embed_blocked, resource.source_url])

  const handleIframeLoad = () => {
    if (loadTimerRef.current !== null) {
      window.clearTimeout(loadTimerRef.current)
      loadTimerRef.current = null
    }
    setIframeLoading(false)
    setIframeFailed(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1E3A8A]/10 text-[#1E3A8A]">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{resource.provider}</p>
            <p className="truncate text-sm font-semibold text-foreground">{resource.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={`rounded-full text-white ${
              providerBlocksEmbed ? 'bg-amber-600 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-600'
            }`}
          >
            {providerBlocksEmbed ? 'WebView mode' : 'Embedded'}
          </Badge>
          {!providerBlocksEmbed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => (isFullscreen ? exitFullscreen() : enterFullscreen())}
              title={isFullscreen ? 'Exit full screen (Esc)' : 'Full screen (like F11)'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  Exit full screen
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  Fit to screen
                </>
              )}
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <a href={resource.source_url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Open site
            </a>
          </Button>
        </div>
      </div>

      {providerBlocksEmbed ? (
        <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 text-center dark:bg-background">
          <div className="max-w-lg">
            <Icon className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-bold text-foreground">Open in app browser</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This site blocks iframe embedding, so Campus Buddy opens it as a full-screen in-app browser instead —
              the same WebView approach used for Cisco NetAcad courses. Use your browser back control to return here.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Button asChild className="bg-[#1E3A8A] text-white hover:bg-[#1e40af]">
                <Link href={`/resource-browser/${resource.id}`}>
                  <ArrowUpRight className="h-4 w-4" />
                  Open {resource.title}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <a href={resource.source_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab
                </a>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={embedRef}
          className={cn(
            'relative min-h-0 flex-1 bg-white',
            isFullscreen && 'flex h-screen w-screen flex-col',
          )}
          onMouseMove={isFullscreen ? revealExitControl : undefined}
          onTouchStart={isFullscreen ? revealExitControl : undefined}
        >
          {iframeLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          <iframe
            src={resource.source_url}
            title={resource.title}
            className="h-full w-full flex-1 border-0"
            allow="fullscreen; clipboard-read; clipboard-write; encrypted-media; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={handleIframeLoad}
          />

          {isFullscreen && (
            <>
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-20 h-20 bg-gradient-to-b from-black/50 to-transparent"
                aria-hidden
              />
              <div
                className={cn(
                  'absolute left-1/2 top-4 z-30 -translate-x-1/2 transition-all duration-300',
                  showExitControl
                    ? 'pointer-events-auto translate-y-0 opacity-100'
                    : 'pointer-events-none -translate-y-2 opacity-0',
                )}
              >
                <Button
                  size="sm"
                  onClick={exitFullscreen}
                  className="gap-2 bg-black/75 text-white shadow-lg backdrop-blur-sm hover:bg-black/90"
                >
                  <Minimize2 className="h-4 w-4" />
                  Exit full screen
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

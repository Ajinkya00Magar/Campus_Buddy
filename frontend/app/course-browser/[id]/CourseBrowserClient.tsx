'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CourseBrowserClient({
  courseId,
  courseTitle,
  provider,
  sourceUrl,
}: {
  courseId: string
  courseTitle: string
  provider: string
  sourceUrl: string
}) {
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpening(true)
      window.location.assign(sourceUrl)
    }, 900)

    return () => window.clearTimeout(timer)
  }, [sourceUrl])

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b bg-card px-3 md:px-5">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/courses/${courseId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="min-w-0 px-3 text-center">
          <p className="truncate text-sm font-semibold text-foreground">{courseTitle}</p>
          <p className="text-xs text-muted-foreground">{provider}</p>
        </div>
        <div className="h-8 w-[72px]" />
      </header>

      <section className="flex flex-1 items-center justify-center px-6 py-12 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            {opening ? <Loader2 className="h-7 w-7 animate-spin" /> : <ExternalLink className="h-7 w-7" />}
          </div>
          <h1 className="text-2xl font-bold text-foreground">Opening Cisco NetAcad</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Campus Buddy is switching to a full-screen course browser. Use the browser or WebView back control to return here.
          </p>
          <Button asChild className="mt-6 bg-[#1E3A8A] text-white hover:bg-[#1e40af]">
            <a href={sourceUrl}>
              <ExternalLink className="h-4 w-4" />
              Open Now
            </a>
          </Button>
        </div>
      </section>
    </main>
  )
}

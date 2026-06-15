import { Hash, Sparkles } from 'lucide-react'

export default function ChannelsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-up">
      <div className="overflow-hidden rounded-[1.75rem] border bg-card p-6 shadow-[0_24px_80px_rgba(30,58,138,0.12)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary focus-pulse">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="h-5 w-56 rounded-full bg-muted shimmer" />
            <div className="mt-3 h-3 w-80 max-w-full rounded-full bg-muted shimmer" />
          </div>
        </div>
      </div>

      {Array.from({ length: 4 }, (_, year) => (
        <section key={year} className="overflow-hidden rounded-[1.5rem] border bg-card">
          <div className="bg-primary/10 p-5">
            <div className="h-6 w-44 rounded-full bg-muted shimmer" />
            <div className="mt-3 h-3 w-64 rounded-full bg-muted shimmer" />
          </div>
          <div className="grid gap-5 p-5 md:grid-cols-2">
            {Array.from({ length: 2 }, (_, semester) => (
              <div key={semester} className="rounded-2xl border bg-background/70 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="h-3 w-28 rounded-full bg-muted shimmer" />
                    <div className="mt-2 h-5 w-36 rounded-full bg-muted shimmer" />
                  </div>
                  <Hash className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 8 }, (_, subject) => (
                    <div key={subject} className="rounded-2xl border bg-card p-4">
                      <div className="h-4 w-24 rounded-full bg-muted shimmer" />
                      <div className="mt-3 h-3 w-32 rounded-full bg-muted shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

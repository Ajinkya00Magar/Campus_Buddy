import { Sparkles } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-up">
      <section className="rounded-[1.75rem] border bg-card p-6 shadow-[0_24px_80px_rgba(30,58,138,0.12)] md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary focus-pulse">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="h-6 w-64 max-w-full rounded-full bg-muted shimmer" />
            <div className="mt-3 h-3 w-96 max-w-full rounded-full bg-muted shimmer" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-2xl border bg-card p-5">
            <div className="h-10 w-10 rounded-2xl bg-muted shimmer" />
            <div className="mt-4 h-7 w-16 rounded-full bg-muted shimmer" />
            <div className="mt-3 h-3 w-24 rounded-full bg-muted shimmer" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <div className="h-5 w-44 rounded-full bg-muted shimmer" />
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="mt-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-muted shimmer" />
              <div className="flex-1">
                <div className="h-4 w-2/3 rounded-full bg-muted shimmer" />
                <div className="mt-2 h-3 w-1/3 rounded-full bg-muted shimmer" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <div className="h-5 w-32 rounded-full bg-muted shimmer" />
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="mt-4 h-12 rounded-2xl bg-muted shimmer" />
          ))}
        </div>
      </div>
    </div>
  )
}

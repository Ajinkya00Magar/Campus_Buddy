import { MessageSquare } from 'lucide-react'

export default function ChannelsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-background/50 animate-fade-in h-full">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse">
        <MessageSquare className="h-10 w-10" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        Welcome to Campus Channels
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
        Connect with your peers, share resources, and stay updated. 
        Select a channel from the sidebar to start chatting.
      </p>
      
      <div className="mt-10 grid gap-4 w-full max-w-lg sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-4 text-left hover:border-primary/30 transition-colors">
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Tip</p>
          <p className="text-xs text-muted-foreground">You only see channels for your specific year and department.</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-left hover:border-primary/30 transition-colors">
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Real-time</p>
          <p className="text-xs text-muted-foreground">All messages and polls update instantly across campus.</p>
        </div>
      </div>
    </div>
  )
}

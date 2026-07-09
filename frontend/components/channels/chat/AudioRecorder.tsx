'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, Send, Trash2, Square, Loader2, RotateCcw, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

type Phase = 'idle' | 'recording' | 'preview'

/**
 * Inline voice-note recorder: live timer + level meter while recording, then a
 * preview you can play, re-record, or send. Uses MediaRecorder (opus/webm — already
 * compressed) with a graceful fallback if the browser/mic is unavailable.
 */
export function AudioRecorder({
  onSend,
  onClose,
  sending = false,
}: {
  onSend: (file: File) => void
  onClose: () => void
  sending?: boolean
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [seconds, setSeconds] = useState(0)
  const [level, setLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const blobRef = useRef<Blob | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const timerRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (timerRef.current) window.clearInterval(timerRef.current)
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
  }

  const start = async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Recording is not supported in this browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        blobRef.current = blob
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = URL.createObjectURL(blob)
        setPhase('preview')
        stopStream()
      }

      // Live level meter
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((s, v) => s + v, 0) / data.length
        setLevel(Math.min(1, avg / 140))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()

      recorder.start()
      setPhase('recording')
      setSeconds(0)
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch {
      setError('Microphone permission denied.')
    }
  }

  // Auto-start when mounted.
  useEffect(() => {
    start()
    return () => {
      stopStream()
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopRecording = () => recorderRef.current?.state !== 'inactive' && recorderRef.current?.stop()

  const cancel = () => {
    stopRecording()
    stopStream()
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    onClose()
  }

  const retry = () => {
    blobRef.current = null
    if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null }
    setSeconds(0)
    start()
  }

  const send = () => {
    if (!blobRef.current) return
    const file = new File([blobRef.current], `voice-note-${seconds}s.webm`, { type: blobRef.current.type })
    onSend(file)
  }

  const togglePlay = () => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) { el.play(); setPlaying(true) } else { el.pause(); setPlaying(false) }
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  if (error) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border bg-destructive/5 px-3 py-2 text-sm text-destructive">
        <span>{error}</span>
        <button onClick={onClose} className="interactive-control font-medium hover:underline">Dismiss</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5">
      {phase === 'recording' && (
        <>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          </span>
          <span className="w-14 text-sm font-semibold tabular-nums text-foreground">{mmss}</span>
          {/* Simple live level meter */}
          <div className="flex h-8 flex-1 items-center gap-0.5 overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-primary/70"
                style={{ height: `${Math.max(6, Math.min(100, level * 100 * (0.5 + Math.random())))}%` }}
              />
            ))}
          </div>
          <button onClick={cancel} title="Cancel" className="interactive-control flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={stopRecording} title="Stop" className="interactive-control flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Square className="h-4 w-4" />
          </button>
        </>
      )}

      {phase === 'preview' && previewUrlRef.current && (
        <>
          <button onClick={togglePlay} title={playing ? 'Pause' : 'Play'} className="interactive-control flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground hover:bg-accent">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <audio ref={audioRef} src={previewUrlRef.current} onEnded={() => setPlaying(false)} className="hidden" />
          <span className="flex-1 text-sm font-medium text-muted-foreground">Voice note · {mmss}</span>
          <button onClick={retry} title="Re-record" className="interactive-control flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button onClick={cancel} title="Cancel" className="interactive-control flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={send} disabled={sending} title="Send" className={cn('interactive-control flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50')}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </>
      )}

      {phase === 'idle' && (
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mic className="h-4 w-4" /> Starting recorder…
        </span>
      )}
    </div>
  )
}

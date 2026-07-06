'use client'

import { m } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

const OFFSET: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 24 },
  down: { y: -24 },
  left: { x: 24 },
  right: { x: -24 },
  none: {},
}

interface RevealProps {
  children: ReactNode
  className?: string
  /** Entrance direction. Default: up */
  direction?: Direction
  /** Delay in seconds before the reveal starts */
  delay?: number
  /** Add a scale-pop feel to the entrance */
  pop?: boolean
  /** Animate only once when it scrolls into view (default) vs. on mount */
  onView?: boolean
  as?: 'div' | 'section' | 'li' | 'article'
}

/**
 * A single entrance animation: fade + slide (+ optional pop).
 * Scroll-triggered by default (fires once when in view).
 */
export default function Reveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  pop = false,
  onView = true,
  as = 'div',
}: RevealProps) {
  const off = OFFSET[direction]
  const Comp = m[as] as typeof m.div

  // Render a plain element until hydrated so SSR and first client paint match
  // (no framer `initial` transforms in the server HTML).
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const hidden = { opacity: 0, ...off, ...(pop ? { scale: 0.94 } : {}) }
  const shown = { opacity: 1, x: 0, y: 0, ...(pop ? { scale: 1 } : {}) }

  const transition = {
    duration: 0.5,
    delay,
    ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
  }

  if (!mounted) {
    const PlainTag = as
    return <PlainTag className={cn(className)}>{children}</PlainTag>
  }

  return (
    <Comp
      className={cn(className)}
      initial={hidden}
      {...(onView
        ? { whileInView: shown, viewport: { once: true, margin: '-60px' } }
        : { animate: shown })}
      transition={transition}
    >
      {children}
    </Comp>
  )
}

'use client'

import { m } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const container = (stagger: number) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: 0.04 } },
})

const item = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] },
  },
}

/**
 * Wrap a list/grid; direct children fade-pop in sequence when scrolled into view.
 * Use <StaggerItem> for each child so it inherits the item variant.
 */
export function Stagger({
  children,
  className,
  stagger = 0.06,
  onView = true,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  onView?: boolean
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return <div className={cn(className)}>{children}</div>
  }

  return (
    <m.div
      className={cn(className)}
      variants={container(stagger)}
      initial="hidden"
      {...(onView ? { whileInView: 'show', viewport: { once: true, margin: '-40px' } } : { animate: 'show' })}
    >
      {children}
    </m.div>
  )
}

export function StaggerItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'li' | 'article'
}) {
  const Comp = m[as] as typeof m.div
  return (
    <Comp className={cn(className)} variants={item}>
      {children}
    </Comp>
  )
}

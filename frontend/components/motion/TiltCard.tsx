'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { m, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TiltCardProps {
  children: ReactNode
  className?: string
  /** Max tilt in degrees. Default 8. */
  max?: number
  /** Show a moving glare highlight. Default true. */
  glare?: boolean
  /** Lift the card toward the viewer on hover. Default true. */
  lift?: boolean
}

/**
 * A card that rotates in 3D toward the pointer, with a soft glare sweep.
 * Falls back to a static container when the user prefers reduced motion.
 */
export default function TiltCard({
  children,
  className,
  max = 8,
  glare = true,
  lift = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  // Only enable the 3D tilt after hydration; the server and first client paint
  // render an identical static wrapper (no framer inline transform styles).
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const px = useMotionValue(0.5) // 0..1 pointer x
  const py = useMotionValue(0.5) // 0..1 pointer y

  const springCfg = { stiffness: 260, damping: 22, mass: 0.4 }
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), springCfg)
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), springCfg)
  const glareX = useTransform(px, [0, 1], ['0%', '100%'])
  const glareY = useTransform(py, [0, 1], ['0%', '100%'])
  const glareBackground = useTransform(
    [glareX, glareY] as any,
    ([x, y]: string[]) =>
      `radial-gradient(600px circle at ${x} ${y}, hsl(0 0% 100% / 0.14), transparent 40%)`
  )

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
  }

  function onLeave() {
    px.set(0.5)
    py.set(0.5)
  }

  if (!mounted) {
    return <div className={cn('elev-1', className)}>{children}</div>
  }

  return (
    <m.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial="rest"
      whileHover="hover"
      animate="rest"
      style={{ rotateX, rotateY, transformPerspective: 900, transformStyle: 'preserve-3d' }}
      variants={lift ? { rest: { scale: 1, z: 0 }, hover: { scale: 1.02, z: 30 } } : undefined}
      transition={{ type: 'spring', ...springCfg }}
      className={cn('relative will-change-transform elev-1', className)}
    >
      {children}
      {glare && (
        <m.div
          aria-hidden
          variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none absolute inset-0"
          style={{ background: glareBackground }}
        />
      )}
    </m.div>
  )
}

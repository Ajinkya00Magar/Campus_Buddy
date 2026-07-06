'use client'

import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Wraps the app so all `m.*` components share a single, tree-shaken
 * feature bundle (~15kb via domAnimation instead of the full ~34kb).
 * MotionConfig makes every animation honour prefers-reduced-motion.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="never">{children}</MotionConfig>
    </LazyMotion>
  )
}

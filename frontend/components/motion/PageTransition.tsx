'use client'

import { usePathname } from 'next/navigation'
import { m, AnimatePresence } from 'framer-motion'
import { type ReactNode } from 'react'

/**
 * Wraps page content. On every route change it smoothly fades out the old page
 * and fades/slides in the new page.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={pathname}
        className="h-full"
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.99 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  )
}

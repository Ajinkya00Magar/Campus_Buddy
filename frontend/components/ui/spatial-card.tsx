'use client'

import { ReactNode } from 'react'
import { m } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SpatialCardProps {
  children: ReactNode
  className?: string
  contentClassName?: string
  delay?: number
}

export function SpatialCard({ 
  children, 
  className,
  contentClassName,
  delay = 0,
}: SpatialCardProps) {
  return (
    <m.div 
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay, type: 'spring', bounce: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-[2.5rem] bg-card/60 backdrop-blur-3xl border border-white/20 dark:border-white/10 shadow-[0_16px_40px_rgb(0,0,0,0.04)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.3)] transition-all duration-700 hover:shadow-[0_24px_60px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_24px_60px_rgba(0,0,0,0.4)] hover:-translate-y-1 h-full",
        className
      )}
    >
      {/* Glossy top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/5 dark:to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100 pointer-events-none" />
      <div className={cn("relative h-full flex flex-col p-6 sm:p-8", contentClassName)}>
        {children}
      </div>
    </m.div>
  )
}

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)

  // Load sidebar state from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-open')
    if (saved !== null) {
      setIsOpen(JSON.parse(saved))
    }
  }, [])

  const toggle = () => {
    setIsOpen(prev => {
      const newState = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar-open', JSON.stringify(newState))
      }
      return newState
    })
  }

  return (
    <SidebarContext.Provider value={{ isOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}

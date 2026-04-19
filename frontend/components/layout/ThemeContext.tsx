'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeCtx {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'light',
  toggle: () => {},
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  // On mount: read persisted preference or OS preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cb-theme') as Theme | null
      if (stored === 'dark' || stored === 'light') {
        apply(stored)
        setThemeState(stored)
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        apply('dark')
        setThemeState('dark')
      }
    } catch {}
  }, [])

  function apply(t: Theme) {
    const root = document.documentElement
    root.classList.toggle('dark', t === 'dark')
  }

  function setTheme(t: Theme) {
    setThemeState(t)
    apply(t)
    try { localStorage.setItem('cb-theme', t) } catch {}
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'), setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

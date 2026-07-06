'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'charcoal'

export const THEMES: Theme[] = ['light', 'dark', 'charcoal']

interface ThemeCtx {
  theme: Theme
  /** Cycles light → dark → charcoal → light */
  toggle: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'light',
  toggle: () => {},
  setTheme: () => {},
})

function apply(t: Theme) {
  const root = document.documentElement
  // `dark` class also activates for charcoal so Tailwind's dark: variants
  // (and any dark-aware component styles) still apply on the darkest theme.
  root.classList.toggle('dark', t === 'dark' || t === 'charcoal')
  root.classList.toggle('charcoal', t === 'charcoal')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  // On mount: read persisted preference or OS preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cb-theme') as Theme | null
      if (stored && THEMES.includes(stored)) {
        apply(stored)
        setThemeState(stored)
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        apply('dark')
        setThemeState('dark')
      }
    } catch {}
  }, [])

  function setTheme(t: Theme) {
    setThemeState(t)
    apply(t)
    try { localStorage.setItem('cb-theme', t) } catch {}
  }

  function toggle() {
    const idx = THEMES.indexOf(theme)
    setTheme(THEMES[(idx + 1) % THEMES.length])
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

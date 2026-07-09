'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'charcoal'

export const THEMES: Theme[] = ['light', 'charcoal']

interface ThemeCtx {
  theme: Theme
  /** Cycles light ↔ charcoal */
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
  // Charcoal is the dark theme; it keeps the `dark` class so Tailwind's `dark:`
  // variants (used across the app) still apply, plus `charcoal` for its palette.
  root.classList.toggle('dark', t === 'charcoal')
  root.classList.toggle('charcoal', t === 'charcoal')
}

// Normalize any stored/legacy value (the old standalone 'dark' theme was removed
// and now maps to charcoal).
function normalize(raw: string | null): Theme {
  if (raw === 'light') return 'light'
  if (raw === 'charcoal' || raw === 'dark') return 'charcoal'
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'charcoal'
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cb-theme')
      const resolved = normalize(raw)
      apply(resolved)
      setThemeState(resolved)
      if (raw !== resolved) localStorage.setItem('cb-theme', resolved)
    } catch {}
  }, [])

  function setTheme(t: Theme) {
    setThemeState(t)
    apply(t)
    try { localStorage.setItem('cb-theme', t) } catch {}
  }

  function toggle() {
    setTheme(theme === 'light' ? 'charcoal' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

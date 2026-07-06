import type { Config } from 'tailwindcss'
import path from 'path'

const config: Config = {
  darkMode: ['class'],
  content: [
    path.join(__dirname, './pages/**/*.{ts,tsx}'),
    path.join(__dirname, './components/**/*.{ts,tsx}'),
    path.join(__dirname, './app/**/*.{ts,tsx}'),
    path.join(__dirname, './src/**/*.{ts,tsx}'),
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.9) translateY(10px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'drop-down': {
          from: { opacity: '0', transform: 'translateY(-14px) scaleY(0.96)' },
          to: { opacity: '1', transform: 'translateY(0) scaleY(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'pop-in': 'pop-in 0.32s cubic-bezier(0.2, 0.9, 0.2, 1.15) both',
        'drop-down': 'drop-down 0.24s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        floaty: 'floaty 4.5s ease-in-out infinite',
      },
      boxShadow: {
        'elev-1': 'var(--elev-1), var(--edge-highlight)',
        'elev-2': 'var(--elev-2), var(--edge-highlight)',
        'elev-3': 'var(--elev-3), var(--edge-highlight)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        pop: 'cubic-bezier(0.2, 0.9, 0.2, 1.15)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

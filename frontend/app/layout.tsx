import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Campus Buddy — MIT Academy of Engineering',
  description: 'Your unified campus platform for communication, events, clubs, and courses.',
}

// viewport-fit=cover enables env(safe-area-inset-*) on notched/rounded devices.
// maximumScale is intentionally omitted so users can still pinch-zoom (a11y).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8fa' },
    { media: '(prefers-color-scheme: dark)', color: '#16181d' },
  ],
}

// Anti-FOUC: runs before React hydration, sets dark class immediately from localStorage
const themeScript = `
try {
  var t = localStorage.getItem('cb-theme');
  if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches) t = 'dark';
  var el = document.documentElement;
  if (t === 'dark' || t === 'charcoal') el.classList.add('dark');
  if (t === 'charcoal') el.classList.add('charcoal');
} catch(e) {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

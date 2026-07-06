import type { MetadataRoute } from 'next'

// Served at /manifest.webmanifest and auto-linked by Next.js. Makes Campus
// Buddy installable to the home screen (pairs with public/sw.js for push).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Campus Buddy — MIT Academy of Engineering',
    short_name: 'Campus Buddy',
    description: 'Your unified campus platform for communication, events, clubs, and courses.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#131316',
    theme_color: '#141E4B',
    categories: ['education', 'social', 'productivity'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
}

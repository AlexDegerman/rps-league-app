import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RPS League',
    short_name: 'RPS League',
    description:
      'Real-time Rock Paper Scissors betting with live matches and AI-driven analytics.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f4f6',
    theme_color: '#f3f4f6',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  }
}

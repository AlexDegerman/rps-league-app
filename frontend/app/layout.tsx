import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '../components/Header'
import Footer from '@/components/Footer'
import PredictionTicker from '@/components/PredictionTicker'
import { EventThemeProvider } from '@/lib/EventThemeContext'

export const viewport: Viewport = {
  themeColor: '#f3f4f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export const metadata: Metadata = {
  title: 'RPS League',
  description:
    'Experience high-frequency, real-time Rock Paper Scissors betting with virtual points, live global leaderboards, and AI-driven match analytics.',
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'RPS League',
    description:
      'Experience high-frequency, real-time Rock Paper Scissors betting with virtual points, live global leaderboards, and AI-driven match analytics.',
    url: 'https://rpsleaguegame.vercel.app',
    siteName: 'RPS League',
    images: [
      {
        url: 'https://rpsleaguegame.vercel.app/rpshomepagev2.png',
        width: 1204,
        height: 628,
        alt: 'RPS League Virtual Betting Platform'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  icons: {
    icon: [
      { url: '/rpslogo.png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-gray-100 min-h-screen">
        <EventThemeProvider>
          <Header />
          <main className="w-full pb-24 pt-2">{children}</main>
          {/* Ticker sits above Footer (z-50) and below Header (z-50 sticky) */}
          <PredictionTicker />
          <Footer />
        </EventThemeProvider>
      </body>
    </html>
  )
}

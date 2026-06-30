import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '../components/ui/Header'
import PredictionTicker from '@/components/tickers/PredictionTicker'

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
    'Bet virtual points on fast-paced, real-time Rock Paper Scissors matches featuring live leaderboards, flash events, and synchronized global spectacles.',
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'RPS League',
    description:
      'Bet virtual points on fast-paced, real-time Rock Paper Scissors matches featuring live leaderboards, flash events, and synchronized global spectacles.',
    url: 'https://rpsleague.fi',
    siteName: 'RPS League',
    images: [
      {
        url: 'https://rpsleague.fi/banner.png',
        width: 2012,
        height: 1045,
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
          <Header />
          <main className="w-full pb-24 pt-2">{children}</main>
          <PredictionTicker />
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'
import Header from '../components/Header'
import Footer from '@/components/Footer'
import PredictionTicker from '@/components/PredictionTicker'

export const metadata: Metadata = {
  title: 'RPS League',
  description:
    'Experience high-frequency, real-time Rock Paper Scissors betting with virtual points, live global leaderboards, and AI-driven match analytics.',
  openGraph: {
    title: 'RPS League',
    description:
      'Experience high-frequency, real-time Rock Paper Scissors betting with virtual points, live global leaderboards, and AI-driven match analytics.',
    url: 'https://rpsleaguegame.vercel.app',
    siteName: 'RPS League',
    images: [
      {
        url: 'https://rpsleaguegame.vercel.app/rpsimage.png',
        height: 630,
        alt: 'RPS League Virtual Betting Platform'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  icons: {
    icon: '/rpslogo.png'
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">
        <Header />
        <main className="w-full pb-24">{children}</main>
        <PredictionTicker />
        <Footer />
      </body>
    </html>
  )
}

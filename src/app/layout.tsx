import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Archetypist - Relationship Synastry Analyzer',
  description: 'Discover your relationship archetype through the ancient wisdom of synastry astrology. Uncover your cosmic connection with AI-powered birth chart analysis.',
  keywords: 'synastry, astrology, relationship compatibility, birth chart, zodiac, horoscope',
  openGraph: {
    title: 'Archetypist - Relationship Synastry Analyzer',
    description: 'Discover your cosmic connection with AI-powered synastry analysis',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-900 text-white min-h-screen`}>
        {children}
      </body>
    </html>
  )
}

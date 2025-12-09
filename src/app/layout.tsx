import type { Metadata } from 'next'
import {
  Playfair_Display,
  Reenie_Beanie,
  Geist_Mono,
  Montserrat,
  Just_Me_Again_Down_Here,
} from 'next/font/google'
import { Providers } from './providers'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const playfair = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
})

const reenie = Reenie_Beanie({
  variable: '--font-messy',
  subsets: ['latin'],
  weight: '400',
})

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const justMe = Just_Me_Again_Down_Here({
  variable: '--font-handwritten',
  subsets: ['latin'],
  weight: '400',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Give Protocol - No-Loss Donations',
  description: 'Donate yield to NGOs while keeping your principal. Built on Base.',
  keywords: ['DeFi', 'donations', 'yield', 'NGO', 'Base', 'Ethereum'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${reenie.variable} ${montserrat.variable} ${justMe.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-[#fefefe] overflow-x-hidden font-serif text-emerald-950`}
      >
        <Providers>
          <Navigation />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

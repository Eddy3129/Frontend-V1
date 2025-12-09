import type { Metadata } from 'next'
import { HomeClient } from './home-client'

export const metadata: Metadata = {
  title: 'Give Protocol - No-Loss Donations for NGOs',
  description:
    'Deposit stablecoins, earn yield through DeFi, and direct that yield to causes you care about. Your principal stays safe.',
}

export default function HomePage() {
  return <HomeClient />
}

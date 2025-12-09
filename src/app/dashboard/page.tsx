import type { Metadata } from 'next'
import { StakeClient } from './stake-client'

export const metadata: Metadata = {
  title: 'Dashboard - Give Protocol',
  description: 'Manage your assets, track yield, and view campaign performance',
}

export default function StakePage() {
  return <StakeClient />
}

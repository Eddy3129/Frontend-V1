import type { Metadata } from 'next'
import { CampaignsClient } from './campaigns-client'

export const metadata: Metadata = {
  title: 'Campaigns - Give Protocol',
  description: 'Browse and support campaigns from verified NGOs',
}

export default function CampaignsPage() {
  return <CampaignsClient />
}

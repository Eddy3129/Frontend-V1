import type { Metadata } from 'next'
import { CreateCampaignClient } from './create-campaign-client'

export const metadata: Metadata = {
  title: 'Create Campaign - Give Protocol',
  description: 'Create a new fundraising campaign for your organization',
}

export default function CreateCampaignPage() {
  return <CreateCampaignClient />
}

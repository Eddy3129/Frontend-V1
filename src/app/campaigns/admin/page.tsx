import { Metadata } from 'next'
import { CampaignAdminClient } from './campaign-admin-client'

export const metadata: Metadata = {
  title: 'Campaign Admin | Give Protocol',
  description: 'Manage and approve submitted campaigns',
}

export default function CampaignAdminPage() {
  return <CampaignAdminClient />
}

import type { Metadata } from 'next'
import { CampaignDetailClient } from './campaign-detail-client'
import { getCampaignCID, getGatewayUrl } from '@/lib/pinata'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const cid = await getCampaignCID(id)
    if (cid) {
      const url = getGatewayUrl(cid)
      const res = await fetch(url, { next: { revalidate: 60 } })
      if (res.ok) {
        const metadata = await res.json()
        return {
          title: `${metadata.name} | Give Protocol`,
          description: metadata.description?.slice(0, 160) || 'View campaign details',
        }
      }
    }
  } catch (error) {
    console.error('Error fetching campaign metadata for title:', error)
  }

  return {
    title: `Campaign #${id.slice(0, 8)} - Give Protocol`,
    description: 'View campaign details and vote on checkpoints',
  }
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params
  return <CampaignDetailClient campaignId={id} />
}

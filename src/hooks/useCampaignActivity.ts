'use client'

import { useQuery } from '@tanstack/react-query'
import { request, gql } from 'graphql-request'

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || 'http://localhost:42069'

const GET_CAMPAIGN_ACTIVITY = gql`
  query GetCampaignActivity($campaignId: String!) {
    activities(
      where: { campaignId: $campaignId }
      orderBy: "blockTimestamp"
      orderDirection: "desc"
      limit: 10
    ) {
      items {
        id
        type
        supporterId
        amount
        support
        checkpointIndex
        blockTimestamp
        transactionHash
      }
    }
  }
`

export interface Activity {
  id: string
  type: 'DEPOSIT' | 'WITHDRAW' | 'VOTE'
  supporterId: string
  amount: string | null
  support: boolean | null
  checkpointIndex: string | null
  blockTimestamp: string
  transactionHash: string
}

export function useCampaignActivity(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['campaignActivity', campaignId],
    queryFn: async () => {
      if (!campaignId) return []
      const data = await request<{ activities: { items: Activity[] } }>(
        PONDER_URL,
        GET_CAMPAIGN_ACTIVITY,
        { campaignId: campaignId.toLowerCase() }
      )
      return data.activities.items
    },
    enabled: !!campaignId,
  })
}

import { useQuery } from '@tanstack/react-query'
import { ponderQuery } from '@/lib/ponder'

const GET_CAMPAIGN_ACTIVITY = `
  query GetCampaignActivity($ids: [String!]!) {
    activities(
      where: { campaignId_in: $ids }
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

// Fallback query in case Ponder pluralized 'activity' to 'activitys'
const GET_CAMPAIGN_ACTIVITY_FALLBACK = `
  query GetCampaignActivity($ids: [String!]!) {
    activitys(
      where: { campaignId_in: $ids }
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

export function useCampaignActivity(campaignId: string | undefined, vaultAddress?: string) {
  return useQuery({
    queryKey: ['campaignActivity', campaignId, vaultAddress],
    queryFn: async () => {
      if (!campaignId) return []

      const idsSet = new Set<string>()
      idsSet.add(campaignId.toLowerCase())

      if (vaultAddress && vaultAddress !== '0x0000000000000000000000000000000000000000') {
        idsSet.add(vaultAddress.toLowerCase())
      }

      const ids = Array.from(idsSet)

      try {
        // Use 'activitys' which is Ponder's default pluralization for the 'activity' table
        const data = await ponderQuery<any>(GET_CAMPAIGN_ACTIVITY_FALLBACK, { ids })
        return (data?.activitys?.items || []) as Activity[]
      } catch (error) {
        console.error('❌ [useCampaignActivity] Error:', error)
        return []
      }
    },
    enabled: !!campaignId,
    refetchInterval: 5000,
  })
}

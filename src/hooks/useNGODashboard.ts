import { useMemo } from 'react'
import { type Address, formatUnits } from 'viem'
import { useReadContracts } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { useCampaign } from './useCampaign'
import { useNGO } from './useNGO'
import { ponderQuery } from '@/lib/ponder'
import { getContracts, STRATEGY_IDS } from '@/config/contracts'
import { baseSepolia, ethereumSepolia } from '@/config/chains'
import { PAYOUT_ROUTER_ABI } from '@/lib/abi'
import type { CampaignConfig } from './useCampaign'

interface Activity {
  id: string
  type: 'DEPOSIT' | 'WITHDRAW' | 'VOTE'
  campaignId: string
  amount: string
  supporterId: string
  blockTimestamp: string
  transactionHash: string
}

interface NGOCampaign {
  id: string
  name?: string
  totalStaked: number
  payouts: number
  status: number
  symbol: string
  decimals: number
}

export interface NGODashboardData {
  totalRaised: number
  activeCampaigns: number
  uniqueDonors: number
  campaigns: NGOCampaign[]
  recentActivity: Activity[]
  isLoading: boolean
}

/** Map on-chain strategyId to asset info */
function getStrategyInfo(strategyId: string): { symbol: string; decimals: number } {
  if (strategyId?.toLowerCase() === STRATEGY_IDS.AAVE_USDC.toLowerCase()) {
    return { symbol: 'USDC', decimals: 6 }
  }
  return { symbol: 'ETH', decimals: 18 }
}

export function useNGODashboard(ngoAddress: Address | undefined): NGODashboardData {
  // Get NGO info
  const { useGetNGOInfo } = useNGO()
  const { data: ngoInfo } = useGetNGOInfo(ngoAddress)

  // Get all campaigns
  const { useGetCampaigns } = useCampaign()
  const { data: allCampaigns } = useGetCampaigns(0, 100)

  // Filter campaigns for this NGO (where payoutRecipient matches)
  const ngoCampaigns = useMemo(() => {
    if (!allCampaigns || !ngoAddress) return []

    return allCampaigns.filter(
      (campaign: CampaignConfig) =>
        campaign.payoutRecipient?.toLowerCase() === ngoAddress.toLowerCase() ||
        campaign.proposer?.toLowerCase() === ngoAddress.toLowerCase()
    )
  }, [allCampaigns, ngoAddress])

  const ngoCampaignIds = useMemo(() => {
    return ngoCampaigns.map((c: CampaignConfig) => c.id)
  }, [ngoCampaigns])

  // Get campaign totals for each NGO campaign
  const contracts = getContracts(baseSepolia.id)
  const ethContracts = getContracts(ethereumSepolia.id)

  const campaignTotalsCalls = useMemo(() => {
    if (!ngoCampaignIds || ngoCampaignIds.length === 0) return []

    return ngoCampaignIds.flatMap((campaignId) => [
      {
        address: contracts?.payoutRouter,
        abi: PAYOUT_ROUTER_ABI,
        functionName: 'getCampaignTotals' as const,
        args: [campaignId],
        chainId: baseSepolia.id,
      },
      {
        address: ethContracts?.payoutRouter,
        abi: PAYOUT_ROUTER_ABI,
        functionName: 'getCampaignTotals' as const,
        args: [campaignId],
        chainId: ethereumSepolia.id,
      },
    ])
  }, [ngoCampaignIds, contracts?.payoutRouter, ethContracts?.payoutRouter])

  const { data: campaignTotalsData } = useReadContracts({
    contracts: campaignTotalsCalls as any,
    query: {
      enabled: campaignTotalsCalls.length > 0,
    },
  })

  // Parse campaigns data with totals, using correct decimals per strategy
  const campaigns = useMemo(() => {
    if (!ngoCampaigns || !campaignTotalsData) return []

    return ngoCampaigns.map((campaign: CampaignConfig, index) => {
      const info = getStrategyInfo(campaign.strategyId)

      // Each campaign has 2 results (base + eth)
      const baseResult = campaignTotalsData[index * 2]?.result as any
      const ethResult = campaignTotalsData[index * 2 + 1]?.result as any

      const payoutsBase = (baseResult?.[0] as bigint) || 0n
      const payoutsEth = (ethResult?.[0] as bigint) || 0n
      const totalPayouts = payoutsBase + payoutsEth

      return {
        id: campaign.id,
        totalStaked: Number(formatUnits(campaign.totalStaked || 0n, info.decimals)),
        payouts: Number(formatUnits(totalPayouts, info.decimals)),
        status: campaign.status,
        symbol: info.symbol,
        decimals: info.decimals,
      }
    })
  }, [ngoCampaigns, campaignTotalsData])

  // Calculate total raised (convert to common unit for aggregation)
  const totalRaised = campaigns.reduce((sum, c) => sum + c.payouts, 0)

  // Count active campaigns
  const activeCampaigns = ngoCampaigns.filter(
    (c: CampaignConfig) => c.status === 3 || c.status === 1 // Active or Approved
  ).length

  // Fetch unique donors from Ponder
  const { data: donorsData } = useQuery({
    queryKey: ['ngo-donors', ngoCampaignIds],
    queryFn: async () => {
      if (!ngoCampaignIds || ngoCampaignIds.length === 0) return 0

      const query = `
        query GetNGOStakes($campaignIds: [String!]!) {
          stakes(
            where: { campaignId_in: $campaignIds }
          ) {
            items {
              supporterId
            }
          }
        }
      `

      try {
        const data = await ponderQuery<{
          stakes: { items: Array<{ supporterId: string }> }
        }>(query, { campaignIds: ngoCampaignIds })

        // Get unique supporter IDs
        const uniqueIds = new Set(data?.stakes?.items.map((s) => s.supporterId) || [])
        return uniqueIds.size
      } catch (error) {
        console.warn('Failed to fetch NGO donors:', error)
        return 0
      }
    },
    enabled: ngoCampaignIds.length > 0,
  })

  // Fetch recent activity for NGO's campaigns
  const { data: activityData } = useQuery({
    queryKey: ['ngo-activity', ngoCampaignIds],
    queryFn: async () => {
      if (!ngoCampaignIds || ngoCampaignIds.length === 0) return []

      const query = `
        query GetNGOActivity($campaignIds: [String!]!) {
          activitys(
            where: { campaignId_in: $campaignIds }
            orderBy: "blockTimestamp"
            orderDirection: "desc"
            limit: 20
          ) {
            items {
              id
              type
              campaignId
              amount
              supporterId
              blockTimestamp
              transactionHash
            }
          }
        }
      `

      try {
        const data = await ponderQuery<{
          activitys: { items: Activity[] }
        }>(query, { campaignIds: ngoCampaignIds })

        return data?.activitys?.items || []
      } catch (error) {
        console.warn('Failed to fetch NGO activity:', error)
        return []
      }
    },
    enabled: ngoCampaignIds.length > 0,
    refetchInterval: 10000,
  })

  return {
    totalRaised,
    activeCampaigns,
    uniqueDonors: donorsData || 0,
    campaigns,
    recentActivity: activityData || [],
    isLoading: !allCampaigns,
  }
}

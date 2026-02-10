import { useMemo, useCallback } from 'react'
import { type Address, formatUnits } from 'viem'
import { useReadContracts } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { useCampaign } from './useCampaign'
import { useNGO } from './useNGO'
import { ponderQuery } from '@/lib/ponder'
import { getContracts, STRATEGY_IDS } from '@/config/contracts'
import { baseSepolia, ethereumSepolia } from '@/config/chains'
import { PAYOUT_ROUTER_ABI } from '@/lib/abi'
import { getGatewayUrl, parseCID, type CampaignMetadata } from '@/lib/pinata'
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
  ngoName?: string
  ngoLogo?: string
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
  campaignDecimals: Map<string, { decimals: number; symbol: string }>
  /** Primary symbol across campaigns (ETH or USDC) */
  primarySymbol: string
  /** NGO name from first campaign metadata */
  ngoName?: string
  /** NGO logo URL (resolved gateway URL) */
  ngoLogoUrl?: string
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

  const contracts = getContracts(baseSepolia.id)
  const ethContracts = getContracts(ethereumSepolia.id)

  // Resolve the vault address a campaign actually uses (same logic as useDonorDashboard)
  const resolveVaultAddress = useCallback(
    (c: CampaignConfig): string | undefined => {
      const ZERO = '0x0000000000000000000000000000000000000000'
      if (c.vault && c.vault !== ZERO) return c.vault.toLowerCase()

      const info = getStrategyInfo(c.strategyId)
      if (info.symbol === 'ETH') {
        const addr = ethContracts?.ethVault
        return addr && addr !== ZERO ? addr.toLowerCase() : undefined
      }
      return (
        contracts?.usdcVault?.toLowerCase() ?? ethContracts?.usdcVault?.toLowerCase() ?? undefined
      )
    },
    [contracts, ethContracts]
  )

  // Filter campaigns for this NGO (where payoutRecipient or proposer matches)
  const ngoCampaigns = useMemo(() => {
    if (!allCampaigns || !ngoAddress) return []

    return allCampaigns.filter(
      (campaign: CampaignConfig) =>
        campaign.payoutRecipient?.toLowerCase() === ngoAddress.toLowerCase() ||
        campaign.proposer?.toLowerCase() === ngoAddress.toLowerCase()
    )
  }, [allCampaigns, ngoAddress])

  // Build Ponder query IDs: include both campaign registry IDs AND vault addresses
  // because Ponder stores vault address as campaignId for global vault deposits
  const { ponderQueryIds, vaultToCampaignMap } = useMemo(() => {
    const ids = new Set<string>()
    const v2c = new Map<string, string>() // vaultAddr → campaignId

    ngoCampaigns.forEach((c: CampaignConfig) => {
      const cid = c.id.toLowerCase()
      ids.add(cid)

      const vaultAddr = resolveVaultAddress(c)
      if (vaultAddr) {
        ids.add(vaultAddr)
        v2c.set(vaultAddr, cid)
      }
    })

    return { ponderQueryIds: Array.from(ids), vaultToCampaignMap: v2c }
  }, [ngoCampaigns, resolveVaultAddress])

  // Build campaignDecimals map (for both campaign IDs and vault addresses)
  const campaignDecimals = useMemo(() => {
    const map = new Map<string, { decimals: number; symbol: string }>()
    if (ngoCampaigns) {
      ngoCampaigns.forEach((c: CampaignConfig) => {
        const info = getStrategyInfo(c.strategyId)
        map.set(c.id.toLowerCase(), info)
        const vaultAddr = resolveVaultAddress(c)
        if (vaultAddr) map.set(vaultAddr, info)
      })
    }
    return map
  }, [ngoCampaigns, resolveVaultAddress])

  // Get campaign totals for each NGO campaign (payouts from PayoutRouter)
  const ngoCampaignIds = useMemo(() => {
    return ngoCampaigns.map((c: CampaignConfig) => c.id.toLowerCase())
  }, [ngoCampaigns])

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

  // Fetch stakes from Ponder using both campaign IDs AND vault addresses
  const { data: stakesData } = useQuery({
    queryKey: ['ngo-stakes', ponderQueryIds],
    queryFn: async () => {
      if (ponderQueryIds.length === 0)
        return { uniqueDonors: 0, stakesByCampaign: new Map<string, bigint>() }

      const query = `
        query GetNGOStakes($campaignIds: [String!]!) {
          stakes(
            where: { campaignId_in: $campaignIds }
          ) {
            items {
              supporterId
              campaignId
              amount
            }
          }
        }
      `

      try {
        const data = await ponderQuery<{
          stakes: { items: Array<{ supporterId: string; campaignId: string; amount: string }> }
        }>(query, { campaignIds: ponderQueryIds })

        const items = data?.stakes?.items || []

        // Get unique supporter IDs
        const uniqueIds = new Set(items.map((s) => s.supporterId))

        // Aggregate stakes per campaign (normalize vault addresses to campaign IDs)
        const stakesByCampaign = new Map<string, bigint>()
        items.forEach((s) => {
          const rawId = s.campaignId.toLowerCase()
          // Map vault address back to campaign ID if needed
          const cid = vaultToCampaignMap.get(rawId) || rawId
          stakesByCampaign.set(cid, (stakesByCampaign.get(cid) || 0n) + BigInt(s.amount))
        })

        return { uniqueDonors: uniqueIds.size, stakesByCampaign }
      } catch (error) {
        console.warn('Failed to fetch NGO stakes:', error)
        return { uniqueDonors: 0, stakesByCampaign: new Map<string, bigint>() }
      }
    },
    enabled: ponderQueryIds.length > 0,
    refetchInterval: 10000,
  })

  // Fetch campaign metadata (name, NGO logo, NGO name) from IPFS
  const { data: metadataResults } = useQuery({
    queryKey: ['ngo-campaign-metadata', ngoCampaignIds],
    queryFn: async () => {
      if (!ngoCampaigns || ngoCampaigns.length === 0) return []

      const results = await Promise.all(
        ngoCampaigns.map(async (campaign: CampaignConfig) => {
          try {
            const cidRes = await fetch(`/api/campaign/cid?campaignId=${campaign.id}`)
            if (!cidRes.ok) return null

            const { cid } = await cidRes.json()
            if (!cid) return null

            const metadataUrl = getGatewayUrl(parseCID(cid))
            const metaRes = await fetch(metadataUrl, { next: { revalidate: 3600 } })
            if (!metaRes.ok) return null

            const metadata = (await metaRes.json()) as CampaignMetadata
            return { campaignId: campaign.id, metadata }
          } catch (err) {
            console.warn(`Failed to fetch metadata for ${campaign.id}:`, err)
            return null
          }
        })
      )

      return results.filter((r) => r !== null) as Array<{
        campaignId: string
        metadata: CampaignMetadata
      }>
    },
    enabled: ngoCampaigns.length > 0,
    staleTime: 60000,
  })

  // Build metadata map
  const campaignMetadataMap = useMemo(() => {
    const map = new Map<string, CampaignMetadata>()
    if (metadataResults) {
      metadataResults.forEach(({ campaignId, metadata }) => {
        map.set(campaignId.toLowerCase(), metadata)
      })
    }
    return map
  }, [metadataResults])

  // Extract NGO name and logo from metadata
  const { ngoName, ngoLogoUrl } = useMemo(() => {
    if (!metadataResults || metadataResults.length === 0) return {}
    const first = metadataResults[0].metadata
    const logoCid = first.ngoLogo || first.images?.[0]
    return {
      ngoName: first.ngoName,
      ngoLogoUrl: logoCid ? getGatewayUrl(parseCID(logoCid)) : undefined,
    }
  }, [metadataResults])

  // Parse campaigns data with totals, using Ponder stakes + payout router data + metadata
  const campaigns = useMemo(() => {
    if (!ngoCampaigns) return []

    return ngoCampaigns.map((campaign: CampaignConfig, index) => {
      const info = getStrategyInfo(campaign.strategyId)
      const metadata = campaignMetadataMap.get(campaign.id.toLowerCase())

      // Get total staked from Ponder (reliable source, already normalized to campaign ID)
      const ponderStaked = stakesData?.stakesByCampaign.get(campaign.id.toLowerCase()) || 0n
      // Fallback to contract totalStaked if Ponder has nothing
      const effectiveStaked = ponderStaked > 0n ? ponderStaked : campaign.totalStaked || 0n

      // Get payouts from PayoutRouter if available
      let totalPayouts = 0n
      if (campaignTotalsData) {
        const baseResult = campaignTotalsData[index * 2]?.result as any
        const ethResult = campaignTotalsData[index * 2 + 1]?.result as any
        const payoutsBase = (baseResult?.[0] as bigint) || 0n
        const payoutsEth = (ethResult?.[0] as bigint) || 0n
        totalPayouts = payoutsBase + payoutsEth
      }

      return {
        id: campaign.id,
        name: metadata?.name,
        ngoName: metadata?.ngoName,
        ngoLogo: metadata?.ngoLogo || metadata?.images?.[0],
        totalStaked: Number(formatUnits(effectiveStaked, info.decimals)),
        payouts: Number(formatUnits(totalPayouts, info.decimals)),
        status: campaign.status,
        symbol: info.symbol,
        decimals: info.decimals,
      }
    })
  }, [ngoCampaigns, campaignTotalsData, stakesData, campaignMetadataMap])

  // Calculate total raised from staked amounts
  const totalRaised = campaigns.reduce((sum, c) => sum + c.totalStaked, 0)

  // Determine primary symbol (ETH vs USDC across all campaigns)
  const primarySymbol = campaigns.length > 0 ? campaigns[0].symbol : 'ETH'

  // Count active campaigns
  const activeCampaigns = ngoCampaigns.filter(
    (c: CampaignConfig) => c.status === 3 || c.status === 1 // Active or Approved
  ).length

  // Fetch recent activity for NGO's campaigns (using both campaign IDs and vault addresses)
  const { data: activityData } = useQuery({
    queryKey: ['ngo-activity', ponderQueryIds],
    queryFn: async () => {
      if (ponderQueryIds.length === 0) return []

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
        }>(query, { campaignIds: ponderQueryIds })

        return data?.activitys?.items || []
      } catch (error) {
        console.warn('Failed to fetch NGO activity:', error)
        return []
      }
    },
    enabled: ponderQueryIds.length > 0,
    refetchInterval: 10000,
  })

  return {
    totalRaised,
    activeCampaigns,
    uniqueDonors: stakesData?.uniqueDonors || 0,
    campaigns,
    recentActivity: activityData || [],
    campaignDecimals,
    primarySymbol,
    ngoName,
    ngoLogoUrl,
    isLoading: !allCampaigns,
  }
}

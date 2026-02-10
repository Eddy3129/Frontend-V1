import { useMemo, useEffect, useState, useCallback } from 'react'
import { type Address, formatUnits } from 'viem'
import { useReadContracts } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { useCampaign } from './useCampaign'
import type { CampaignConfig } from './useCampaign'
import { ponderQuery } from '@/lib/ponder'
import { getContracts, STRATEGY_IDS } from '@/config/contracts'
import { baseSepolia, ethereumSepolia } from '@/config/chains'
import { PAYOUT_ROUTER_ABI } from '@/lib/abi'
import { useAaveAPY } from './useAaveAPY'
import { getGatewayUrl, parseCID, type CampaignMetadata } from '@/lib/pinata'

interface Activity {
  id: string
  type: 'DEPOSIT' | 'WITHDRAW' | 'VOTE'
  campaignId: string
  amount: string
  support?: boolean
  checkpointIndex?: number
  blockTimestamp: string
  transactionHash: string
}

interface StakePosition {
  campaignId: string
  amount: bigint
  amountFormatted: string
  symbol: string
  decimals: number
  campaignName?: string
  ngoName?: string
  ngoLogo?: string
}

export interface DonorDashboardData {
  totalStakedUsd: number
  yieldEarned: number
  campaignsSupported: number
  stakePositions: StakePosition[]
  recentActivity: Activity[]
  campaignDecimals: Map<string, { decimals: number; symbol: string }>
  isLoading: boolean
}

/** Map on-chain strategyId to asset info */
function getStrategyInfo(strategyId: string): { symbol: string; decimals: number } {
  if (strategyId?.toLowerCase() === STRATEGY_IDS.AAVE_USDC.toLowerCase()) {
    return { symbol: 'USDC', decimals: 6 }
  }
  // AAVE_ETH or any other strategy defaults to ETH
  return { symbol: 'ETH', decimals: 18 }
}

export function useDonorDashboard(userAddress: Address | undefined): DonorDashboardData {
  const [ethPriceUsd, setEthPriceUsd] = useState<number>(0)

  // Get all campaigns for strategy lookup
  const { useGetCampaigns } = useCampaign()
  const { data: allCampaigns } = useGetCampaigns(0, 100)

  const contracts = getContracts(baseSepolia.id)
  const ethContracts = getContracts(ethereumSepolia.id)

  // Fetch Aave APY strategies for yield estimation
  const { strategies: aaveStrategies } = useAaveAPY()

  // Fetch ETH price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/eth-price')
        const json = await res.json()
        if (json?.usd) setEthPriceUsd(Number(json.usd))
      } catch (err) {
        console.error('Failed to fetch ETH price', err)
      }
    }
    fetchPrice()
  }, [])

  // Resolve the vault address a campaign actually uses.
  // If campaign.vault is zero, the protocol vault is used based on strategy.
  const resolveVaultAddress = useCallback(
    (c: CampaignConfig): string | undefined => {
      const ZERO = '0x0000000000000000000000000000000000000000'
      if (c.vault && c.vault !== ZERO) return c.vault.toLowerCase()

      // Campaign uses the protocol-level vault — determine which one from strategyId
      const info = getStrategyInfo(c.strategyId)
      if (info.symbol === 'ETH') {
        const addr = ethContracts?.ethVault
        return addr && addr !== ZERO ? addr.toLowerCase() : undefined
      }
      // USDC — could be on either chain
      return (
        contracts?.usdcVault?.toLowerCase() ?? ethContracts?.usdcVault?.toLowerCase() ?? undefined
      )
    },
    [contracts, ethContracts]
  )

  // Build campaign lookup maps (campaignId → config, vaultAddr → config)
  const { campaignMap, vaultMap } = useMemo(() => {
    const cMap = new Map<string, CampaignConfig>()
    const vMap = new Map<string, CampaignConfig>()
    if (allCampaigns) {
      allCampaigns.forEach((c: CampaignConfig) => {
        cMap.set(c.id.toLowerCase(), c)
        const vaultAddr = resolveVaultAddress(c)
        if (vaultAddr) vMap.set(vaultAddr, c)
      })
    }
    return { campaignMap: cMap, vaultMap: vMap }
  }, [allCampaigns, resolveVaultAddress])

  // Build campaignDecimals map for ALL campaigns (used by UI for activity formatting)
  const campaignDecimals = useMemo(() => {
    const map = new Map<string, { decimals: number; symbol: string }>()
    if (allCampaigns) {
      allCampaigns.forEach((c: CampaignConfig) => {
        const info = getStrategyInfo(c.strategyId)
        map.set(c.id.toLowerCase(), info)
        const vaultAddr = resolveVaultAddress(c)
        if (vaultAddr) map.set(vaultAddr, info)
      })
    }
    return map
  }, [allCampaigns, resolveVaultAddress])

  // ── 1. Fetch user's stakes from Ponder (reliable cross-chain source) ──
  const { data: userStakes, isLoading: isStakesLoading } = useQuery({
    queryKey: ['user-stakes', userAddress],
    queryFn: async () => {
      if (!userAddress) return []

      const query = `
        query GetUserStakes($supporterId: String!) {
          stakes(
            where: { supporterId: $supporterId }
            orderBy: "amount"
            orderDirection: "desc"
            limit: 100
          ) {
            items {
              campaignId
              amount
            }
          }
        }
      `

      try {
        const data = await ponderQuery<{
          stakes: { items: Array<{ campaignId: string; amount: string }> }
        }>(query, { supporterId: userAddress.toLowerCase() })

        // Aggregate by campaignId (user may have multiple stake entries per campaign)
        const stakeMap = new Map<string, bigint>()
        data?.stakes?.items.forEach((item) => {
          const id = item.campaignId.toLowerCase()
          stakeMap.set(id, (stakeMap.get(id) || 0n) + BigInt(item.amount))
        })

        return Array.from(stakeMap.entries())
          .filter(([, amount]) => amount > 0n)
          .map(([campaignId, amount]) => ({ campaignId, amount }))
      } catch (error) {
        console.warn('Failed to fetch user stakes:', error)
        return []
      }
    },
    enabled: !!userAddress,
    refetchInterval: 10000,
  })

  // ── 2. Fetch campaign metadata for names + logos ──
  const { data: metadataResults } = useQuery({
    queryKey: ['campaign-metadata-batch', userStakes?.map((s) => s.campaignId), campaignMap.size],
    queryFn: async () => {
      if (!userStakes) return []

      const results = await Promise.all(
        userStakes.map(async (stake) => {
          const campaign = campaignMap.get(stake.campaignId) || vaultMap.get(stake.campaignId)
          if (!campaign) return null

          try {
            // Fetch CID from API
            const cidRes = await fetch(`/api/campaign/cid?campaignId=${campaign.id}`)
            if (!cidRes.ok) return null

            const { cid } = await cidRes.json()
            if (!cid) return null

            // Fetch metadata from IPFS
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
    enabled: !!userStakes && userStakes.length > 0 && campaignMap.size > 0,
    staleTime: 60000,
  })

  // Derive metadata map from query results (replaces mutable Map + useEffect)
  const campaignMetadataMap = useMemo(() => {
    const map = new Map<string, CampaignMetadata>()
    if (metadataResults) {
      metadataResults.forEach(({ campaignId, metadata }) => {
        map.set(campaignId.toLowerCase(), metadata)
      })
    }
    return map
  }, [metadataResults])

  // ── 3. Build stake positions with proper formatting + metadata ──
  const stakePositions = useMemo(() => {
    if (!userStakes) return []

    return userStakes
      .map((stake) => {
        // Look up campaign by stake's campaignId (could be campaign hex ID or vault address)
        const campaign = campaignMap.get(stake.campaignId) || vaultMap.get(stake.campaignId)
        if (!campaign) {
          console.warn('Campaign not found for stake:', stake.campaignId)
          return null
        }

        const info = getStrategyInfo(campaign.strategyId)
        const metadata = campaignMetadataMap.get(campaign.id.toLowerCase())

        return {
          campaignId: campaign.id, // ALWAYS use the actual campaign ID, not vault address
          amount: stake.amount,
          amountFormatted: Number(formatUnits(stake.amount, info.decimals)).toLocaleString(
            undefined,
            {
              maximumFractionDigits: 4,
            }
          ),
          symbol: info.symbol,
          decimals: info.decimals,
          campaignName: metadata?.name,
          ngoName: metadata?.ngoName,
          ngoLogo: metadata?.ngoLogo || metadata?.images?.[0],
        }
      })
      .filter((p) => p !== null) as StakePosition[]
  }, [userStakes, campaignMap, vaultMap, campaignMetadataMap])

  // ── 4. Calculate total staked in USD ──
  const totalStakedUsd = useMemo(() => {
    return stakePositions.reduce((sum, pos) => {
      const amount = Number(formatUnits(pos.amount, pos.decimals))
      if (pos.symbol === 'ETH') return sum + amount * ethPriceUsd
      return sum + amount // USDC is already USD-denominated
    }, 0)
  }, [stakePositions, ethPriceUsd])

  // ── 5. Fetch accumulated yield from both chains' payout routers ──
  const yieldCalls = useMemo(() => {
    if (!userAddress) return []

    const calls: Array<{
      address: `0x${string}`
      abi: typeof PAYOUT_ROUTER_ABI
      functionName: 'getAccumulatedYield'
      args: [`0x${string}`, Address]
      chainId: number
    }> = []

    // USDC vault on Base Sepolia
    if (contracts?.payoutRouter && contracts?.usdcVault) {
      calls.push({
        address: contracts.payoutRouter,
        abi: PAYOUT_ROUTER_ABI,
        functionName: 'getAccumulatedYield',
        args: [contracts.usdcVault, userAddress],
        chainId: baseSepolia.id,
      })
    }

    // USDC vault on Ethereum Sepolia
    if (ethContracts?.payoutRouter && ethContracts?.usdcVault) {
      calls.push({
        address: ethContracts.payoutRouter,
        abi: PAYOUT_ROUTER_ABI,
        functionName: 'getAccumulatedYield',
        args: [ethContracts.usdcVault, userAddress],
        chainId: ethereumSepolia.id,
      })
    }

    // ETH vault on Ethereum Sepolia
    if (
      ethContracts?.payoutRouter &&
      ethContracts?.ethVault &&
      ethContracts.ethVault !== '0x0000000000000000000000000000000000000000'
    ) {
      calls.push({
        address: ethContracts.payoutRouter,
        abi: PAYOUT_ROUTER_ABI,
        functionName: 'getAccumulatedYield',
        args: [ethContracts.ethVault, userAddress],
        chainId: ethereumSepolia.id,
      })
    }

    return calls
  }, [userAddress, contracts, ethContracts])

  const { data: yieldData } = useReadContracts({
    contracts: yieldCalls as any,
    query: {
      enabled: yieldCalls.length > 0,
    },
  })

  // Calculate accumulated yield from contract (0 when not yet distributed)
  const contractYield = useMemo(() => {
    if (!yieldData) return 0
    let total = 0
    let callIndex = 0

    // USDC vault on Base Sepolia (6 decimals)
    if (contracts?.payoutRouter && contracts?.usdcVault) {
      const result = yieldData[callIndex]?.result as bigint | undefined
      if (result) total += Number(formatUnits(result, 6))
      callIndex++
    }

    // USDC vault on Ethereum Sepolia (6 decimals)
    if (ethContracts?.payoutRouter && ethContracts?.usdcVault) {
      const result = yieldData[callIndex]?.result as bigint | undefined
      if (result) total += Number(formatUnits(result, 6))
      callIndex++
    }

    // ETH vault on Ethereum Sepolia (18 decimals → convert to USD)
    if (
      ethContracts?.payoutRouter &&
      ethContracts?.ethVault &&
      ethContracts.ethVault !== '0x0000000000000000000000000000000000000000'
    ) {
      const result = yieldData[callIndex]?.result as bigint | undefined
      if (result) total += Number(formatUnits(result, 18)) * ethPriceUsd
      callIndex++
    }

    return total
  }, [yieldData, ethPriceUsd, contracts, ethContracts])

  // ── 6. Fetch recent activity from Ponder ──
  const { data: activityData } = useQuery({
    queryKey: ['user-activity', userAddress],
    queryFn: async () => {
      if (!userAddress) return []

      const query = `
        query GetUserActivity($supporterId: String!) {
          activitys(
            where: { supporterId: $supporterId }
            orderBy: "blockTimestamp"
            orderDirection: "desc"
            limit: 20
          ) {
            items {
              id
              type
              campaignId
              amount
              support
              checkpointIndex
              blockTimestamp
              transactionHash
            }
          }
        }
      `

      try {
        const data = await ponderQuery<{
          activitys: { items: Activity[] }
        }>(query, { supporterId: userAddress.toLowerCase() })

        return data?.activitys?.items || []
      } catch (error) {
        console.warn('Failed to fetch user activity:', error)
        return []
      }
    },
    enabled: !!userAddress,
    refetchInterval: 10000,
  })

  // Estimate yield from APY when contract yield is 0 (yield not yet distributed on testnet)
  const yieldEarned = useMemo(() => {
    if (contractYield > 0) return contractYield
    if (stakePositions.length === 0 || aaveStrategies.length === 0) return 0

    // Use earliest deposit timestamp to estimate time staked
    const deposits = (activityData || []).filter((a) => a.type === 'DEPOSIT')
    const earliestTimestamp =
      deposits.length > 0
        ? Math.min(...deposits.map((d) => Number(d.blockTimestamp)))
        : Math.floor(Date.now() / 1000) - 86400 // default 1 day if no data yet

    const secondsElapsed = Math.floor(Date.now() / 1000) - earliestTimestamp
    const yearsElapsed = Math.max(secondsElapsed / (365.25 * 24 * 3600), 1 / 365.25) // min 1 day

    let total = 0
    for (const pos of stakePositions) {
      const amountUsd =
        pos.symbol === 'ETH'
          ? Number(formatUnits(pos.amount, pos.decimals)) * ethPriceUsd
          : Number(formatUnits(pos.amount, pos.decimals))

      // Match position to the appropriate Aave strategy APY
      const strategyId = pos.symbol === 'ETH' ? 'aave-weth-eth' : 'aave-usdc-base'
      const strategy = aaveStrategies.find((s) => s.id === strategyId)
      const apy = strategy?.apy || 2.0

      total += amountUsd * (apy / 100) * yearsElapsed
    }

    return total
  }, [contractYield, stakePositions, aaveStrategies, ethPriceUsd, activityData])

  return {
    totalStakedUsd,
    yieldEarned,
    campaignsSupported: stakePositions.length,
    stakePositions,
    recentActivity: activityData || [],
    campaignDecimals,
    isLoading: isStakesLoading || !allCampaigns,
  }
}

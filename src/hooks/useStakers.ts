import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useReadContract } from 'wagmi'
import { type Address, formatUnits } from 'viem'
import { CAMPAIGN_REGISTRY_ABI } from '@/lib/abi'
import { getContracts } from '@/config/contracts'
import { baseSepolia, ethereumSepolia } from '@/config/chains'
import { ponderQuery } from '@/lib/ponder'

export interface Staker {
  address: Address
  shares: bigint
  amountFormatted: string
  votingPowerPercent: number
  rank?: number
}

/**
 * Hook to fetch and manage staker data for a campaign using Ponder
 */
export function useStakers(campaignId: `0x${string}` | undefined, chainId?: number) {
  const supportedChainId =
    chainId === baseSepolia.id || chainId === ethereumSepolia.id ? chainId : ethereumSepolia.id

  const contracts = getContracts(supportedChainId)

  // 1. Get total staked from contract
  const {
    data: campaignData,
    isLoading: isCampaignLoading,
    error: campaignError,
  } = useReadContract({
    address: contracts?.campaignRegistry,
    abi: CAMPAIGN_REGISTRY_ABI,
    functionName: 'getCampaign',
    args: campaignId ? [campaignId] : undefined,
    chainId: supportedChainId,
    query: {
      enabled: !!contracts?.campaignRegistry && !!campaignId,
    },
  })

  const strategyInfo = useMemo(() => {
    if (!campaignData) return { symbol: 'ETH', decimals: 18 }
    const strategyId = Array.isArray(campaignData)
      ? (campaignData[5] as string)
      : (campaignData as any).strategyId

    // AAVE_USDC Strategy ID
    if (strategyId === '0xfa06fc6834087ec4c5d38992a03c81b67c92225cb2bdc899d7fe333316794dd5') {
      return { symbol: 'USDC', decimals: 6 }
    }
    return { symbol: 'ETH', decimals: 18 }
  }, [campaignData])

  const totalStakedFromContract = useMemo(() => {
    if (!campaignData) return 0n
    return Array.isArray(campaignData)
      ? (campaignData[9] as bigint) || 0n
      : (campaignData as any).totalStaked || 0n
  }, [campaignData])

  const vaultAddress = useMemo(() => {
    if (!campaignData) return undefined

    const addr = Array.isArray(campaignData)
      ? (campaignData[4] as string)
      : (campaignData as any).vault

    const strategyId = Array.isArray(campaignData)
      ? (campaignData[5] as string)
      : (campaignData as any).strategyId

    if (!addr || addr === '0x0000000000000000000000000000000000000000') {
      if (strategyId === '0xf652ab2d7840bae82cb8fb1b886de339d4b690cf5f62560a68ec11d0ad4fd3e4') {
        return contracts?.ethVault
      }
      if (strategyId === '0xfa06fc6834087ec4c5d38992a03c81b67c92225cb2bdc899d7fe333316794dd5') {
        return contracts?.usdcVault
      }
    }
    return addr
  }, [campaignData, contracts])

  // 2. Fetch stakers list from Ponder
  const {
    data: ponderStakers = [],
    isLoading: isPonderLoading,
    error: ponderError,
  } = useQuery({
    queryKey: ['campaign-stakers', campaignId, vaultAddress, supportedChainId],
    queryFn: async () => {
      if (!campaignId) return []

      const ids = [campaignId.toLowerCase()]
      if (vaultAddress) ids.push(vaultAddress.toLowerCase())

      const query = `
        query GetStakers($ids: [String!]!) {
          stakes(
            where: { campaignId_in: $ids }
            orderBy: "amount"
            orderDirection: "desc"
            limit: 100
          ) {
            items {
              supporterId
              amount
            }
          }
        }
      `

      try {
        const data = await ponderQuery<{
          stakes: { items: { supporterId: string; amount: string }[] }
        }>(query, { ids })

        const stakerMap = new Map<string, bigint>()
        data.stakes.items.forEach((item) => {
          const addr = item.supporterId.toLowerCase()
          stakerMap.set(addr, (stakerMap.get(addr) || 0n) + BigInt(item.amount))
        })

        return Array.from(stakerMap.entries()).map(([addr, amount]) => ({
          address: addr as Address,
          shares: amount,
        }))
      } catch (err) {
        console.error('❌ [useStakers] Failed to fetch:', err)
        return []
      }
    },
    enabled: !!campaignId,
    refetchInterval: 10000,
  })

  // 3. Process stakers with voting power and formatting
  const stakers = useMemo(() => {
    // If totalStaked from contract is 0, use the sum of stakers from Ponder
    const totalIndexed = ponderStakers.reduce((acc, s) => acc + s.shares, 0n)
    const activeTotal =
      totalStakedFromContract > totalIndexed ? totalStakedFromContract : totalIndexed

    return ponderStakers.map((staker, index) => {
      const amountFormatted = formatUnits(staker.shares, strategyInfo.decimals)
      const votingPowerPercent =
        activeTotal > 0n ? (Number(staker.shares) * 100) / Number(activeTotal) : 0

      return {
        ...staker,
        amountFormatted: `${Number(amountFormatted).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${strategyInfo.symbol}`,
        votingPowerPercent,
        rank: index + 1,
      }
    })
  }, [ponderStakers, totalStakedFromContract, strategyInfo])

  return {
    stakers,
    totalStakers: stakers.length,
    topStakers: stakers.slice(0, 10),
    getTopStakers: (count: number = 10) => stakers.slice(0, count),
    getUserRank: (userAddress?: Address) => {
      if (!userAddress) return null
      return (
        stakers.find((s) => s.address.toLowerCase() === userAddress.toLowerCase())?.rank || null
      )
    },
    isLoading: isCampaignLoading || isPonderLoading,
    error: ponderError || campaignError,
    totalStaked: totalStakedFromContract,
    symbol: strategyInfo.symbol,
  }
}

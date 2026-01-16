import { useMemo, useEffect, useState } from 'react'
import { usePublicClient, useBlockNumber } from 'wagmi'
import { type Address, type Log, parseAbiItem } from 'viem'
import { useReadContract } from 'wagmi'
import { CAMPAIGN_REGISTRY_ABI } from '@/lib/abi'
import { getContracts } from '@/config/contracts'
import { baseSepolia, ethereumSepolia } from '@/config/chains'

export interface Staker {
  address: Address
  shares: bigint
  votingPowerPercent: number
  rank?: number
}

/**
 * Hook to fetch and manage staker data for a campaign
 * Fetches StakeDeposited events and queries stake positions
 */
export function useStakers(campaignId: `0x${string}` | undefined, chainId?: number) {
  const supportedChainId =
    chainId === baseSepolia.id || chainId === ethereumSepolia.id ? chainId : ethereumSepolia.id

  const contracts = getContracts(supportedChainId)
  const publicClient = usePublicClient({ chainId: supportedChainId })

  const [stakers, setStakers] = useState<Staker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Get total staked to calculate percentages
  const { data: campaignData } = useReadContract({
    address: contracts?.campaignRegistry,
    abi: CAMPAIGN_REGISTRY_ABI,
    functionName: 'getCampaign',
    args: campaignId ? [campaignId] : undefined,
    chainId: supportedChainId,
    query: {
      enabled: !!contracts?.campaignRegistry && !!campaignId,
    },
  })

  const totalStaked = useMemo(() => {
    if (!campaignData || !Array.isArray(campaignData)) return 0n
    return (campaignData[9] as bigint) || 0n // totalStaked field
  }, [campaignData])

  // Fetch stakers from StakeDeposited events
  useEffect(() => {
    if (!publicClient || !campaignId || !contracts?.campaignRegistry) {
      setIsLoading(false)
      return
    }

    const fetchStakers = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get StakeDeposited events for this campaign
        const stakeDepositedEvent = parseAbiItem(
          'event StakeDeposited(bytes32 indexed id, address indexed supporter, uint256 amount, uint256 totalStaked)'
        )

        // Fetch last 10000 blocks (roughly 1-2 days depending on chain)
        const currentBlock = await publicClient.getBlockNumber()
        const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n

        const logs = await publicClient.getLogs({
          address: contracts.campaignRegistry,
          event: stakeDepositedEvent,
          args: {
            id: campaignId,
          },
          fromBlock,
          toBlock: 'latest',
        })

        // Extract unique staker addresses
        const uniqueStakers = new Set<Address>()
        logs.forEach((log) => {
          if (log.args.supporter) {
            uniqueStakers.add(log.args.supporter)
          }
        })

        // Fetch stake position for each staker
        const stakerDataPromises = Array.from(uniqueStakers).map(async (stakerAddress) => {
          try {
            const stakePosition = await publicClient.readContract({
              address: contracts.campaignRegistry!,
              abi: CAMPAIGN_REGISTRY_ABI,
              functionName: 'getStakePosition',
              args: [campaignId, stakerAddress],
            })

            if (!Array.isArray(stakePosition)) return null

            const shares = (stakePosition[0] as bigint) || 0n

            // Skip if no shares
            if (shares === 0n) return null

            const votingPowerPercent =
              totalStaked > 0n ? (Number(shares) / Number(totalStaked)) * 100 : 0

            return {
              address: stakerAddress,
              shares,
              votingPowerPercent,
            } as Staker
          } catch (err) {
            console.warn(`Failed to fetch stake position for ${stakerAddress}:`, err)
            return null
          }
        })

        const stakerData = (await Promise.all(stakerDataPromises)).filter(
          (s): s is Staker => s !== null
        )

        // Sort by shares (descending)
        const sortedStakers = stakerData.sort((a, b) => {
          if (a.shares > b.shares) return -1
          if (a.shares < b.shares) return 1
          return 0
        })

        // Add rank
        const stakersWithRank = sortedStakers.map((staker, index) => ({
          ...staker,
          rank: index + 1,
        }))

        setStakers(stakersWithRank)
      } catch (err) {
        console.error('Failed to fetch stakers:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchStakers()
  }, [publicClient, campaignId, contracts?.campaignRegistry, totalStaked])

  // Get top N stakers
  const getTopStakers = (count: number = 10) => {
    return stakers.slice(0, count)
  }

  // Find user rank
  const getUserRank = (userAddress?: Address) => {
    if (!userAddress) return null
    const userStaker = stakers.find((s) => s.address.toLowerCase() === userAddress.toLowerCase())
    return userStaker?.rank || null
  }

  return {
    stakers,
    totalStakers: stakers.length as number,
    topStakers: getTopStakers(10),
    getTopStakers,
    getUserRank,
    isLoading,
    error,
    totalStaked,
  }
}

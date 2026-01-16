import { useMemo, useCallback } from 'react'
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBlockNumber,
} from 'wagmi'
import { type Address, formatUnits } from 'viem'
import { CAMPAIGN_REGISTRY_ABI } from '@/lib/abi'
import { getContracts } from '@/config/contracts'
import { baseSepolia, ethereumSepolia } from '@/config/chains'

export interface CheckpointData {
  windowStart: bigint
  windowEnd: bigint
  executionDeadline: bigint
  quorumBps: number
  status: number
  totalEligibleStake: bigint
}

export interface StakePosition {
  shares: bigint
  escrow: bigint
  pendingWithdrawal: bigint
  lockedUntil: bigint
  lastUpdated: bigint
  requestedExit: boolean
  exists: boolean
  stakeTimestamp: bigint
}

/**
 * Hook for checkpoint voting functionality
 * Provides read and write operations for checkpoint governance
 */
export function useCheckpointVoting(
  campaignId: `0x${string}` | undefined,
  checkpointIndex?: number,
  chainId?: number
) {
  const supportedChainId =
    chainId === baseSepolia.id || chainId === ethereumSepolia.id ? chainId : ethereumSepolia.id

  const contracts = getContracts(supportedChainId)

  // Get checkpoint data
  const {
    data: checkpointData,
    refetch: refetchCheckpoint,
    isLoading: isCheckpointLoading,
  } = useReadContract({
    address: contracts?.campaignRegistry,
    abi: CAMPAIGN_REGISTRY_ABI,
    functionName: 'getCheckpoint',
    args:
      campaignId && checkpointIndex !== undefined
        ? [campaignId, BigInt(checkpointIndex)]
        : undefined,
    chainId: supportedChainId,
    query: {
      enabled:
        !!contracts?.campaignRegistry &&
        !!campaignId &&
        checkpointIndex !== undefined &&
        checkpointIndex >= 0,
    },
  })

  // Parse checkpoint data
  const checkpoint = useMemo(() => {
    if (!checkpointData || !Array.isArray(checkpointData)) return null

    return {
      windowStart: checkpointData[0] as bigint,
      windowEnd: checkpointData[1] as bigint,
      executionDeadline: checkpointData[2] as bigint,
      quorumBps: checkpointData[3] as number,
      status: checkpointData[4] as number,
      totalEligibleStake: checkpointData[5] as bigint,
    } as CheckpointData
  }, [checkpointData])

  // Get user's stake position to calculate voting power
  const useGetUserVotingPower = (userAddress?: Address) => {
    const {
      data: stakeData,
      refetch,
      isLoading,
    } = useReadContract({
      address: contracts?.campaignRegistry,
      abi: CAMPAIGN_REGISTRY_ABI,
      functionName: 'getStakePosition',
      args: campaignId && userAddress ? [campaignId, userAddress] : undefined,
      chainId: supportedChainId,
      query: {
        enabled: !!contracts?.campaignRegistry && !!campaignId && !!userAddress,
      },
    })

    const votingPower = useMemo(() => {
      if (!stakeData || !Array.isArray(stakeData)) return 0n
      return (stakeData[0] as bigint) || 0n // shares = voting power
    }, [stakeData])

    const votingPowerPercent = useMemo(() => {
      if (!checkpoint?.totalEligibleStake || checkpoint.totalEligibleStake === 0n) return 0
      return (Number(votingPower) / Number(checkpoint.totalEligibleStake)) * 100
    }, [votingPower, checkpoint])

    return {
      votingPower,
      votingPowerPercent,
      refetch,
      isLoading,
    }
  }

  // Vote on checkpoint (write function)
  const {
    writeContract: voteWrite,
    data: voteHash,
    isPending: isVotePending,
    error: voteError,
  } = useWriteContract()

  const {
    isLoading: isVoteConfirming,
    isSuccess: isVoteConfirmed,
    error: voteReceiptError,
  } = useWaitForTransactionReceipt({
    hash: voteHash,
  })

  const voteOnCheckpoint = useCallback(
    (support: boolean) => {
      if (!contracts?.campaignRegistry || !campaignId || checkpointIndex === undefined) {
        throw new Error('Missing required parameters for voting')
      }

      voteWrite({
        address: contracts.campaignRegistry,
        abi: CAMPAIGN_REGISTRY_ABI,
        functionName: 'voteOnCheckpoint',
        args: [campaignId, BigInt(checkpointIndex), support],
      })
    },
    [contracts?.campaignRegistry, campaignId, checkpointIndex, voteWrite]
  )

  // Helper to calculate quorum status
  const calculateQuorumStatus = useCallback(
    (votesFor: bigint) => {
      if (!checkpoint) return { reached: false, percentOfQuorum: 0, requiredVotes: 0n }

      const quorumRequired = (checkpoint.totalEligibleStake * BigInt(checkpoint.quorumBps)) / 10000n
      const reached = votesFor >= quorumRequired
      const percentOfQuorum =
        quorumRequired > 0n ? (Number(votesFor) / Number(quorumRequired)) * 100 : 0

      return {
        reached,
        percentOfQuorum,
        requiredVotes: quorumRequired,
      }
    },
    [checkpoint]
  )

  // Helper to check if voting is active
  const isVotingActive = useMemo(() => {
    if (!checkpoint) return false

    const now = BigInt(Math.floor(Date.now() / 1000))
    return (
      checkpoint.status === 1 && // VotingActive status
      now >= checkpoint.windowStart &&
      now <= checkpoint.windowEnd
    )
  }, [checkpoint])

  // Helper to get time remaining
  const timeRemaining = useMemo(() => {
    if (!checkpoint || !isVotingActive) return 0

    const now = Math.floor(Date.now() / 1000)
    const end = Number(checkpoint.windowEnd)
    return Math.max(0, end - now)
  }, [checkpoint, isVotingActive])

  return {
    // Checkpoint data
    checkpoint,
    isCheckpointLoading,
    refetchCheckpoint,

    // Voting power hook
    useGetUserVotingPower,

    // Vote actions
    voteOnCheckpoint,
    isVotePending,
    isVoteConfirming,
    isVoteConfirmed,
    voteError: voteError || voteReceiptError,
    voteHash,

    // Helper functions
    calculateQuorumStatus,
    isVotingActive,
    timeRemaining,
  }
}

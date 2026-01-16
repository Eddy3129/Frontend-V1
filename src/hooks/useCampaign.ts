import { useCallback, useRef, useMemo } from 'react'
import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  useConnection,
} from 'wagmi'
import { keccak256, toHex, type Address, type Abi } from 'viem'
import { CAMPAIGN_REGISTRY_ABI, CAMPAIGN_VAULT_FACTORY_ABI } from '@/lib/abi'
import { getContracts } from '@/config/contracts'
import { baseSepolia, ethereumSepolia } from '@/config/chains'

// Campaign status enum matching the contract
export enum CampaignStatus {
  Submitted = 0,
  Approved = 1,
  Rejected = 2,
  Active = 3,
  Paused = 4,
  Cancelled = 5,
  Completed = 6,
  Unknown = 7,
}

// Checkpoint status enum
export enum CheckpointStatus {
  Pending = 0,
  VotingActive = 1,
  Approved = 2,
  Rejected = 3,
}

export interface Checkpoint {
  targetAmount: bigint
  description: string
  status: CheckpointStatus
  votingStart: bigint
  votingEnd: bigint
  approvalVotes: bigint
  rejectionVotes: bigint
}

// Campaign config from contract
export interface CampaignConfig {
  id: `0x${string}`
  proposer: Address
  curator: Address
  payoutRecipient: Address
  vault: Address
  strategyId: `0x${string}`
  metadataHash: `0x${string}`
  targetStake: bigint
  minStake: bigint
  totalStaked: bigint
  lockedStake: bigint
  initialDeposit: bigint
  fundraisingStart: bigint
  fundraisingEnd: bigint
  createdAt: bigint
  updatedAt: bigint
  status: CampaignStatus
  lockProfile: `0x${string}`
  checkpointQuorumBps: number
  checkpointVotingDelay: bigint
  checkpointVotingPeriod: bigint
  exists: boolean
  payoutsHalted: boolean
}

// Campaign input for submitCampaign
export interface CampaignInput {
  id: `0x${string}`
  payoutRecipient: Address
  strategyId: `0x${string}`
  metadataHash: `0x${string}`
  metadataCID: string
  targetStake: bigint
  minStake: bigint
  fundraisingStart: bigint
  fundraisingEnd: bigint
}

export function useCampaign() {
  const { address: userAddress, chainId: walletChainId } = useConnection()

  // Fetch from BOTH chains - no wallet required!
  const ethereumContracts = getContracts(ethereumSepolia.id)
  const baseContracts = getContracts(baseSepolia.id)

  // Get campaign IDs from Ethereum Sepolia
  const { data: campaignIdsDataEth, refetch: refetchCountEth } = useReadContract({
    address: ethereumContracts?.campaignRegistry,
    abi: CAMPAIGN_REGISTRY_ABI,
    functionName: 'listCampaignIds',
    chainId: ethereumSepolia.id,
    query: {
      enabled: !!ethereumContracts?.campaignRegistry && ethereumContracts.campaignRegistry !== '0x',
    },
  })

  // Get campaign IDs from Base Sepolia
  const { data: campaignIdsDataBase, refetch: refetchCountBase } = useReadContract({
    address: baseContracts?.campaignRegistry,
    abi: CAMPAIGN_REGISTRY_ABI,
    functionName: 'listCampaignIds',
    chainId: baseSepolia.id,
    query: {
      enabled: !!baseContracts?.campaignRegistry && baseContracts.campaignRegistry !== '0x',
    },
  })

  // Merge campaign IDs from both chains
  const campaignIds = useMemo(() => {
    const ethIds = (campaignIdsDataEth as `0x${string}`[] | undefined) || []
    const baseIds = (campaignIdsDataBase as `0x${string}`[] | undefined) || []
    return [...ethIds, ...baseIds]
  }, [campaignIdsDataEth, campaignIdsDataBase])

  const campaignCount = BigInt(campaignIds.length)

  const refetchCount = async () => {
    await Promise.all([refetchCountEth(), refetchCountBase()])
  }

  // For backward compatibility, use the first chain that has a registry
  const registryAddress = ethereumContracts?.campaignRegistry || baseContracts?.campaignRegistry

  // Read minimum submission deposit (from Ethereum Sepolia, or fallback to Base)
  const { data: minDepositEth } = useReadContract({
    address: ethereumContracts?.campaignRegistry,
    abi: CAMPAIGN_REGISTRY_ABI,
    functionName: 'MIN_SUBMISSION_DEPOSIT',
    chainId: ethereumSepolia.id,
    query: {
      enabled: !!ethereumContracts?.campaignRegistry && ethereumContracts.campaignRegistry !== '0x',
    },
  })

  const { data: minDepositBase } = useReadContract({
    address: baseContracts?.campaignRegistry,
    abi: CAMPAIGN_REGISTRY_ABI,
    functionName: 'MIN_SUBMISSION_DEPOSIT',
    chainId: baseSepolia.id,
    query: {
      enabled: !!baseContracts?.campaignRegistry && baseContracts.campaignRegistry !== '0x',
    },
  })

  const minDeposit = minDepositEth || minDepositBase

  // Get campaign by ID - queries both chains and returns chainId where found
  const useGetCampaign = (campaignId: `0x${string}` | undefined) => {
    // Query both chains in parallel
    const results = useReadContracts({
      contracts: [
        {
          address: ethereumContracts?.campaignRegistry,
          abi: CAMPAIGN_REGISTRY_ABI as Abi,
          functionName: 'getCampaign',
          args: campaignId ? [campaignId] : undefined,
          chainId: ethereumSepolia.id,
        },
        {
          address: baseContracts?.campaignRegistry,
          abi: CAMPAIGN_REGISTRY_ABI as Abi,
          functionName: 'getCampaign',
          args: campaignId ? [campaignId] : undefined,
          chainId: baseSepolia.id,
        },
      ],
      query: {
        enabled:
          !!campaignId &&
          (!!ethereumContracts?.campaignRegistry || !!baseContracts?.campaignRegistry),
        select: (data) => {
          // Find which chain has the campaign (check if exists field is true)
          const ethResult = data[0]?.result as CampaignConfig | undefined
          const baseResult = data[1]?.result as CampaignConfig | undefined

          // Return campaign data and chainId where it exists
          if (ethResult?.exists) {
            return { campaign: ethResult, chainId: ethereumSepolia.id }
          } else if (baseResult?.exists) {
            return { campaign: baseResult, chainId: baseSepolia.id }
          }
          return { campaign: undefined, chainId: undefined }
        },
      },
    })

    return results
  }

  // Get all campaigns (fetches details for all IDs)
  const useGetCampaigns = (offset: number, limit: number) => {
    // Note: offset/limit ignored for now as we fetch all via multicall
    // In a real app with many campaigns, we'd slice the IDs array

    const idsToFetch = campaignIds ? [...campaignIds].reverse() : [] // Newest first

    return useReadContracts({
      contracts: idsToFetch.map((id) => ({
        address: registryAddress,
        abi: CAMPAIGN_REGISTRY_ABI as Abi,
        functionName: 'getCampaign',
        args: [id],
        chainId: ethereumSepolia.id, // TODO: Could enhance to fetch from both chains
      })),
      query: {
        enabled: !!registryAddress && registryAddress !== '0x' && idsToFetch.length > 0,
        select: (data) => data.map((d) => d.result as CampaignConfig).filter(Boolean),
      },
    })
  }

  // Get active campaigns (client-side filtering)
  const useGetActiveCampaigns = () => {
    const { data: allCampaigns } = useGetCampaigns(0, 100)
    return {
      data: allCampaigns?.filter(
        (c) => c.status === CampaignStatus.Active || c.status === CampaignStatus.Approved
      ),
      isLoading: !allCampaigns,
    }
  }

  // In-memory cache for metadata CIDs to prevent repeated API calls
  const metadataCIDCache = useRef<Map<string, string | null>>(new Map())
  const pendingRequests = useRef<Map<string, Promise<string | null>>>(new Map())

  // Fetch metadata CID from API (stored during campaign submission)
  // Uses caching to prevent repeated calls
  const getMetadataCID = useCallback(async (campaignId: `0x${string}`): Promise<string | null> => {
    // Check cache first
    if (metadataCIDCache.current.has(campaignId)) {
      return metadataCIDCache.current.get(campaignId) ?? null
    }

    // Check if there's already a pending request for this campaign
    if (pendingRequests.current.has(campaignId)) {
      return pendingRequests.current.get(campaignId) ?? null
    }

    // Create a new request
    const request = (async () => {
      try {
        const response = await fetch(`/api/campaign/cid?campaignId=${campaignId}`)
        if (response.ok) {
          const data = await response.json()
          const cid = data.cid
          metadataCIDCache.current.set(campaignId, cid)
          return cid
        }
        metadataCIDCache.current.set(campaignId, null)
        return null
      } catch (error) {
        console.error('Failed to fetch metadata CID:', error)
        metadataCIDCache.current.set(campaignId, null)
        return null
      } finally {
        pendingRequests.current.delete(campaignId)
      }
    })()

    pendingRequests.current.set(campaignId, request)
    return request
  }, [])

  // Store metadata CID mapping (call after campaign submission)
  const storeMetadataCID = async (campaignId: `0x${string}`, cid: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/campaign/cid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, cid }),
      })
      return response.ok
    } catch (error) {
      console.error('Failed to store metadata CID:', error)
      return false
    }
  }

  // Get checkpoint
  const useGetCheckpoint = (campaignId: `0x${string}` | undefined, checkpointIndex: number) => {
    return useReadContract({
      address: registryAddress,
      abi: CAMPAIGN_REGISTRY_ABI,
      functionName: 'getCheckpoint',
      args: campaignId ? [campaignId, checkpointIndex] : undefined,
      query: {
        enabled: !!registryAddress && registryAddress !== '0x' && !!campaignId,
      },
    })
  }

  // Get user's stake weight for a campaign
  const useGetStakeWeight = (campaignId: `0x${string}` | undefined, user?: Address) => {
    return useReadContract({
      address: registryAddress,
      abi: CAMPAIGN_REGISTRY_ABI,
      functionName: 'getStakeWeight',
      args: campaignId ? [campaignId, user ?? userAddress!] : undefined,
      query: {
        enabled:
          !!registryAddress && registryAddress !== '0x' && !!campaignId && !!(user ?? userAddress),
      },
    })
  }

  // Check if user has voted on checkpoint
  const useHasVoted = (
    campaignId: `0x${string}` | undefined,
    checkpointIndex: number,
    user?: Address
  ) => {
    return useReadContract({
      address: registryAddress,
      abi: CAMPAIGN_REGISTRY_ABI,
      functionName: 'hasVotedOnCheckpoint',
      args: campaignId ? [campaignId, checkpointIndex, user ?? userAddress!] : undefined,
      query: {
        enabled:
          !!registryAddress && registryAddress !== '0x' && !!campaignId && !!(user ?? userAddress),
      },
    })
  }

  // Write: Submit new campaign
  const {
    writeContractAsync: submitCampaignWriteAsync,
    data: submitHash,
    isPending: isSubmitPending,
    error: submitError,
  } = useWriteContract()

  const {
    data: submitReceipt,
    isLoading: isSubmitConfirming,
    isSuccess: isSubmitConfirmed,
  } = useWaitForTransactionReceipt({ hash: submitHash })

  interface SubmitCampaignParams {
    payoutRecipient: Address
    strategyId: `0x${string}`
    metadataCID: string // IPFS CID
    targetStake: bigint // In USDC (6 decimals)
    minStake: bigint // Minimum stake amount
    fundraisingStart: bigint // Unix timestamp
    fundraisingEnd: bigint // Unix timestamp
  }

  const submitCampaign = async (params: SubmitCampaignParams, depositAmount?: bigint) => {
    if (!registryAddress) throw new Error('Registry address not found')

    // Generate campaign ID from metadata CID
    const campaignId = keccak256(toHex(params.metadataCID))
    // Generate metadata hash from CID
    const metadataHash = keccak256(toHex(params.metadataCID))

    // Store the CID mapping before submitting (so it's available immediately)
    await storeMetadataCID(campaignId, params.metadataCID)

    // Create tuple for the struct to ensure correct order and format
    // Struct: (id, payoutRecipient, strategyId, metadataHash, metadataCID, targetStake, minStake, fundraisingStart, fundraisingEnd)
    const inputTuple = [
      campaignId,
      params.payoutRecipient,
      params.strategyId,
      metadataHash,
      params.metadataCID,
      params.targetStake,
      params.minStake,
      params.fundraisingStart,
      params.fundraisingEnd,
    ] as const

    // Use provided deposit or minimum deposit
    const deposit = depositAmount ?? minDeposit ?? BigInt(0)

    const hash = await submitCampaignWriteAsync({
      address: registryAddress,
      abi: CAMPAIGN_REGISTRY_ABI,
      functionName: 'submitCampaign',
      args: [inputTuple],
      // @ts-expect-error wagmi doesn't infer payable from JSON ABI
      value: deposit,
    })

    return { hash, campaignId }
  }

  // Write: Approve campaign (admin only)
  const {
    writeContract: approveCampaignWrite,
    data: approveCampaignHash,
    isPending: isApproveCampaignPending,
    error: approveCampaignError,
  } = useWriteContract()

  const { isLoading: isApproveCampaignConfirming, isSuccess: isApproveCampaignConfirmed } =
    useWaitForTransactionReceipt({ hash: approveCampaignHash })

  const approveCampaign = (campaignId: `0x${string}`, curator: Address) => {
    if (!registryAddress) return

    approveCampaignWrite({
      address: registryAddress,
      abi: CAMPAIGN_REGISTRY_ABI,
      functionName: 'approveCampaign',
      args: [campaignId, curator],
    })
  }

  // Write: Reject campaign (admin only)
  const {
    writeContract: rejectCampaignWrite,
    data: rejectCampaignHash,
    isPending: isRejectCampaignPending,
    error: rejectCampaignError,
  } = useWriteContract()

  const { isLoading: isRejectCampaignConfirming, isSuccess: isRejectCampaignConfirmed } =
    useWaitForTransactionReceipt({ hash: rejectCampaignHash })

  const rejectCampaign = (campaignId: `0x${string}`, reason: string) => {
    if (!registryAddress) return

    rejectCampaignWrite({
      address: registryAddress,
      abi: CAMPAIGN_REGISTRY_ABI,
      functionName: 'rejectCampaign',
      args: [campaignId, reason],
    })
  }

  // Write: Vote on checkpoint
  const {
    writeContract: voteWrite,
    data: voteHash,
    isPending: isVotePending,
    error: voteError,
  } = useWriteContract()

  const { isLoading: isVoteConfirming, isSuccess: isVoteConfirmed } = useWaitForTransactionReceipt({
    hash: voteHash,
  })

  const voteOnCheckpoint = (
    campaignId: `0x${string}`,
    checkpointIndex: number,
    approve: boolean
  ) => {
    if (!registryAddress) return

    voteWrite({
      address: registryAddress,
      abi: CAMPAIGN_REGISTRY_ABI,
      functionName: 'voteOnCheckpoint',
      args: [campaignId, checkpointIndex, approve],
    })
  }

  // Write: Start checkpoint voting (admin only)
  const {
    writeContract: startVotingWrite,
    data: startVotingHash,
    isPending: isStartVotingPending,
    error: startVotingError,
  } = useWriteContract()

  const { isLoading: isStartVotingConfirming, isSuccess: isStartVotingConfirmed } =
    useWaitForTransactionReceipt({ hash: startVotingHash })

  const startCheckpointVoting = (
    campaignId: `0x${string}`,
    checkpointIndex: number,
    votingDurationDays: number
  ) => {
    if (!registryAddress) return

    const votingDuration = BigInt(votingDurationDays * 24 * 60 * 60)

    startVotingWrite({
      address: registryAddress,
      abi: CAMPAIGN_REGISTRY_ABI,
      functionName: 'startCheckpointVoting',
      args: [campaignId, checkpointIndex, votingDuration],
    })
  }

  // Write: Finalize checkpoint (admin only)
  const {
    writeContract: finalizeWrite,
    data: finalizeHash,
    isPending: isFinalizePending,
    error: finalizeError,
  } = useWriteContract()

  const { isLoading: isFinalizeConfirming, isSuccess: isFinalizeConfirmed } =
    useWaitForTransactionReceipt({ hash: finalizeHash })

  const finalizeCheckpoint = (campaignId: `0x${string}`, checkpointIndex: number) => {
    if (!registryAddress) return

    finalizeWrite({
      address: registryAddress,
      abi: CAMPAIGN_REGISTRY_ABI,
      functionName: 'finalizeCheckpoint',
      args: [campaignId, checkpointIndex],
    })
  }

  // Write: Set campaign status (admin only)
  const {
    writeContract: setCampaignStatusWrite,
    data: setCampaignStatusHash,
    isPending: isSetCampaignStatusPending,
    error: setCampaignStatusError,
  } = useWriteContract()

  const { isLoading: isSetCampaignStatusConfirming, isSuccess: isSetCampaignStatusConfirmed } =
    useWaitForTransactionReceipt({ hash: setCampaignStatusHash })

  const setCampaignStatus = (campaignId: `0x${string}`, newStatus: CampaignStatus) => {
    if (!registryAddress) return

    setCampaignStatusWrite({
      address: registryAddress,
      abi: CAMPAIGN_REGISTRY_ABI,
      functionName: 'setCampaignStatus',
      args: [campaignId, newStatus],
    })
  }

  // Write: Deploy campaign vault (admin only)
  const {
    writeContract: deployVaultWrite,
    data: deployVaultHash,
    isPending: isDeployVaultPending,
    error: deployVaultError,
  } = useWriteContract()

  const { isLoading: isDeployVaultConfirming, isSuccess: isDeployVaultConfirmed } =
    useWaitForTransactionReceipt({ hash: deployVaultHash })

  interface DeployVaultParams {
    campaignId: `0x${string}`
    strategyId: `0x${string}`
    asset: Address
    admin: Address
    name: string
    symbol: string
  }

  const deployCampaignVault = (params: DeployVaultParams) => {
    const factoryAddress = ethereumContracts?.campaignVaultFactory
    if (!factoryAddress || factoryAddress === '0x0000000000000000000000000000000000000000') {
      console.error('Factory address not found')
      return
    }

    // Default lock profile (0x0...0)
    const lockProfile = '0x0000000000000000000000000000000000000000000000000000000000000000'

    // Tuple: (campaignId, strategyId, lockProfile, asset, admin, name, symbol)
    const argsTuple = [
      params.campaignId,
      params.strategyId,
      lockProfile,
      params.asset,
      params.admin,
      params.name,
      params.symbol,
    ] as const

    deployVaultWrite({
      address: factoryAddress,
      abi: CAMPAIGN_VAULT_FACTORY_ABI,
      functionName: 'deployCampaignVault',
      args: [argsTuple],
    })
  }

  // Activate campaign helper (sets status to Active)
  const activateCampaign = (campaignId: `0x${string}`) => {
    setCampaignStatus(campaignId, CampaignStatus.Active)
  }

  return {
    // Address
    registryAddress,

    // Read data
    campaignCount: campaignCount as bigint | undefined,
    minDeposit: minDeposit as bigint | undefined,

    // Read hooks
    useGetCampaign,
    useGetCampaigns,
    useGetActiveCampaigns,
    useGetCheckpoint,
    useGetStakeWeight,
    useHasVoted,

    // Submit campaign
    submitCampaign,
    isSubmitPending,
    isSubmitConfirming,
    isSubmitConfirmed,
    submitError,
    submitHash,
    submitReceipt,

    // Approve campaign (admin)
    approveCampaign,
    isApproveCampaignPending,
    isApproveCampaignConfirming,
    isApproveCampaignConfirmed,
    approveCampaignError,
    approveCampaignHash,

    // Reject campaign (admin)
    rejectCampaign,
    isRejectCampaignPending,
    isRejectCampaignConfirming,
    isRejectCampaignConfirmed,
    rejectCampaignError,
    rejectCampaignHash,

    // Vote on checkpoint
    voteOnCheckpoint,
    isVotePending,
    isVoteConfirming,
    isVoteConfirmed,
    voteError,
    voteHash,

    // Start voting (admin)
    startCheckpointVoting,
    isStartVotingPending,
    isStartVotingConfirming,
    isStartVotingConfirmed,
    startVotingError,
    startVotingHash,

    // Finalize checkpoint (admin)
    finalizeCheckpoint,
    isFinalizePending,
    isFinalizeConfirming,
    isFinalizeConfirmed,
    finalizeError,
    finalizeHash,

    // Set campaign status (admin)
    setCampaignStatus,
    activateCampaign,
    isSetCampaignStatusPending,
    isSetCampaignStatusConfirming,
    isSetCampaignStatusConfirmed,
    setCampaignStatusError,
    setCampaignStatusHash,

    // Deploy Vault (admin)
    deployCampaignVault,
    isDeployVaultPending,
    isDeployVaultConfirming,
    isDeployVaultConfirmed,
    deployVaultError,
    deployVaultHash,

    // Metadata
    getMetadataCID,
    storeMetadataCID,

    // Refetch
    refetchCount,
    campaignIds,
  }
}

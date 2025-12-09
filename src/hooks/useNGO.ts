import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { keccak256, toHex, type Address } from 'viem'
import { NGO_REGISTRY_ABI } from '@/lib/abi'
import { getContracts } from '@/config/contracts'
import { baseSepolia } from '@/config/chains'

export enum NGOStatus {
  Pending = 0,
  Active = 1,
  Suspended = 2,
  Removed = 3,
}

export interface NGOInfo {
  metadataCid: string
  kycHash: `0x${string}`
  attestor: Address
  createdAt: bigint
  updatedAt: bigint
  version: bigint
  totalReceived: bigint
  isActive: boolean
}

// Legacy interface for backward compatibility
export interface NGO {
  id: bigint
  name: string
  metadataURI: string
  wallet: Address
  status: NGOStatus
  registeredAt: bigint
}

export function useNGO() {
  const { address: userAddress, chainId } = useAccount()
  // Default to baseSepolia if chainId not available (for non-connected users)
  const activeChainId = chainId ?? baseSepolia.id
  const contracts = getContracts(activeChainId)
  const registryAddress = contracts?.ngoRegistry

  // Get approved NGOs list - works even without wallet connection
  const {
    data: approvedNGOs,
    refetch: refetchApprovedNGOs,
    isLoading: isApprovedNGOsLoading,
    isFetched: isApprovedNGOsFetched,
  } = useReadContract({
    address: registryAddress,
    abi: NGO_REGISTRY_ABI,
    functionName: 'approvedNGOs',
    query: {
      enabled: !!registryAddress && registryAddress !== '0x',
    },
  })

  // Get current NGO (for payout routing)
  const { data: currentNGO, refetch: refetchCurrentNGO } = useReadContract({
    address: registryAddress,
    abi: NGO_REGISTRY_ABI,
    functionName: 'currentNGO',
    query: {
      enabled: !!registryAddress && registryAddress !== '0x',
    },
  })

  // Check if address is approved NGO
  const useIsApproved = (ngoAddress?: Address) => {
    return useReadContract({
      address: registryAddress,
      abi: NGO_REGISTRY_ABI,
      functionName: 'isApproved',
      args: [ngoAddress ?? userAddress!],
      query: {
        enabled: !!registryAddress && registryAddress !== '0x' && !!(ngoAddress ?? userAddress),
      },
    })
  }

  // Get NGO info by address
  const useGetNGOInfo = (ngoAddress?: Address) => {
    return useReadContract({
      address: registryAddress,
      abi: NGO_REGISTRY_ABI,
      functionName: 'ngoInfo',
      args: [ngoAddress ?? userAddress!],
      query: {
        enabled: !!registryAddress && registryAddress !== '0x' && !!(ngoAddress ?? userAddress),
        select: (data: unknown) => {
          const typedData = data as readonly [
            string,
            string,
            Address,
            bigint,
            bigint,
            bigint,
            bigint,
            boolean,
          ]
          // Handle array return from contract
          if (Array.isArray(typedData)) {
            return {
              metadataCid: typedData[0],
              kycHash: typedData[1],
              attestor: typedData[2],
              createdAt: typedData[3],
              updatedAt: typedData[4],
              version: typedData[5],
              totalReceived: typedData[6],
              isActive: typedData[7],
            }
          }
          return typedData as unknown as NGOInfo
        },
      },
    })
  }

  // Legacy: Get NGO count (for backward compatibility with NGO list)
  const ngoCount = Array.isArray(approvedNGOs) ? BigInt(approvedNGOs.length) : BigInt(0)

  // Legacy: Get active NGOs
  const useGetActiveNGOs = () => {
    return useReadContract({
      address: registryAddress,
      abi: NGO_REGISTRY_ABI,
      functionName: 'approvedNGOs',
      query: {
        enabled: !!registryAddress && registryAddress !== '0x',
      },
    })
  }

  // Legacy: useGetNGO - fetch info for a specific NGO by index
  const useGetNGO = (ngoId: bigint) => {
    const ngos = approvedNGOs as Address[] | undefined
    const ngoAddress = ngos?.[Number(ngoId)]

    return useReadContract({
      address: registryAddress,
      abi: NGO_REGISTRY_ABI,
      functionName: 'ngoInfo',
      args: ngoAddress ? [ngoAddress] : undefined,
      query: {
        enabled: !!registryAddress && registryAddress !== '0x' && !!ngoAddress,
      },
    })
  }

  // Legacy: Check if user is verified NGO
  const useIsVerifiedNGO = (address?: Address) => {
    return useIsApproved(address)
  }

  // Legacy: Get NGO by wallet
  const useGetNGOByWallet = (wallet?: Address) => {
    return useGetNGOInfo(wallet)
  }

  // Write: Add NGO (admin only - NGO_MANAGER_ROLE required)
  const {
    writeContract: addNGOWrite,
    data: addNGOHash,
    isPending: isAddNGOPending,
    error: addNGOError,
    reset: resetAddNGO,
  } = useWriteContract()

  const { isLoading: isAddNGOConfirming, isSuccess: isAddNGOConfirmed } =
    useWaitForTransactionReceipt({ hash: addNGOHash })

  interface AddNGOParams {
    ngoAddress: Address
    metadataCid: string
    kycHash?: `0x${string}` // Optional - hash of KYC documents
    attestor: Address // Required - address that attested the KYC (cannot be zero address!)
    onError?: (error: Error) => void // Callback for immediate error handling
  }

  const addNGO = (params: AddNGOParams) => {
    if (!registryAddress) return
    if (!params.attestor || params.attestor === '0x0000000000000000000000000000000000000000') {
      params.onError?.(new Error('Attestor address is required and cannot be zero address'))
      return
    }

    // Generate KYC hash from metadata CID if not provided
    const kycHash = params.kycHash ?? keccak256(toHex(params.metadataCid))
    const attestor = params.attestor

    addNGOWrite(
      {
        address: registryAddress,
        abi: NGO_REGISTRY_ABI,
        functionName: 'addNGO',
        args: [params.ngoAddress, params.metadataCid, kycHash, attestor],
      },
      {
        onError: (error) => {
          params.onError?.(error)
        },
      }
    )
  }

  // Write: Update NGO (admin only)
  const {
    writeContract: updateNGOWrite,
    data: updateNGOHash,
    isPending: isUpdateNGOPending,
    error: updateNGOError,
  } = useWriteContract()

  const { isLoading: isUpdateNGOConfirming, isSuccess: isUpdateNGOConfirmed } =
    useWaitForTransactionReceipt({ hash: updateNGOHash })

  interface UpdateNGOParams {
    ngoAddress: Address
    newMetadataCid: string
    newKycHash?: `0x${string}`
  }

  const updateNGO = (params: UpdateNGOParams) => {
    if (!registryAddress) return

    const newKycHash = params.newKycHash ?? keccak256(toHex(params.newMetadataCid))

    updateNGOWrite({
      address: registryAddress,
      abi: NGO_REGISTRY_ABI,
      functionName: 'updateNGO',
      args: [params.ngoAddress, params.newMetadataCid, newKycHash],
    })
  }

  // Write: Remove NGO (admin only)
  const {
    writeContract: removeNGOWrite,
    data: removeNGOHash,
    isPending: isRemoveNGOPending,
    error: removeNGOError,
  } = useWriteContract()

  const { isLoading: isRemoveNGOConfirming, isSuccess: isRemoveNGOConfirmed } =
    useWaitForTransactionReceipt({ hash: removeNGOHash })

  const removeNGO = (ngoAddress: Address) => {
    if (!registryAddress) return

    removeNGOWrite({
      address: registryAddress,
      abi: NGO_REGISTRY_ABI,
      functionName: 'removeNGO',
      args: [ngoAddress],
    })
  }

  // Write: Propose current NGO change (admin only - timelock)
  const {
    writeContract: proposeCurrentNGOWrite,
    data: proposeHash,
    isPending: isProposePending,
    error: proposeError,
  } = useWriteContract()

  const { isLoading: isProposeConfirming, isSuccess: isProposeConfirmed } =
    useWaitForTransactionReceipt({ hash: proposeHash })

  const proposeCurrentNGO = (ngoAddress: Address) => {
    if (!registryAddress) return

    proposeCurrentNGOWrite({
      address: registryAddress,
      abi: NGO_REGISTRY_ABI,
      functionName: 'proposeCurrentNGO',
      args: [ngoAddress],
    })
  }

  return {
    // Address
    registryAddress,

    // Read data
    ngoCount,
    approvedNGOs: approvedNGOs as Address[] | undefined,
    isApprovedNGOsLoading,
    isApprovedNGOsFetched,
    currentNGO: currentNGO as Address | undefined,

    // Read hooks
    useGetNGO,
    useGetActiveNGOs,
    useIsVerifiedNGO,
    useGetNGOByWallet,
    useIsApproved,
    useGetNGOInfo,

    // Add NGO (admin)
    addNGO,
    isAddNGOPending,
    isAddNGOConfirming,
    isAddNGOConfirmed,
    addNGOError,
    addNGOHash,
    resetAddNGO,

    // Update NGO (admin)
    updateNGO,
    isUpdateNGOPending,
    isUpdateNGOConfirming,
    isUpdateNGOConfirmed,
    updateNGOError,
    updateNGOHash,

    // Remove NGO (admin)
    removeNGO,
    isRemoveNGOPending,
    isRemoveNGOConfirming,
    isRemoveNGOConfirmed,
    removeNGOError,
    removeNGOHash,

    // Propose current NGO
    proposeCurrentNGO,
    isProposePending,
    isProposeConfirming,
    isProposeConfirmed,
    proposeError,
    proposeHash,

    // Refetch
    refetchApprovedNGOs,
    refetchCurrentNGO,
    // Legacy alias
    refetchCount: refetchApprovedNGOs,

    // Legacy aliases
    registerNGO: addNGO,
    isRegisterPending: isAddNGOPending,
    isRegisterConfirming: isAddNGOConfirming,
    isRegisterConfirmed: isAddNGOConfirmed,
    registerError: addNGOError,
    registerHash: addNGOHash,
  }
}

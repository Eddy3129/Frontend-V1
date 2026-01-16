import { useMemo } from 'react'
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useConnection,
} from 'wagmi'
import { keccak256, toHex, type Address } from 'viem'
import { NGO_REGISTRY_ABI } from '@/lib/abi'
import { getContracts } from '@/config/contracts'
import { baseSepolia, ethereumSepolia } from '@/config/chains'

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

export function useNGO() {
  const { address: userAddress, chainId: walletChainId, isConnected } = useConnection()

  // Fetch from BOTH chains - no wallet required!
  const ethereumContracts = getContracts(ethereumSepolia.id)
  const baseContracts = getContracts(baseSepolia.id)

  // Get approved NGOs from Ethereum Sepolia
  const {
    data: approvedNGOsEth,
    refetch: refetchEth,
    isLoading: isLoadingEth,
  } = useReadContract({
    address: ethereumContracts?.ngoRegistry,
    abi: NGO_REGISTRY_ABI,
    functionName: 'approvedNGOs',
    chainId: ethereumSepolia.id,
    query: {
      enabled: !!ethereumContracts?.ngoRegistry && ethereumContracts.ngoRegistry !== '0x',
    },
  })

  // Get approved NGOs from Base Sepolia
  const {
    data: approvedNGOsBase,
    refetch: refetchBase,
    isLoading: isLoadingBase,
  } = useReadContract({
    address: baseContracts?.ngoRegistry,
    abi: NGO_REGISTRY_ABI,
    functionName: 'approvedNGOs',
    chainId: baseSepolia.id,
    query: {
      enabled: !!baseContracts?.ngoRegistry && baseContracts.ngoRegistry !== '0x',
    },
  })

  // Merge NGOs from both chains (deduplicate by address)
  const approvedNGOs = useMemo(() => {
    const ethNGOs = (approvedNGOsEth as Address[] | undefined) || []
    const baseNGOs = (approvedNGOsBase as Address[] | undefined) || []
    const allNGOs = [...ethNGOs, ...baseNGOs]
    // Deduplicate
    return Array.from(new Set(allNGOs))
  }, [approvedNGOsEth, approvedNGOsBase])

  const refetchApprovedNGOs = async () => {
    await Promise.all([refetchEth(), refetchBase()])
  }

  const isApprovedNGOsLoading = isLoadingEth || isLoadingBase
  const isApprovedNGOsFetched = !!approvedNGOsEth || !!approvedNGOsBase

  // For backward compatibility, use the first chain that has a registry
  const registryAddress = ethereumContracts?.ngoRegistry || baseContracts?.ngoRegistry

  // Get current NGO (try Ethereum Sepolia first, fallback to Base)
  const { data: currentNGOEth } = useReadContract({
    address: ethereumContracts?.ngoRegistry,
    abi: NGO_REGISTRY_ABI,
    functionName: 'currentNGO',
    chainId: ethereumSepolia.id,
    query: {
      enabled: !!ethereumContracts?.ngoRegistry && ethereumContracts.ngoRegistry !== '0x',
    },
  })

  const { data: currentNGOBase, refetch: refetchCurrentNGO } = useReadContract({
    address: baseContracts?.ngoRegistry,
    abi: NGO_REGISTRY_ABI,
    functionName: 'currentNGO',
    chainId: baseSepolia.id,
    query: {
      enabled: !!baseContracts?.ngoRegistry && baseContracts.ngoRegistry !== '0x',
    },
  })

  const currentNGO = currentNGOEth || currentNGOBase

  // Check if address is approved NGO (try BOTH chains)
  const useIsApproved = (ngoAddress?: Address) => {
    const { data: isApprovedEth } = useReadContract({
      address: ethereumContracts?.ngoRegistry,
      abi: NGO_REGISTRY_ABI,
      functionName: 'isApproved',
      args: [ngoAddress ?? userAddress!],
      chainId: ethereumSepolia.id,
      query: {
        enabled:
          !!ethereumContracts?.ngoRegistry &&
          ethereumContracts.ngoRegistry !== '0x' &&
          !!(ngoAddress ?? userAddress),
      },
    })

    const { data: isApprovedBase } = useReadContract({
      address: baseContracts?.ngoRegistry,
      abi: NGO_REGISTRY_ABI,
      functionName: 'isApproved',
      args: [ngoAddress ?? userAddress!],
      chainId: baseSepolia.id,
      query: {
        enabled:
          !!baseContracts?.ngoRegistry &&
          baseContracts.ngoRegistry !== '0x' &&
          !!(ngoAddress ?? userAddress),
      },
    })

    // Return object with data being true if approved on EITHER chain
    return {
      data: isApprovedEth || isApprovedBase,
    }
  }

  // Get NGO info by address (try BOTH chains)
  const useGetNGOInfo = (ngoAddress?: Address) => {
    const { data: ngoInfoEth } = useReadContract({
      address: ethereumContracts?.ngoRegistry,
      abi: NGO_REGISTRY_ABI,
      functionName: 'ngoInfo',
      args: [ngoAddress ?? userAddress!],
      chainId: ethereumSepolia.id,
      query: {
        enabled:
          !!ethereumContracts?.ngoRegistry &&
          ethereumContracts.ngoRegistry !== '0x' &&
          !!(ngoAddress ?? userAddress),
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

    const { data: ngoInfoBase } = useReadContract({
      address: baseContracts?.ngoRegistry,
      abi: NGO_REGISTRY_ABI,
      functionName: 'ngoInfo',
      args: [ngoAddress ?? userAddress!],
      chainId: baseSepolia.id,
      query: {
        enabled:
          !!baseContracts?.ngoRegistry &&
          baseContracts.ngoRegistry !== '0x' &&
          !!(ngoAddress ?? userAddress),
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

    // Return first successful result from either chain
    return {
      data: ngoInfoEth || ngoInfoBase,
    }
  }

  // Legacy: Get NGO count (for backward compatibility with NGO list)
  const ngoCount = Array.isArray(approvedNGOs) ? BigInt(approvedNGOs.length) : BigInt(0)

  // Legacy: Get active NGOs (returns merged result from both chains)
  const useGetActiveNGOs = () => {
    return useReadContract({
      address: registryAddress,
      abi: NGO_REGISTRY_ABI,
      functionName: 'approvedNGOs',
      chainId: ethereumSepolia.id, // Use Ethereum Sepolia
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
      chainId: ethereumSepolia.id, // Use Ethereum Sepolia
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

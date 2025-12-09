import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useConnection,
} from 'wagmi'
import { type Address } from 'viem'
import { PAYOUT_ROUTER_ABI } from '@/lib/abi'
import { getContracts } from '@/config/contracts'
import { baseSepolia } from '@/config/chains'

// Valid allocation percentages
export const VALID_ALLOCATIONS = [50, 75, 100] as const
export type AllocationPercent = (typeof VALID_ALLOCATIONS)[number]

export interface UserPreference {
  beneficiary: Address
  allocationPercent: number
  isActive: boolean
}

export function usePayout() {
  const { address: userAddress, chainId } = useConnection()
  const contracts = getContracts(chainId ?? baseSepolia.id)
  const routerAddress = contracts?.payoutRouter
  const vaultAddress = contracts?.usdcVault

  // Read protocol fee (in basis points, e.g., 250 = 2.5%)
  const { data: protocolFeeBps } = useReadContract({
    address: routerAddress,
    abi: PAYOUT_ROUTER_ABI,
    functionName: 'protocolFeeBps',
    query: {
      enabled: !!routerAddress && routerAddress !== '0x',
    },
  })

  // Read pending fee change (if any)
  const { data: pendingFee } = useReadContract({
    address: routerAddress,
    abi: PAYOUT_ROUTER_ABI,
    functionName: 'pendingFeeBps',
    query: {
      enabled: !!routerAddress && routerAddress !== '0x',
    },
  })

  // Read fee change execution time
  const { data: feeChangeTime } = useReadContract({
    address: routerAddress,
    abi: PAYOUT_ROUTER_ABI,
    functionName: 'feeChangeExecutionTime',
    query: {
      enabled: !!routerAddress && routerAddress !== '0x',
    },
  })

  // Get user's preference for the main vault
  const useGetUserPreference = (vault?: Address, user?: Address) => {
    return useReadContract({
      address: routerAddress,
      abi: PAYOUT_ROUTER_ABI,
      functionName: 'getUserPreference',
      args: [vault ?? vaultAddress!, user ?? userAddress!],
      query: {
        enabled:
          !!routerAddress &&
          routerAddress !== '0x' &&
          !!(vault ?? vaultAddress) &&
          !!(user ?? userAddress),
      },
    })
  }

  // Get accumulated yield for user
  const useGetAccumulatedYield = (vault?: Address, user?: Address) => {
    return useReadContract({
      address: routerAddress,
      abi: PAYOUT_ROUTER_ABI,
      functionName: 'getAccumulatedYield',
      args: [vault ?? vaultAddress!, user ?? userAddress!],
      query: {
        enabled:
          !!routerAddress &&
          routerAddress !== '0x' &&
          !!(vault ?? vaultAddress) &&
          !!(user ?? userAddress),
      },
    })
  }

  // Write: Set vault preference
  const {
    writeContract: setPreferenceWrite,
    data: setPreferenceHash,
    isPending: isSetPreferencePending,
    error: setPreferenceError,
  } = useWriteContract()

  const { isLoading: isSetPreferenceConfirming, isSuccess: isSetPreferenceConfirmed } =
    useWaitForTransactionReceipt({ hash: setPreferenceHash })

  const setVaultPreference = (
    beneficiary: Address,
    allocationPercent: AllocationPercent,
    vault?: Address
  ) => {
    if (!routerAddress) return

    // Validate allocation
    if (!VALID_ALLOCATIONS.includes(allocationPercent)) {
      throw new Error(`Invalid allocation percent. Must be one of: ${VALID_ALLOCATIONS.join(', ')}`)
    }

    setPreferenceWrite({
      address: routerAddress,
      abi: PAYOUT_ROUTER_ABI,
      functionName: 'setVaultPreference',
      args: [vault ?? vaultAddress!, beneficiary, allocationPercent],
    })
  }

  // Write: Clear preference
  const {
    writeContract: clearPreferenceWrite,
    data: clearPreferenceHash,
    isPending: isClearPreferencePending,
    error: clearPreferenceError,
  } = useWriteContract()

  const { isLoading: isClearPreferenceConfirming, isSuccess: isClearPreferenceConfirmed } =
    useWaitForTransactionReceipt({ hash: clearPreferenceHash })

  const clearPreference = (vault?: Address) => {
    if (!routerAddress) return

    clearPreferenceWrite({
      address: routerAddress,
      abi: PAYOUT_ROUTER_ABI,
      functionName: 'clearPreference',
      args: [vault ?? vaultAddress!],
    })
  }

  // Format protocol fee as percentage
  const protocolFeePercent = protocolFeeBps ? (Number(protocolFeeBps) / 100).toFixed(2) : '0'

  return {
    // Address
    routerAddress,

    // Read data
    protocolFeeBps: protocolFeeBps as bigint | undefined,
    protocolFeePercent,
    pendingFee: pendingFee as bigint | undefined,
    feeChangeTime: feeChangeTime as bigint | undefined,

    // Read hooks
    useGetUserPreference,
    useGetAccumulatedYield,

    // Set preference
    setVaultPreference,
    isSetPreferencePending,
    isSetPreferenceConfirming,
    isSetPreferenceConfirmed,
    setPreferenceError,
    setPreferenceHash,

    // Clear preference
    clearPreference,
    isClearPreferencePending,
    isClearPreferenceConfirming,
    isClearPreferenceConfirmed,
    clearPreferenceError,
    clearPreferenceHash,

    // Constants
    validAllocations: VALID_ALLOCATIONS,
  }
}

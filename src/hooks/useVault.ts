import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useConnection,
} from 'wagmi'
import { parseUnits, formatUnits, type Address } from 'viem'
import { GIVE_VAULT_ABI, ERC20_ABI } from '@/lib/abi'
import { getContracts } from '@/config/contracts'
import { baseSepolia } from '@/config/chains'

type SupportedAsset = 'USDC' | 'ETH'

export function useVault(asset: SupportedAsset = 'USDC', customVaultAddress?: Address) {
  const { address: userAddress, chainId } = useConnection()
  const contracts = getContracts(chainId ?? baseSepolia.id)
  const isEth = asset === 'ETH'
  // Use custom vault if provided, otherwise fallback to protocol default
  const vaultAddress = customVaultAddress ?? (isEth ? contracts?.ethVault : contracts?.usdcVault)
  const tokenAddress = isEth ? contracts?.weth : contracts?.usdc
  const tokenDecimals = isEth ? 18 : 6

  // Read total assets in vault
  const { data: totalAssets, refetch: refetchTotalAssets } = useReadContract({
    address: vaultAddress,
    abi: GIVE_VAULT_ABI,
    functionName: 'totalAssets',
    query: {
      enabled: !!vaultAddress && vaultAddress !== '0x',
    },
  })

  // Read total supply of shares
  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: vaultAddress,
    abi: GIVE_VAULT_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!vaultAddress && vaultAddress !== '0x',
    },
  })

  // Read user's vault share balance
  const { data: userShares, refetch: refetchUserShares } = useReadContract({
    address: vaultAddress,
    abi: GIVE_VAULT_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!vaultAddress && vaultAddress !== '0x' && !!userAddress,
    },
  })

  // Read user's token balance
  const { data: userTokenBalance, refetch: refetchUserToken } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!tokenAddress && tokenAddress !== '0x' && !!userAddress,
    },
  })

  // Read allowance for vault (no allowance needed for ETH vault if native path used)
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress && vaultAddress ? [userAddress, vaultAddress] : undefined,
    query: {
      enabled: !!tokenAddress && tokenAddress !== '0x' && !!userAddress && !!vaultAddress && !isEth,
    },
  })

  // Preview deposit (get shares for given assets)
  const usePreviewDeposit = (assets: bigint) => {
    return useReadContract({
      address: vaultAddress,
      abi: GIVE_VAULT_ABI,
      functionName: 'previewDeposit',
      args: [assets],
      query: {
        enabled: !!vaultAddress && vaultAddress !== '0x' && assets > 0n,
      },
    })
  }

  // Preview redeem (get assets for given shares)
  const usePreviewRedeem = (shares: bigint) => {
    return useReadContract({
      address: vaultAddress,
      abi: GIVE_VAULT_ABI,
      functionName: 'previewRedeem',
      args: [shares],
      query: {
        enabled: !!vaultAddress && vaultAddress !== '0x' && shares > 0n,
      },
    })
  }

  // Convert assets to shares
  const useConvertToShares = (assets: bigint) => {
    return useReadContract({
      address: vaultAddress,
      abi: GIVE_VAULT_ABI,
      functionName: 'convertToShares',
      args: [assets],
      query: {
        enabled: !!vaultAddress && vaultAddress !== '0x' && assets > 0n,
      },
    })
  }

  // Convert shares to assets
  const useConvertToAssets = (shares: bigint) => {
    return useReadContract({
      address: vaultAddress,
      abi: GIVE_VAULT_ABI,
      functionName: 'convertToAssets',
      args: [shares],
      query: {
        enabled: !!vaultAddress && vaultAddress !== '0x' && shares > 0n,
      },
    })
  }

  // Write: Approve token spending (ERC20 path; skipped for ETH native path)
  const {
    writeContract: approveUsdc,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract()

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveHash })

  const approve = (amount: string) => {
    if (isEth) return
    if (!tokenAddress || !vaultAddress) return
    const assets = parseUnits(amount, tokenDecimals)
    approveUsdc({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [vaultAddress, assets],
    })
  }

  const approveMax = () => {
    if (isEth) return
    if (!tokenAddress || !vaultAddress) return
    approveUsdc({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [
        vaultAddress,
        BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
      ],
    })
  }

  // Write: Deposit token
  const {
    writeContract: depositWrite,
    data: depositHash,
    isPending: isDepositPendingErc,
    error: depositErrorErc,
  } = useWriteContract()

  const { isLoading: isDepositConfirmingErc, isSuccess: isDepositConfirmedErc } =
    useWaitForTransactionReceipt({ hash: depositHash })

  const deposit = (amount: string, receiver?: Address) => {
    if (!vaultAddress || !userAddress) return
    const assets = parseUnits(amount, tokenDecimals)
    // ETH vault uses payable path (no allowance)
    if (isEth) {
      depositEthWrite({
        address: vaultAddress,
        abi: GIVE_VAULT_ABI,
        functionName: 'depositETH',
        args: [receiver ?? userAddress, 0n],
        // @ts-expect-error wagmi doesn't infer payable from JSON ABI
        value: assets,
      })
      return
    }

    depositWrite({
      address: vaultAddress,
      abi: GIVE_VAULT_ABI,
      functionName: 'deposit',
      args: [assets, receiver ?? userAddress],
    })
  }

  // Write: Deposit ETH (auto-wraps)
  const {
    writeContract: depositEthWrite,
    data: depositEthHash,
    isPending: isDepositEthPending,
    error: depositEthError,
  } = useWriteContract()

  const { isLoading: isDepositEthConfirming, isSuccess: isDepositEthConfirmed } =
    useWaitForTransactionReceipt({ hash: depositEthHash })

  // Legacy helper (unused in ETH flow above but kept for compatibility)
  const depositETH = (amountEth: string, receiver?: Address, minShares?: bigint) => {
    if (!vaultAddress || !userAddress) return
    const value = parseUnits(amountEth, 18)
    depositEthWrite({
      address: vaultAddress,
      abi: GIVE_VAULT_ABI,
      functionName: 'depositETH',
      args: [receiver ?? userAddress, minShares ?? 0n],
      // @ts-expect-error wagmi doesn't infer payable from JSON ABI
      value,
    })
  }

  // Write: Withdraw assets
  const {
    writeContract: withdrawWrite,
    data: withdrawHash,
    isPending: isWithdrawPending,
    error: withdrawError,
  } = useWriteContract()

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawConfirmed } =
    useWaitForTransactionReceipt({ hash: withdrawHash })

  const withdraw = (amount: string, receiver?: Address, owner?: Address) => {
    if (!vaultAddress || !userAddress) return
    const assets = parseUnits(amount, tokenDecimals)
    withdrawWrite({
      address: vaultAddress,
      abi: GIVE_VAULT_ABI,
      functionName: 'withdraw',
      args: [assets, receiver ?? userAddress, owner ?? userAddress],
    })
  }

  // Write: Redeem shares
  const {
    writeContract: redeemWrite,
    data: redeemHash,
    isPending: isRedeemPending,
    error: redeemError,
  } = useWriteContract()

  const { isLoading: isRedeemConfirming, isSuccess: isRedeemConfirmed } =
    useWaitForTransactionReceipt({ hash: redeemHash })

  const redeem = (shares: bigint, receiver?: Address, owner?: Address) => {
    if (!vaultAddress || !userAddress) return
    redeemWrite({
      address: vaultAddress,
      abi: GIVE_VAULT_ABI,
      functionName: 'redeem',
      args: [shares, receiver ?? userAddress, owner ?? userAddress],
    })
  }

  // Refetch all data
  const refetchAll = () => {
    refetchTotalAssets()
    refetchTotalSupply()
    refetchUserShares()
    refetchUserToken()
    refetchAllowance()
  }

  // Formatted values
  const formattedTotalAssets = totalAssets ? formatUnits(totalAssets as bigint, tokenDecimals) : '0'
  const formattedUserShares = userShares ? formatUnits(userShares as bigint, tokenDecimals) : '0'
  const formattedUserUsdc = userTokenBalance
    ? formatUnits(userTokenBalance as bigint, tokenDecimals)
    : '0'
  const formattedAllowance = usdcAllowance
    ? formatUnits(usdcAllowance as bigint, tokenDecimals)
    : '0'

  // Derive user assets from shares (on-chain convertToAssets equivalent)
  const userSharesBig = userShares as bigint | undefined
  const totalAssetsBig = totalAssets as bigint | undefined
  const totalSupplyBig = totalSupply as bigint | undefined
  const userAssets =
    userSharesBig && totalAssetsBig && totalSupplyBig && totalSupplyBig > 0n
      ? (userSharesBig * totalAssetsBig) / totalSupplyBig
      : 0n
  const formattedUserAssets = formatUnits(userAssets, tokenDecimals)

  // Check if user has sufficient allowance
  const hasAllowance = (amount: string) => {
    if (isEth) return true
    if (!usdcAllowance) return false
    const required = parseUnits(amount, tokenDecimals)
    return (usdcAllowance as bigint) >= required
  }

  // Unified deposit state across ERC20 and ETH paths
  const unifiedDepositPending = isDepositPendingErc || isDepositEthPending
  const unifiedDepositConfirming = isDepositConfirmingErc || isDepositEthConfirming
  const unifiedDepositConfirmed = isDepositConfirmedErc || isDepositEthConfirmed
  const unifiedDepositError = depositErrorErc ?? depositEthError

  return {
    // Addresses
    vaultAddress,
    usdcAddress: tokenAddress,
    isEth,

    // Read data
    totalAssets: totalAssets as bigint | undefined,
    totalSupply: totalSupply as bigint | undefined,
    userShares: userShares as bigint | undefined,
    userUsdcBalance: userTokenBalance as bigint | undefined,
    usdcAllowance: usdcAllowance as bigint | undefined,

    // Formatted values
    formattedTotalAssets,
    formattedUserShares,
    formattedUserUsdc,
    formattedUserAssets,
    formattedAllowance,
    userAssets,

    // Preview hooks
    usePreviewDeposit,
    usePreviewRedeem,
    useConvertToShares,
    useConvertToAssets,

    // Approve
    approve,
    approveMax,
    hasAllowance,
    isApprovePending,
    isApproveConfirming,
    isApproveConfirmed,
    approveError,
    approveHash,

    // Deposit
    deposit,
    isDepositPending: unifiedDepositPending,
    isDepositConfirming: unifiedDepositConfirming,
    isDepositConfirmed: unifiedDepositConfirmed,
    depositError: unifiedDepositError,
    depositHash,

    // Withdraw
    withdraw,
    isWithdrawPending,
    isWithdrawConfirming,
    isWithdrawConfirmed,
    withdrawError,
    withdrawHash,

    // Redeem
    redeem,
    isRedeemPending,
    isRedeemConfirming,
    isRedeemConfirmed,
    redeemError,
    redeemHash,

    // Refetch
    refetchAll,
  }
}

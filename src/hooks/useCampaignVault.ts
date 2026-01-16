import { useReadContract } from 'wagmi'
import { type Address } from 'viem'
import { CAMPAIGN_VAULT_ABI } from '@/lib/abi'

export function useCampaignVault(vaultAddress: Address | undefined, chainId?: 84532 | 11155111) {
  // Read total assets in vault (TVL)
  const { data: totalAssets, refetch: refetchTotalAssets } = useReadContract({
    address: vaultAddress,
    abi: CAMPAIGN_VAULT_ABI,
    functionName: 'totalAssets',
    chainId,
    query: {
      enabled: !!vaultAddress && vaultAddress !== '0x',
    },
  })

  // Read total supply (optional, for share price if needed later)
  const { data: totalSupply } = useReadContract({
    address: vaultAddress,
    abi: CAMPAIGN_VAULT_ABI,
    functionName: 'totalSupply',
    chainId,
    query: {
      enabled: !!vaultAddress && vaultAddress !== '0x',
    },
  })

  return {
    totalAssets: totalAssets as bigint | undefined,
    totalSupply: totalSupply as bigint | undefined,
    refetchTotalAssets,
  }
}

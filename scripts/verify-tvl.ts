import { createPublicClient, http, formatUnits, parseAbi } from 'viem'
import { baseSepolia, sepolia } from 'viem/chains'
import { CAMPAIGN_REGISTRY_ABI, CAMPAIGN_VAULT_ABI, PAYOUT_ROUTER_ABI } from '../src/lib/abi/index'

const CHAINS = [
  {
    name: 'Base Sepolia',
    chain: baseSepolia,
    registryAddress: '0xFa0A22b22c76235002C42e4dFbDa7dce57c37b48',
    payoutRouter: '0x2A51D4F29eFb43E3Fce8D9a0325cf78EA512DF7f',
    vaultFactory: '0xF84dbccD95bA6DDc9c4a6054A948E4cd4915900D',
  },
  {
    name: 'Ethereum Sepolia',
    chain: sepolia,
    registryAddress: '0xB4f6BD99006028fAC7d13648A1963CbFe3b492Ec',
    payoutRouter: '0x804Ef3Ac8bB498A17B704a0cC9049691a7c74218',
    vaultFactory: '0x36001dc36977852E5BD860F1fc5C9446ddbf2b4c',
    globalVaults: [
      {
        name: 'Global ETH Vault',
        address: '0x6460A5FE7dd7673Ab78273DBfeF564f909643309',
        decimals: 18,
        symbol: 'ETH',
      },
      {
        name: 'Global USDC Vault',
        address: '0xEAB952557cC34cD2D4711EafAe3122BC6DB665B4',
        decimals: 6,
        symbol: 'USDC',
      },
    ],
  },
] as const

async function tryGetVault(client: any, address: string, functionName: string, args: any[]) {
  try {
    const abi = parseAbi([`function ${functionName}(bytes32) view returns (address)`])
    const result = (await client.readContract({
      address,
      abi,
      functionName,
      args,
    })) as string
    if (result && result !== '0x0000000000000000000000000000000000000000') return result
  } catch (e) {
    // ignore
  }
  return null
}

async function checkChain(config: (typeof CHAINS)[number]) {
  console.log(`\n==========================================`)
  console.log(`Checking ${config.name}...`)
  console.log(`Registry: ${config.registryAddress}`)
  console.log(`==========================================`)

  const client = createPublicClient({
    chain: config.chain,
    transport: http(),
  })

  // 1. Check Global Vaults if defined
  if ('globalVaults' in config && config.globalVaults) {
    console.log('\n--- Checking Global Vaults ---')
    for (const vault of config.globalVaults) {
      try {
        console.log(`Checking ${vault.name} (${vault.address})...`)
        const totalAssets = (await client.readContract({
          address: vault.address,
          abi: CAMPAIGN_VAULT_ABI,
          functionName: 'totalAssets',
        })) as bigint

        const totalSupply = (await client.readContract({
          address: vault.address,
          abi: CAMPAIGN_VAULT_ABI,
          functionName: 'totalSupply',
        })) as bigint

        console.log(`  TVL: ${formatUnits(totalAssets, vault.decimals)} ${vault.symbol}`)
        console.log(`  Supply: ${formatUnits(totalSupply, vault.decimals)}`)

        // Check linkage to Registry
        try {
          const campaign = (await client.readContract({
            address: config.registryAddress,
            abi: CAMPAIGN_REGISTRY_ABI,
            functionName: 'getCampaignByVault',
            args: [vault.address],
          })) as any
          if (
            campaign.id &&
            campaign.id !== '0x0000000000000000000000000000000000000000000000000000000000000000'
          ) {
            console.log(`  Linked to Campaign (via Registry): ${campaign.id}`)
          } else {
            console.log(`  Not linked to any campaign in Registry.`)
          }
        } catch (e) {
          console.log(`  getCampaignByVault failed: ${(e as any).shortMessage}`)
        }

        // Check linkage to Router
        if (config.payoutRouter) {
          try {
            const campaignId = (await client.readContract({
              address: config.payoutRouter,
              abi: PAYOUT_ROUTER_ABI,
              functionName: 'getVaultCampaign',
              args: [vault.address],
            })) as string
            if (
              campaignId &&
              campaignId !== '0x0000000000000000000000000000000000000000000000000000000000000000'
            ) {
              console.log(`  Linked to Campaign (via Router): ${campaignId}`)
            } else {
              console.log(`  Not linked to any campaign in Router.`)
            }
          } catch (e) {
            console.log(`  getVaultCampaign failed: ${(e as any).shortMessage}`)
          }
        }
      } catch (e) {
        console.error(`  Failed to check global vault: ${(e as any).message}`)
      }
    }
    console.log('------------------------------\n')
  }

  try {
    const campaignIds = (await client.readContract({
      address: config.registryAddress,
      abi: CAMPAIGN_REGISTRY_ABI,
      functionName: 'listCampaignIds',
    })) as `0x${string}`[]

    console.log(`Found ${campaignIds.length} campaigns.`)

    for (const id of campaignIds) {
      console.log(`\n[${config.name}] Checking Campaign ID: ${id}`)

      const campaign = (await client.readContract({
        address: config.registryAddress,
        abi: CAMPAIGN_REGISTRY_ABI,
        functionName: 'getCampaign',
        args: [id],
      })) as any

      console.log(`  Vault Address (from struct): ${campaign.vault}`)
      console.log(`  Proposer: ${campaign.proposer}`)
      console.log(`  Curator: ${campaign.curator}`)
      console.log(`  Payout Recipient: ${campaign.payoutRecipient}`)

      const statusMap = [
        'Submitted',
        'Approved',
        'Rejected',
        'Active',
        'Paused',
        'Cancelled',
        'Completed',
        'Unknown',
      ]
      console.log(`  Status: ${campaign.status} (${statusMap[campaign.status] || 'Unknown'})`)

      let vaultAddress =
        campaign.vault && campaign.vault !== '0x0000000000000000000000000000000000000000'
          ? campaign.vault
          : null

      if (!vaultAddress) {
        console.log('  Vault missing in struct. Speculative checking...')

        // 1. Try campaignVaults(id) on Registry
        const v1 = await tryGetVault(client, config.registryAddress, 'campaignVaults', [id])
        if (v1) {
          console.log(`  FOUND in Registry.campaignVaults: ${v1}`)
          vaultAddress = v1
        }

        // 2. Try getCampaignVault(id) on Registry
        if (!vaultAddress) {
          const v2 = await tryGetVault(client, config.registryAddress, 'getCampaignVault', [id])
          if (v2) {
            console.log(`  FOUND in Registry.getCampaignVault: ${v2}`)
            vaultAddress = v2
          }
        }

        // 3. Try campaignVaults(id) on PayoutRouter
        if (!vaultAddress && config.payoutRouter) {
          const v3 = await tryGetVault(client, config.payoutRouter, 'campaignVaults', [id])
          if (v3) {
            console.log(`  FOUND in PayoutRouter.campaignVaults: ${v3}`)
            vaultAddress = v3
          }
        }

        // 4. Try getCampaignVault(id) on Factory
        if (!vaultAddress && config.vaultFactory) {
          const v4 = await tryGetVault(client, config.vaultFactory, 'getCampaignVault', [id])
          if (v4) {
            console.log(`  FOUND in Factory.getCampaignVault: ${v4}`)
            vaultAddress = v4
          }
        }
      }

      if (vaultAddress) {
        try {
          const totalAssets = (await client.readContract({
            address: vaultAddress,
            abi: CAMPAIGN_VAULT_ABI,
            functionName: 'totalAssets',
          })) as bigint

          const isEth = campaign.strategyId.toLowerCase().endsWith('fd3e4')
          const decimals = isEth ? 18 : 6
          const symbol = isEth ? 'ETH' : 'USDC'

          console.log(`  Vault TVL: ${formatUnits(totalAssets, decimals)} ${symbol}`)
        } catch (error) {
          console.error(`  Error fetching totalAssets from vault: ${(error as any).message}`)
        }
      } else {
        console.log('  No vault found via any method.')
      }
    }
  } catch (error) {
    console.error(`Error fetching campaigns on ${config.name}:`, error)
  }
}

async function main() {
  for (const chainConfig of CHAINS) {
    await checkChain(chainConfig)
  }
}

main()

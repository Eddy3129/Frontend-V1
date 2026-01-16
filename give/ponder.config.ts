import { createConfig } from 'ponder'
import { http } from 'viem'

import { CampaignRegistryABI } from './abis/CampaignRegistry'
import { GiveVaultABI } from './abis/GiveVault'

export default createConfig({
  chains: {
    sepolia: {
      id: 11155111,
      rpc: http(process.env.PONDER_RPC_URL_11155111),
    },
  },
  contracts: {
    CampaignRegistry: {
      chain: 'sepolia',
      abi: CampaignRegistryABI,
      address: '0xB4f6BD99006028fAC7d13648A1963CbFe3b492Ec',
      startBlock: 9796496,
    },
    EthVault: {
      chain: 'sepolia',
      abi: GiveVaultABI,
      address: '0x6460A5FE7dd7673Ab78273DBfeF564f909643309',
      startBlock: 9796496,
    },
    UsdcVault: {
      chain: 'sepolia',
      abi: GiveVaultABI,
      address: '0xEAB952557cC34cD2D4711EafAe3122BC6DB665B4',
      startBlock: 9796496,
    },
  },
})

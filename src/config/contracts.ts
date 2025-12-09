import { AaveV3BaseSepolia, AaveV3Sepolia } from '@bgd-labs/aave-address-book'
import { baseSepolia, ethereumSepolia, type SupportedChainId } from './chains'

// Aave V3 addresses from official address book
export const AAVE_V3 = {
  [baseSepolia.id]: {
    pool: AaveV3BaseSepolia.POOL as `0x${string}`,
    poolAddressesProvider: AaveV3BaseSepolia.POOL_ADDRESSES_PROVIDER as `0x${string}`,
    aclManager: AaveV3BaseSepolia.ACL_MANAGER as `0x${string}`,
    oracle: AaveV3BaseSepolia.ORACLE as `0x${string}`,
    collector: AaveV3BaseSepolia.COLLECTOR as `0x${string}`,
    dataProvider: AaveV3BaseSepolia.AAVE_PROTOCOL_DATA_PROVIDER as `0x${string}`,
    wethGateway: AaveV3BaseSepolia.WETH_GATEWAY as `0x${string}`,
    // Assets
    usdc: AaveV3BaseSepolia.ASSETS.USDC.UNDERLYING as `0x${string}`,
    aUsdc: AaveV3BaseSepolia.ASSETS.USDC.A_TOKEN as `0x${string}`,
    vUsdc: AaveV3BaseSepolia.ASSETS.USDC.V_TOKEN as `0x${string}`,
    weth: AaveV3BaseSepolia.ASSETS.WETH.UNDERLYING as `0x${string}`,
    aWeth: AaveV3BaseSepolia.ASSETS.WETH.A_TOKEN as `0x${string}`,
    vWeth: AaveV3BaseSepolia.ASSETS.WETH.V_TOKEN as `0x${string}`,
  },
  [ethereumSepolia.id]: {
    pool: AaveV3Sepolia.POOL as `0x${string}`,
    poolAddressesProvider: AaveV3Sepolia.POOL_ADDRESSES_PROVIDER as `0x${string}`,
    aclManager: AaveV3Sepolia.ACL_MANAGER as `0x${string}`,
    oracle: AaveV3Sepolia.ORACLE as `0x${string}`,
    collector: AaveV3Sepolia.COLLECTOR as `0x${string}`,
    dataProvider: AaveV3Sepolia.AAVE_PROTOCOL_DATA_PROVIDER as `0x${string}`,
    wethGateway: AaveV3Sepolia.WETH_GATEWAY as `0x${string}`,
    // Assets
    usdc: AaveV3Sepolia.ASSETS.USDC.UNDERLYING as `0x${string}`,
    aUsdc: AaveV3Sepolia.ASSETS.USDC.A_TOKEN as `0x${string}`,
    vUsdc: AaveV3Sepolia.ASSETS.USDC.V_TOKEN as `0x${string}`,
    weth: AaveV3Sepolia.ASSETS.WETH.UNDERLYING as `0x${string}`,
    aWeth: AaveV3Sepolia.ASSETS.WETH.A_TOKEN as `0x${string}`,
    vWeth: AaveV3Sepolia.ASSETS.WETH.V_TOKEN as `0x${string}`,
  },
} as const

// Contract addresses per chain
// Give Protocol deployed contracts
export const CONTRACTS = {
  [baseSepolia.id]: {
    // Core
    aclManager: '0xB4f6BD99006028fAC7d13648A1963CbFe3b492Ec' as `0x${string}`,
    giveProtocolCore: '0x046b1B8B379C6ED5b5Ca25c8dD76d1D4C844edad' as `0x${string}`,

    // Registries
    strategyRegistry: '0x804Ef3Ac8bB498A17B704a0cC9049691a7c74218' as `0x${string}`,
    campaignRegistry: '0xFa0A22b22c76235002C42e4dFbDa7dce57c37b48' as `0x${string}`,
    ngoRegistry: '0xFC00A79E62890C0a55de68B327DaF07416C453b0' as `0x${string}`,

    // Vaults & Routing
    usdcVault: '0x05D65f4b7D95216238cc9635cBC7ce053b605f4c' as `0x${string}`,
    campaignVaultFactory: '0xF84dbccD95bA6DDc9c4a6054A948E4cd4915900D' as `0x${string}`,
    payoutRouter: '0x2A51D4F29eFb43E3Fce8D9a0325cf78EA512DF7f' as `0x${string}`,

    // Strategies
    usdcStrategyManager: '0x6Ab841aa62525f68604697921c44feDfd2341459' as `0x${string}`,
    aaveUsdcAdapter: '0x943D2819E1C87C4023661487ecB2779A2cb3754e' as `0x${string}`,
    ethVault: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    ethStrategyManager: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    aaveEthAdapter: '0x0000000000000000000000000000000000000000' as `0x${string}`,

    // Tokens (from Aave address book)
    usdc: AAVE_V3[baseSepolia.id].usdc,
    weth: AAVE_V3[baseSepolia.id].weth,

    // External (Aave V3 from address book)
    aavePool: AAVE_V3[baseSepolia.id].pool,
    aUsdc: AAVE_V3[baseSepolia.id].aUsdc,
  },
  [ethereumSepolia.id]: {
    // Core
    aclManager: '0x9C56468651D1601a7Bebc901564E82444a251AfE' as `0x${string}`,
    giveProtocolCore: '0x13182dE484BE4df0DaC262509fa1A55c3B258F64' as `0x${string}`,

    // Registries
    strategyRegistry: '0xa63D4A491B495Dc80e163fCcec73E2c7c3e983d4' as `0x${string}`,
    campaignRegistry: '0xB4f6BD99006028fAC7d13648A1963CbFe3b492Ec' as `0x${string}`,
    ngoRegistry: '0x046b1B8B379C6ED5b5Ca25c8dD76d1D4C844edad' as `0x${string}`,

    // Vaults & Routing
    usdcVault: '0xEAB952557cC34cD2D4711EafAe3122BC6DB665B4' as `0x${string}`,
    ethVault: '0x6460A5FE7dd7673Ab78273DBfeF564f909643309' as `0x${string}`,
    campaignVaultFactory: '0x36001dc36977852E5BD860F1fc5C9446ddbf2b4c' as `0x${string}`,
    payoutRouter: '0x804Ef3Ac8bB498A17B704a0cC9049691a7c74218' as `0x${string}`,

    // Strategies
    usdcStrategyManager: '0xB501221e3c3766D850Fa13103C236E571ac1685B' as `0x${string}`,
    aaveUsdcAdapter: '0x2B0B7390B914133eb1e7c8126c61a8A506D7751e' as `0x${string}`,
    ethStrategyManager: '0x5B20450Af03a5A348753e7B1f0828E0af6041540' as `0x${string}`,
    aaveEthAdapter: '0x097F34A0E411025B5798A291dd0d36F96adDA331' as `0x${string}`,

    // Tokens (from Aave address book)
    usdc: AAVE_V3[ethereumSepolia.id].usdc,
    weth: AAVE_V3[ethereumSepolia.id].weth,

    // External (Aave V3 from address book)
    aavePool: AAVE_V3[ethereumSepolia.id].pool,
    aUsdc: AAVE_V3[ethereumSepolia.id].aUsdc,
  },
} as const

// Role identifiers (keccak256 hashes)
export const ROLES = {
  PROTOCOL_ADMIN:
    '0x5b784347a5e3c2922bf8fccbf4b9b3e5d913a4633b654dd2ca500cf1dbac45f8' as `0x${string}`,
  STRATEGY_ADMIN:
    '0xb57297ecebc1dba0e33b1e45874fef743b00bcaf602bed1c981aed9532b34738' as `0x${string}`,
  CAMPAIGN_ADMIN:
    '0xd3e32b3a2fa74f439ab3adcee4a4d8e75b9e2708f2f9a4ddeb9808e95755fbdf' as `0x${string}`,
  CAMPAIGN_CREATOR:
    '0xbb34ee1cfd3d2043adfd32179a0dbdff18d77bb4c38d931346d1f837337a3b3c' as `0x${string}`,
  CAMPAIGN_CURATOR:
    '0x2258eb86951c47eb99eca0e68d9c97b19b38ee4dcbc76ca88bee37e54d26ea4e' as `0x${string}`,
  CHECKPOINT_COUNCIL:
    '0xcf2620d375e76b290625c0232e49c319f5701111a78764001e5d2202d00132d5' as `0x${string}`,
  UPGRADER: '0x8a09bc4847192c22feb74caee1053aa32efa71e844cecf61d1dc74645ed5e8f6' as `0x${string}`,
} as const

// Strategy & Vault IDs (same across chains)
export const STRATEGY_IDS = {
  AAVE_USDC: '0xfa06fc6834087ec4c5d38992a03c81b67c92225cb2bdc899d7fe333316794dd5' as `0x${string}`,
  CONSERVATIVE_RISK:
    '0x8936d18e811dbc622adc44a779e1a216776a0cdb1cd64fb9dcb59df014872b3c' as `0x${string}`,
  AAVE_ETH: '0xf652ab2d7840bae82cb8fb1b886de339d4b690cf5f62560a68ec11d0ad4fd3e4' as `0x${string}`,
} as const

export const VAULT_IDS = {
  USDC: '0x4b9771793aaf28de1ff71a019ad565bf6098449d39ef29f8de0c051a9e7baf9a' as `0x${string}`,
} as const

export function getContracts(chainId: number | undefined) {
  const supportedChainId = chainId as SupportedChainId
  if (chainId === baseSepolia.id || chainId === ethereumSepolia.id) {
    return CONTRACTS[supportedChainId]
  }
  // Default to base sepolia
  return CONTRACTS[baseSepolia.id]
}

// Helper to check if contracts are deployed
export function areContractsDeployed(chainId: SupportedChainId): boolean {
  const contracts = CONTRACTS[chainId]
  return contracts.usdcVault !== '0x' && contracts.campaignRegistry !== '0x'
}

import { http, createConfig, createStorage, cookieStorage } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { baseSepolia, ethereumSepolia } from './chains'

export const wagmiConfig = createConfig({
  chains: [baseSepolia, ethereumSepolia],
  connectors: [injected()],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  batch: {
    multicall: true,
  },
  transports: {
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://base-sepolia-rpc.publicnode.com'
    ),
    [ethereumSepolia.id]: http(
      process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com'
    ),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}

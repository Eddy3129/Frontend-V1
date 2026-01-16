import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia, ethereumSepolia } from './chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'Give Protocol',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'public',
  chains: [baseSepolia, ethereumSepolia],
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}

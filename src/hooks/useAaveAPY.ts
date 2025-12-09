'use client'

import { useEffect, useState } from 'react'
import { AaveClient, chainId } from '@aave/client'
import { markets } from '@aave/client/actions'
import { CONTRACTS } from '@/config/contracts'
import { baseSepolia, ethereumSepolia } from '@/config/chains'
import type { StrategyOption } from '@/types/campaign'

// Explorer URLs for networks
const EXPLORER_URLS = {
  [baseSepolia.id]: 'https://sepolia.basescan.org',
  [ethereumSepolia.id]: 'https://sepolia.etherscan.io',
}

// Token logos
const TOKEN_LOGOS = {
  USDC: 'https://token-logos.family.co/asset?id=1:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&token=USDC',
  WETH: 'https://token-logos.family.co/asset?id=1:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&token=WETH',
}

// Network logos
const NETWORK_LOGOS = {
  'base-sepolia': 'https://statics.aave.com/base.svg',
  'eth-sepolia': 'https://statics.aave.com/ethereum.svg',
}

// Create Aave client
const client = AaveClient.create()

interface ReserveData {
  apy: number
  tvl: number
}

export function useAaveAPY() {
  const [strategies, setStrategies] = useState<StrategyOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAaveData() {
      setIsLoading(true)

      // Default values (fallback)
      let baseUsdcData: ReserveData = { apy: 3.5, tvl: 0 }
      let baseWethData: ReserveData = { apy: 2.0, tvl: 0 }
      let ethUsdcData: ReserveData = { apy: 3.5, tvl: 0 }
      let ethWethData: ReserveData = { apy: 2.0, tvl: 0 }

      try {
        // Fetch Base Sepolia market (supported by Aave API)
        const baseResult = await markets(client, {
          chainIds: [chainId(84532)], // Base Sepolia
        })

        if (baseResult.isOk && baseResult.isOk() && baseResult.value.length > 0) {
          const market = baseResult.value[0]

          const usdcReserve = market.supplyReserves?.find(
            (r: { underlyingToken?: { symbol?: string } }) => r.underlyingToken?.symbol === 'USDC'
          )
          if (usdcReserve?.supplyInfo) {
            baseUsdcData = {
              apy: parseFloat(usdcReserve.supplyInfo.apy?.value || '0') * 100,
              tvl: parseFloat(usdcReserve.supplyInfo.total?.value || '0'),
            }
          }

          const wethReserve = market.supplyReserves?.find(
            (r: { underlyingToken?: { symbol?: string } }) => r.underlyingToken?.symbol === 'WETH'
          )
          if (wethReserve?.supplyInfo) {
            baseWethData = {
              apy: parseFloat(wethReserve.supplyInfo.apy?.value || '0') * 100,
              tvl: parseFloat(wethReserve.supplyInfo.total?.value || '0'),
            }
          }
        }

        // Ethereum Sepolia not supported by Aave API - use mainnet data as reference
        const ethResult = await markets(client, {
          chainIds: [chainId(1)], // Ethereum mainnet for Sepolia reference
        })

        if (ethResult.isOk && ethResult.isOk() && ethResult.value.length > 0) {
          const market = ethResult.value[0]

          const usdcReserve = market.supplyReserves?.find(
            (r: { underlyingToken?: { symbol?: string } }) => r.underlyingToken?.symbol === 'USDC'
          )
          if (usdcReserve?.supplyInfo) {
            ethUsdcData = {
              apy: parseFloat(usdcReserve.supplyInfo.apy?.value || '0') * 100,
              tvl: parseFloat(usdcReserve.supplyInfo.total?.value || '0'),
            }
          }

          const wethReserve = market.supplyReserves?.find(
            (r: { underlyingToken?: { symbol?: string } }) => r.underlyingToken?.symbol === 'WETH'
          )
          if (wethReserve?.supplyInfo) {
            ethWethData = {
              apy: parseFloat(wethReserve.supplyInfo.apy?.value || '0') * 100,
              tvl: parseFloat(wethReserve.supplyInfo.total?.value || '0'),
            }
          }
        }
      } catch (error) {
        console.error('[Aave] Error fetching data:', error)
      }

      // Build strategy options with fetched data
      const strategyList: StrategyOption[] = [
        {
          id: 'aave-usdc-base',
          name: 'Aave USDC',
          symbol: 'aUSDC',
          description: 'Lend USDC on Aave V3',
          asset: 'USDC',
          apy: baseUsdcData.apy,
          tvl: baseUsdcData.tvl,
          volume24h: null, // Not available from Aave API
          risk: 'low',
          protocol: 'Aave V3',
          icon: '💵',
          tokenLogo: TOKEN_LOGOS.USDC,
          network: 'base-sepolia',
          networkLabel: 'Base Sepolia',
          networkLogo: NETWORK_LOGOS['base-sepolia'],
          vaultAddress: CONTRACTS[baseSepolia.id].usdcVault,
          vaultUrl: `${EXPLORER_URLS[baseSepolia.id]}/address/${CONTRACTS[baseSepolia.id].usdcVault}`,
        },
        {
          id: 'aave-weth-base',
          name: 'Aave WETH',
          symbol: 'aWETH',
          description: 'Lend WETH on Aave V3',
          asset: 'WETH',
          apy: baseWethData.apy,
          tvl: baseWethData.tvl,
          volume24h: null,
          risk: 'medium',
          protocol: 'Aave V3',
          icon: '💎',
          tokenLogo: TOKEN_LOGOS.WETH,
          network: 'base-sepolia',
          networkLabel: 'Base Sepolia',
          networkLogo: NETWORK_LOGOS['base-sepolia'],
          vaultAddress: CONTRACTS[baseSepolia.id].usdcVault,
          vaultUrl: `${EXPLORER_URLS[baseSepolia.id]}/address/${CONTRACTS[baseSepolia.id].usdcVault}`,
        },
        {
          id: 'aave-usdc-eth',
          name: 'Aave USDC',
          symbol: 'aUSDC',
          description: 'Lend USDC on Aave V3',
          asset: 'USDC',
          apy: ethUsdcData.apy,
          tvl: ethUsdcData.tvl,
          volume24h: null,
          risk: 'low',
          protocol: 'Aave V3',
          icon: '💵',
          tokenLogo: TOKEN_LOGOS.USDC,
          network: 'eth-sepolia',
          networkLabel: 'Ethereum Sepolia',
          networkLogo: NETWORK_LOGOS['eth-sepolia'],
          vaultAddress: CONTRACTS[ethereumSepolia.id].usdcVault,
          vaultUrl: `${EXPLORER_URLS[ethereumSepolia.id]}/address/${CONTRACTS[ethereumSepolia.id].usdcVault}`,
        },
        {
          id: 'aave-weth-eth',
          name: 'Aave WETH',
          symbol: 'aWETH',
          description: 'Lend WETH on Aave V3',
          asset: 'WETH',
          apy: ethWethData.apy,
          tvl: ethWethData.tvl,
          volume24h: null,
          risk: 'medium',
          protocol: 'Aave V3',
          icon: '💎',
          tokenLogo: TOKEN_LOGOS.WETH,
          network: 'eth-sepolia',
          networkLabel: 'Ethereum Sepolia',
          networkLogo: NETWORK_LOGOS['eth-sepolia'],
          vaultAddress: CONTRACTS[ethereumSepolia.id].usdcVault,
          vaultUrl: `${EXPLORER_URLS[ethereumSepolia.id]}/address/${CONTRACTS[ethereumSepolia.id].usdcVault}`,
        },
      ]

      console.debug('[Aave] Strategy data loaded', {
        baseSepolia: { usdc: baseUsdcData, weth: baseWethData },
        ethereumSepolia: { usdc: ethUsdcData, weth: ethWethData },
      })

      setStrategies(strategyList)
      setIsLoading(false)
    }

    fetchAaveData()
  }, [])

  return {
    strategies,
    isLoading,
  }
}

// Format APY for display
export function formatAPY(apy: number | null): string {
  if (apy === null || isNaN(apy)) return '--.--'
  if (apy < 0.01) return '<0.01%'
  return `${apy.toFixed(2)}%`
}

// Format TVL for display
export function formatTVL(tvl: number | null): string {
  if (tvl === null || isNaN(tvl)) return '--'
  if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(2)}B`
  if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(2)}M`
  if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(2)}K`
  return `$${tvl.toFixed(2)}`
}

// Helper to get strategy by ID
export function getStrategyById(
  strategies: StrategyOption[],
  id: string
): StrategyOption | undefined {
  return strategies.find((s) => s.id === id)
}

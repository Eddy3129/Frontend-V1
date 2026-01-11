'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatUnits, type Address } from 'viem'
import { useConnection } from 'wagmi'
import { useCampaign, CampaignStatus } from '@/hooks/useCampaign'
import { useCampaignVault } from '@/hooks/useCampaignVault'
import { useAaveAPY, formatAPY } from '@/hooks/useAaveAPY'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { getGatewayUrl, parseCID, type CampaignMetadata } from '@/lib/pinata'
import Link from 'next/link'
import { Clock, Target, ArrowRight, Heart, TrendingUp } from 'lucide-react'
import { STRATEGY_IDS, getContracts } from '@/config/contracts'
import { baseSepolia, ethereumSepolia } from '@/config/chains'
import { UsdcCircleColorful, EthereumCircleColorful } from '@ant-design/web3-icons'

interface CampaignCardProps {
  campaignId: `0x${string}`
  filterStatus?: CampaignStatus
  showApproveButton?: boolean
  hideIfNoMetadata?: boolean
}

const statusColors: Record<CampaignStatus, string> = {
  [CampaignStatus.Submitted]: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  [CampaignStatus.Approved]: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  [CampaignStatus.Rejected]: 'bg-red-500/10 text-red-600 border-red-500/20',
  [CampaignStatus.Active]: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  [CampaignStatus.Paused]: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  [CampaignStatus.Cancelled]: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  [CampaignStatus.Completed]: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  [CampaignStatus.Unknown]: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
}

const statusLabels: Record<CampaignStatus, string> = {
  [CampaignStatus.Submitted]: 'Pending',
  [CampaignStatus.Approved]: 'Approved',
  [CampaignStatus.Rejected]: 'Rejected',
  [CampaignStatus.Active]: 'Active',
  [CampaignStatus.Paused]: 'Paused',
  [CampaignStatus.Cancelled]: 'Cancelled',
  [CampaignStatus.Completed]: 'Completed',
  [CampaignStatus.Unknown]: 'Unknown',
}

export function CampaignCard({
  campaignId,
  filterStatus,
  showApproveButton: _showApproveButton,
  hideIfNoMetadata = false,
}: CampaignCardProps) {
  const [metadata, setMetadata] = useState<CampaignMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [metadataFailed, setMetadataFailed] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const { chainId } = useConnection()
  const activeChainId = chainId ?? baseSepolia.id
  const contracts = getContracts(activeChainId)

  const { useGetCampaign, getMetadataCID } = useCampaign()
  const { data: campaign } = useGetCampaign(campaignId)
  const { strategies } = useAaveAPY()

  const campaignData = campaign as
    | {
        targetStake: bigint
        totalStaked: bigint
        status: number
        fundraisingEnd: bigint
        metadataHash: `0x${string}`
        vault: Address
        strategyId: `0x${string}`
      }
    | undefined

  // Determine effective vault address
  const isEth = campaignData?.strategyId === STRATEGY_IDS.AAVE_ETH
  const fallbackVault = isEth ? contracts.ethVault : contracts.usdcVault
  const vaultAddress =
    campaignData?.vault && campaignData.vault !== '0x0000000000000000000000000000000000000000'
      ? campaignData.vault
      : fallbackVault

  // Fetch TVL from campaign vault
  const { totalAssets } = useCampaignVault(vaultAddress)

  // Get APY for the campaign's strategy
  const selectedNetwork = activeChainId === ethereumSepolia.id ? 'eth-sepolia' : 'base-sepolia'
  const strategyAsset = isEth ? 'WETH' : 'USDC'

  const apy = useMemo(() => {
    const networkStrategies = strategies.filter((s) => s.network === selectedNetwork)
    const strategy = networkStrategies.find((s) => s.asset === strategyAsset)
    return strategy?.apy || 0
  }, [strategies, selectedNetwork, strategyAsset])

  // Fetch metadata from IPFS
  useEffect(() => {
    if (hasFetched || !campaign || !campaignId) return

    async function fetchMetadata() {
      setHasFetched(true)
      try {
        const cid = await getMetadataCID(campaignId)
        if (!cid) {
          setMetadataFailed(true)
          setIsLoading(false)
          return
        }

        const url = getGatewayUrl(cid)
        const response = await fetch(url)
        if (!response.ok) {
          setMetadataFailed(true)
          setIsLoading(false)
          return
        }
        const data = await response.json()
        setMetadata(data)
      } catch (error) {
        console.error('Failed to fetch campaign metadata:', error)
        setMetadataFailed(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetadata()
  }, [campaign, campaignId, hasFetched, getMetadataCID])

  if (!campaign || !campaignData || !campaignData.targetStake || isLoading) {
    return (
      <div className="animate-pulse border border-border bg-card shadow-sm">
        <div className="h-96 bg-muted w-full" />
      </div>
    )
  }

  // If hideIfNoMetadata is true and metadata failed, don't render
  if (hideIfNoMetadata && (metadataFailed || !metadata || !metadata.name)) {
    return null
  }

  const decimals = isEth ? 18 : 6
  const goal = Number(formatUnits(campaignData.targetStake, decimals))
  const raised = totalAssets ? Number(formatUnits(totalAssets, decimals)) : 0
  const progress = goal > 0 ? (raised / goal) * 100 : 0
  const status = campaignData.status as CampaignStatus

  // Filter if needed
  if (filterStatus !== undefined && status !== filterStatus) {
    return null
  }

  const daysLeft = Math.max(
    0,
    Math.ceil((Number(campaignData.fundraisingEnd) * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
  )

  // Use cover image if available
  const coverImageUrl = metadata?.coverImage
    ? getGatewayUrl(parseCID(metadata.coverImage))
    : metadata?.images?.[0]
      ? getGatewayUrl(parseCID(metadata.images[0]))
      : null

  // Logo is separate from cover
  const logoUrl =
    metadata?.coverImage && metadata?.images?.[0]
      ? getGatewayUrl(parseCID(metadata.images[0]))
      : null

  return (
    <div
      className="relative min-h-[420px] overflow-hidden group transition-all duration-500 border border-border shadow-md hover:shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image - Always visible */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{
          backgroundImage: coverImageUrl
            ? `url(${coverImageUrl})`
            : 'linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, hsl(var(--primary) / 0.1) 100%)',
        }}
      >
        {!coverImageUrl && (
          <div className="w-full h-full flex items-center justify-center">
            <Heart className="w-20 h-20 text-primary/20" />
          </div>
        )}
      </div>

      {/* Gradient overlay - Always visible, stronger at bottom for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* Main Card Content - Always visible */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${
          isHovered ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Fully transparent bottom section with text shadows for readability */}
        <div className="p-6 space-y-4">
          {/* Title and Logo */}
          <div className="flex items-start gap-3">
            {logoUrl && (
              <div className="relative w-14 h-14 overflow-hidden shrink-0 border-2 border-white bg-white shadow-xl rounded-lg">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-serif font-bold text-xl text-white line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {metadata?.name || 'Untitled Campaign'}
              </h3>
              <p className="text-sm text-white/95 font-medium mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                by {metadata?.ngoName || 'Unknown NGO'}
              </p>
            </div>
          </div>

          {/* Raised amount and APY side by side */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/90 mb-1.5 drop-shadow font-semibold">
                Raised
              </p>
              <p className="text-2xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {isEth ? `${raised.toFixed(4)} ETH` : `$${raised.toLocaleString()}`}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/90 mb-1.5 drop-shadow font-semibold">
                APY
              </p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-emerald-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {apy.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-white/90 drop-shadow">
                {Math.min(progress, 100).toFixed(0)}% of goal
              </span>
              <span className="text-xs font-medium text-white/90 drop-shadow">
                {daysLeft} days left
              </span>
            </div>
            <Progress
              value={Math.min(progress, 100)}
              className="h-2.5 bg-white/25 shadow-inner"
              indicatorClassName="bg-white shadow-lg"
            />
          </div>

          {/* Network and Goal */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-xs text-white/95 drop-shadow bg-white/10 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
              {activeChainId === ethereumSepolia.id ? (
                <>
                  <EthereumCircleColorful className="w-4 h-4" />
                  <span className="font-medium">Ethereum Sepolia</span>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[8px] font-bold">
                    B
                  </div>
                  <span className="font-medium">Base Sepolia</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-white/95 drop-shadow">
              <Target className="w-4 h-4" />
              <span className="font-medium">
                {isEth ? `${goal.toFixed(2)} ETH` : `$${goal.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover State - Click to view, lighter overlay */}
      <Link href={`/campaigns/${campaignId}`}>
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col justify-center items-center p-8 transition-all duration-700 ease-out cursor-pointer ${
            isHovered ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          }`}
        >
          <div className="space-y-6 text-center max-w-md">
            <p className="text-sm text-white leading-relaxed drop-shadow-lg">
              {metadata?.description || 'No description available.'}
            </p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-serif tracking-wide shadow-xl h-12 px-8 group/btn text-base">
              View Details
              <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </Link>
    </div>
  )
}

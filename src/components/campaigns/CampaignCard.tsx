'use client'

import { useState, useEffect } from 'react'
import { formatUnits, type Address } from 'viem'
import { useConnection } from 'wagmi'
import { useCampaign, CampaignStatus } from '@/hooks/useCampaign'
import { useCampaignVault } from '@/hooks/useCampaignVault'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { getGatewayUrl, parseCID, type CampaignMetadata } from '@/lib/pinata'
import Link from 'next/link'
import { Clock, Target, ArrowRight, Heart } from 'lucide-react'
import { STRATEGY_IDS, getContracts } from '@/config/contracts'
import { baseSepolia } from '@/config/chains'

interface CampaignCardProps {
  campaignId: `0x${string}`
  filterStatus?: CampaignStatus
  showApproveButton?: boolean
  hideIfNoMetadata?: boolean // Hide the card if metadata cannot be fetched
}

const statusColors: Record<CampaignStatus, string> = {
  [CampaignStatus.Submitted]:
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  [CampaignStatus.Approved]:
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  [CampaignStatus.Rejected]:
    'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  [CampaignStatus.Active]:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  [CampaignStatus.Paused]:
    'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  [CampaignStatus.Cancelled]:
    'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-800/50 dark:text-stone-300 dark:border-stone-700',
  [CampaignStatus.Completed]:
    'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  [CampaignStatus.Unknown]: 'bg-gray-100 text-gray-800 border-gray-200',
}

const statusLabels: Record<CampaignStatus, string> = {
  [CampaignStatus.Submitted]: 'Submitted',
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

  const { chainId } = useConnection()
  const contracts = getContracts(chainId ?? baseSepolia.id)

  const { useGetCampaign, getMetadataCID } = useCampaign()
  const { data: campaign } = useGetCampaign(campaignId)

  // Use CampaignConfig structure from the new contract
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

  // Determine effective vault address (fallback to global protocol vaults if campaign vault is 0x0)
  const isEth = campaignData?.strategyId === STRATEGY_IDS.AAVE_ETH
  const fallbackVault = isEth ? contracts.ethVault : contracts.usdcVault
  const vaultAddress =
    campaignData?.vault && campaignData.vault !== '0x0000000000000000000000000000000000000000'
      ? campaignData.vault
      : fallbackVault

  // Fetch TVL from campaign vault (or fallback)
  const { totalAssets } = useCampaignVault(vaultAddress)

  // Fetch metadata from IPFS - only once when campaign is loaded
  useEffect(() => {
    // Don't fetch if already fetched or no campaign
    if (hasFetched || !campaign || !campaignId) return

    async function fetchMetadata() {
      setHasFetched(true)
      try {
        // Get the metadata CID from API (cached)
        const cid = await getMetadataCID(campaignId)
        if (!cid) {
          console.warn('No metadata CID found for campaign:', campaignId)
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

  if (!campaign || !campaignData) {
    return (
      <Card className="animate-pulse border-none shadow-md bg-card">
        <div className="h-48 bg-muted w-full rounded-t-lg" />
        <CardContent className="space-y-4 pt-6">
          <div className="h-6 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-2 bg-muted rounded w-full mt-4" />
        </CardContent>
      </Card>
    )
  }

  // Check if campaign data is valid (exists check)
  if (!campaignData.targetStake) {
    return (
      <Card className="animate-pulse border-none shadow-md bg-card">
        <div className="h-48 bg-muted w-full rounded-t-lg" />
        <CardContent className="space-y-4 pt-6">
          <div className="h-6 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-2 bg-muted rounded w-full mt-4" />
        </CardContent>
      </Card>
    )
  }

  // If hideIfNoMetadata is true and metadata failed to load, don't render the card
  if (hideIfNoMetadata && !isLoading && (metadataFailed || !metadata || !metadata.name)) {
    return null
  }

  // Still loading metadata - show skeleton
  if (isLoading) {
    return (
      <Card className="animate-pulse border-none shadow-md bg-card">
        <div className="h-48 bg-muted w-full rounded-t-lg" />
        <CardContent className="space-y-4 pt-6">
          <div className="h-6 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-2 bg-muted rounded w-full mt-4" />
        </CardContent>
      </Card>
    )
  }

  const decimals = isEth ? 18 : 6
  // For ETH, we should ideally convert to USD for display if goal is USD
  // But for now, just showing the raw value formatted (e.g. 1 ETH) vs Goal (e.g. 2000 USDC) might be confusing if not labeled.
  // CampaignDetail handles conversion. CampaignCard is simpler.
  // If goal is USDC (6 dec), and raised is ETH (18 dec), we have a mismatch.
  // Assuming targetStake is always USD value.
  // If strategy is ETH, totalAssets is ETH amount.
  // To get USD value, we need ETH price.
  // CampaignCard doesn't fetch ETH price currently.
  // For now, I will just format it with correct decimals so it's not a huge number.
  // A future improvement would be to fetch price or standardise goal to the asset.

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

  // Use cover image if available, otherwise first image
  const coverImageUrl = metadata?.coverImage
    ? getGatewayUrl(parseCID(metadata.coverImage))
    : metadata?.images?.[0]
      ? getGatewayUrl(parseCID(metadata.images[0]))
      : null

  // Logo is separate from cover - use first image if cover exists, otherwise no logo
  const logoUrl =
    metadata?.coverImage && metadata?.images?.[0]
      ? getGatewayUrl(parseCID(metadata.images[0]))
      : null

  return (
    <Card className="group overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-card flex flex-col h-full hover:-translate-y-1">
      {/* Image Header */}
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={metadata?.name || 'Campaign'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/20">
            <Heart className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className={`${statusColors[status]} backdrop-blur-sm shadow-sm`}>
            {statusLabels[status]}
          </Badge>
        </div>
      </div>

      <CardContent className="flex-1 pt-5 pb-3 space-y-3">
        {/* Title with optional logo */}
        <div className="flex items-start gap-3">
          {logoUrl && (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border bg-muted">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-bold text-lg text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {metadata?.name || 'Untitled Campaign'}
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              by {metadata?.ngoName || 'Unknown NGO'}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {metadata?.description || 'No description available.'}
        </p>

        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            <span>
              {isEth ? `${raised.toLocaleString()} ETH` : `$${raised.toLocaleString()}`} raised
            </span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <Progress
            value={progress}
            className="h-2 bg-primary/10"
            indicatorClassName="bg-primary"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              Goal: `${goal.toLocaleString()}`
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {daysLeft} days left
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-5">
        <Link href={`/campaigns/${campaignId}`} className="w-full">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-serif tracking-wide shadow-md group-hover:shadow-lg transition-all">
            View Details
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

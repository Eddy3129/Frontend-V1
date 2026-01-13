'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { useCampaign, CampaignStatus, type CampaignConfig } from '@/hooks/useCampaign'
import { useAaveAPY } from '@/hooks/useAaveAPY'
import { useVault } from '@/hooks/useVault'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { getGatewayUrl, parseCID, type CampaignMetadata } from '@/lib/pinata'
import {
  ArrowLeft,
  Clock,
  Shield,
  Wallet,
  PieChart,
  Target,
  TrendingUp,
  Globe,
  Twitter,
  Calendar,
  CheckCircle2,
  Users,
  Percent,
} from 'lucide-react'
import Link from 'next/link'
import { getContracts, ROLES, STRATEGY_IDS } from '@/config/contracts'
import { baseSepolia, ethereumSepolia } from '@/config/chains'
import { ACL_MANAGER_ABI, CAMPAIGN_VAULT_ABI } from '@/lib/abi'
import { ERC20_ABI } from '@/lib/abi/erc20'
import { toast } from 'sonner'
import { useBalance } from 'wagmi'

// Import child components
import { ImageCarousel } from './components/ImageCarousel'
import { MilestonesCard } from './components/MilestonesCard'
import { DepositForm } from './components/DepositForm'
import { AnalyticsTab } from './components/AnalyticsTab'
import { YourPositionCard } from './components/YourPositionCard'

interface CampaignDetailClientProps {
  campaignId: string
}

export function CampaignDetailClient({ campaignId }: CampaignDetailClientProps) {
  const isValidId = /^0x[a-fA-F0-9]{64}$/.test(campaignId)
  const id = isValidId ? (campaignId as `0x${string}`) : undefined

  const [metadata, setMetadata] = useState<CampaignMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)
  const [activeTab, setActiveTab] = useState('deposit')
  const [leftTab, setLeftTab] = useState('about')
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false)
  const [ethPriceUsd, setEthPriceUsd] = useState<number | null>(null)
  const [ethPriceStale, setEthPriceStale] = useState(false)

  // Staking state
  const [selectedAsset, setSelectedAsset] = useState<'USDC' | 'ETH'>('USDC')
  const [stakeAmount, setStakeAmount] = useState('')
  const [yieldAllocation, setYieldAllocation] = useState(75)

  const { useGetCampaign, useGetStakeWeight, getMetadataCID } = useCampaign()
  const { data: campaign } = useGetCampaign(id)
  const { address, chainId } = useAccount()

  const activeChainId = chainId ?? baseSepolia.id
  const supportedChainId =
    activeChainId === baseSepolia.id || activeChainId === ethereumSepolia.id
      ? activeChainId
      : baseSepolia.id
  const contracts = getContracts(supportedChainId)

  // Determine vault and strategy
  const campaignConfig = campaign as CampaignConfig | undefined
  const isEthStrategy = campaignConfig?.strategyId === STRATEGY_IDS.AAVE_ETH

  const effectiveVault =
    campaignConfig?.vault && campaignConfig.vault !== '0x0000000000000000000000000000000000000000'
      ? campaignConfig.vault
      : isEthStrategy
        ? contracts?.ethVault
        : contracts?.usdcVault

  // Update selected asset when strategy is known
  useEffect(() => {
    if (campaign) {
      setSelectedAsset(isEthStrategy ? 'ETH' : 'USDC')
    }
  }, [campaign, isEthStrategy])

  const { data: stakeWeight } = useGetStakeWeight(id, address)
  const { strategies } = useAaveAPY()
  const {
    approveMax,
    hasAllowance,
    deposit,
    isApprovePending,
    isApproveConfirming,
    isApproveConfirmed,
    isDepositPending,
    isDepositConfirming,
    isDepositConfirmed,
    depositError,
    formattedUserAssets,
    refetchAll,
  } = useVault(selectedAsset, effectiveVault)

  const { data: isAdminData } = useReadContract({
    address: contracts?.aclManager,
    abi: ACL_MANAGER_ABI,
    functionName: 'hasRole',
    args: [ROLES.CAMPAIGN_ADMIN, address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!contracts?.aclManager && !!address },
  })

  const isAdmin = Boolean(isAdminData)

  const selectedNetwork = supportedChainId === ethereumSepolia.id ? 'eth-sepolia' : 'base-sepolia'

  // Map UI asset selection to strategy asset keys (ETH -> WETH in Aave data)
  const strategyAsset = selectedAsset === 'ETH' ? 'WETH' : selectedAsset
  const networkStrategies = strategies.filter((s) => s.network === selectedNetwork)
  const selectedStrategy =
    networkStrategies.find((s) => s.asset === strategyAsset) ?? networkStrategies[0]
  const apy = selectedStrategy?.apy || 0

  // Balances
  const { data: nativeBalance } = useBalance({
    address,
    chainId: supportedChainId,
    query: { enabled: !!address },
  })

  const { data: usdcBalance } = useReadContract({
    address: contracts?.usdc,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!contracts?.usdc && !!address },
  })

  const { data: wethBalance } = useReadContract({
    address: contracts?.weth,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!contracts?.weth && !!address },
  })

  const usdcBalanceFormatted = usdcBalance ? Number(formatUnits(usdcBalance, 6)) : 0
  const ethBalanceFormatted = nativeBalance
    ? Number(formatUnits(nativeBalance.value, nativeBalance.decimals))
    : 0
  const wethBalanceFormatted = wethBalance ? Number(formatUnits(wethBalance, 18)) : 0

  const displayBalance =
    selectedAsset === 'USDC'
      ? usdcBalanceFormatted
      : Math.max(ethBalanceFormatted, wethBalanceFormatted)

  const ethDepositsEnabled = supportedChainId === ethereumSepolia.id && !!contracts?.ethVault

  // User balance in the selected vault/token (assets)
  const userVaultBalance = Number(formattedUserAssets || '0')

  // Fetch live ETH price for USD conversion
  useEffect(() => {
    if (selectedAsset !== 'ETH') return
    let cancelled = false
    const fetchPrice = async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        )
        const json = await res.json()
        if (!cancelled && json?.ethereum?.usd) {
          setEthPriceUsd(Number(json.ethereum.usd))
          setEthPriceStale(false)
        }
      } catch (err) {
        console.error('Failed to fetch ETH price', err)
        if (!cancelled) setEthPriceStale(true)
      }
    }
    fetchPrice()
    const id = setInterval(fetchPrice, 60_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [selectedAsset])

  const handleSetMax = () => {
    const amount =
      selectedAsset === 'USDC'
        ? usdcBalanceFormatted
        : Math.max(ethBalanceFormatted, wethBalanceFormatted)
    if (amount > 0) setStakeAmount(amount.toString())
  }

  const isActionLoading =
    isApprovePending || isApproveConfirming || isDepositPending || isDepositConfirming

  const handleDeposit = async () => {
    const amountNum = parseFloat(stakeAmount || '0')
    if (!address) {
      toast.error('Connect your wallet to deposit', { id: 'deposit' })
      return
    }
    if (!contracts?.usdcVault) {
      toast.error('Unsupported network for deposits. Switch to Base Sepolia or Ethereum Sepolia.')
      return
    }
    if (selectedAsset === 'ETH' && !ethDepositsEnabled) {
      toast.error('ETH deposits require the deployed ETH vault. Switch to Ethereum Sepolia.', {
        id: 'deposit',
      })
      return
    }
    if (!amountNum || amountNum <= 0) return

    try {
      if (selectedAsset === 'USDC') {
        if (!hasAllowance(stakeAmount)) {
          toast.loading('Approving USDC...', { id: 'approve' })
          approveMax()
          return
        }
        toast.loading('Depositing USDC...', { id: 'deposit' })
        deposit(stakeAmount)
      } else {
        toast.loading('Depositing ETH...', { id: 'deposit' })
        deposit(stakeAmount)
      }
    } catch (error) {
      console.error('[CampaignDetail] Deposit failed', error)
      toast.error('Deposit failed', { id: 'deposit' })
    }
  }

  useEffect(() => {
    if (isApproveConfirmed) {
      toast.success('USDC approved. You can deposit now.', { id: 'approve' })
    }
  }, [isApproveConfirmed])

  useEffect(() => {
    if (isDepositConfirmed) {
      toast.success('Staked successfully!', { id: 'deposit' })
      refetchAll()
    }
  }, [isDepositConfirmed, refetchAll])

  useEffect(() => {
    if (depositError) {
      const message = depositError instanceof Error ? depositError.message : 'USDC deposit failed'
      toast.error(message, { id: 'deposit' })
      console.error('[CampaignDetail] USDC deposit error', depositError)
    }
  }, [depositError])

  // Parse campaign data safely
  const campaignData = campaign as
    | {
        targetStake: bigint
        totalStaked: bigint
        status: number
        fundraisingStart: bigint
        fundraisingEnd: bigint
        proposer: string
      }
    | undefined

  const vaultDecimals = isEthStrategy ? 18 : 6

  const { data: campaignVaultAssets } = useReadContract({
    address: effectiveVault,
    abi: CAMPAIGN_VAULT_ABI,
    functionName: 'totalAssets',
    query: { enabled: !!effectiveVault },
    chainId: supportedChainId,
  })

  const vaultTotalAssetsNum = campaignVaultAssets
    ? Number(formatUnits(campaignVaultAssets as bigint, vaultDecimals))
    : 0

  const ethPrice = ethPriceUsd ?? 0

  // Goal is in USD (decimals depend on strategy/asset)
  const goal = campaignData?.targetStake
    ? Number(formatUnits(campaignData.targetStake, vaultDecimals))
    : 0

  // Calculate Raised in USD
  const raisedUsd = isEthStrategy ? vaultTotalAssetsNum * ethPrice : vaultTotalAssetsNum

  const progress = goal > 0 ? (raisedUsd / goal) * 100 : 0
  const status = (campaignData?.status as CampaignStatus) ?? CampaignStatus.Unknown
  const startTime = campaignData?.fundraisingStart
    ? new Date(Number(campaignData.fundraisingStart) * 1000)
    : new Date()
  const endTime = campaignData?.fundraisingEnd
    ? new Date(Number(campaignData.fundraisingEnd) * 1000)
    : new Date()
  const checkpointCount = metadata?.milestones?.length ?? 0

  // Asset composition (USD converted for ETH) for this campaign vault
  const assetComposition = useMemo(() => {
    const usdcValue = isEthStrategy ? 0 : vaultTotalAssetsNum
    const ethValue = isEthStrategy ? vaultTotalAssetsNum * ethPrice : 0
    const total = usdcValue + ethValue
    return {
      usdc: usdcValue,
      usdcPercent: total > 0 ? Math.round((usdcValue / total) * 100) : 0,
      eth: ethValue,
      ethPercent: total > 0 ? Math.round((ethValue / total) * 100) : 0,
    }
  }, [isEthStrategy, vaultTotalAssetsNum, ethPrice])

  const raisedDisplay = raisedUsd
  const progressDisplay = Math.min(progress, 100)

  useEffect(() => {
    if (hasFetched || !campaign || !id) return

    async function fetchMetadata() {
      setHasFetched(true)
      try {
        const cid = await getMetadataCID(id!)
        if (!cid) {
          setIsLoading(false)
          return
        }
        const url = getGatewayUrl(cid)
        const response = await fetch(url)
        const data = (await response.json()) as CampaignMetadata
        setMetadata(data)
      } catch (error) {
        console.error('Failed to fetch campaign metadata:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetadata()
  }, [campaign, id, hasFetched, getMetadataCID])

  // Combine cover image and gallery images for carousel - MUST be before early returns
  const carouselImages = useMemo(() => {
    const images: string[] = []

    // Add cover image first if exists
    if (metadata?.coverImage) {
      images.push(getGatewayUrl(parseCID(metadata.coverImage)))
    }

    // Add all other images
    metadata?.images?.forEach((imageCid, index) => {
      // Skip first image if it's being used as cover fallback and no explicit cover exists
      if (!metadata.coverImage && index === 0 && images.length === 0) {
        images.push(getGatewayUrl(parseCID(imageCid)))
      } else if (metadata.coverImage || index > 0) {
        images.push(getGatewayUrl(parseCID(imageCid)))
      }
    })

    return images
  }, [metadata])

  // Logo for header
  const logoUrl = metadata?.images?.[0] ? getGatewayUrl(parseCID(metadata.images[0])) : null

  // Early returns AFTER all hooks
  if (!isValidId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Invalid Campaign ID</h2>
        <p className="text-muted-foreground mb-6">
          The campaign ID &quot;{campaignId}&quot; is not valid.
        </p>
        <Link href="/campaigns">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>
      </div>
    )
  }

  if (!campaign || !campaignData?.targetStake) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  const publicVisibleStatuses = [
    CampaignStatus.Approved,
    CampaignStatus.Active,
    CampaignStatus.Completed,
  ]

  if (!isAdmin && !publicVisibleStatuses.includes(status)) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Card>
          <CardContent className="py-20 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">Campaign Under Review</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                This campaign is being reviewed by our team and is not yet publicly available.
              </p>
            </div>
            <Link href="/campaigns">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse Active Campaigns
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Yield calculations
  const depositAmount = parseFloat(stakeAmount) || 0
  const annualYield = (depositAmount * apy) / 100
  const toCampaign = (annualYield * yieldAllocation) / 100
  const toUser = annualYield - toCampaign
  const totalReturn = depositAmount + toUser

  // Projection based on existing vault balance for selected asset
  const myAnnualYield = (userVaultBalance * apy) / 100
  const myDailyYield = myAnnualYield / 365

  // Daily yield based on TVL
  const dailyYieldGeneration = (raisedUsd * (apy / 100)) / 365

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Back Button */}
      <Link
        href="/campaigns"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Campaigns
      </Link>

      {/* Admin Notice */}
      {isAdmin && !publicVisibleStatuses.includes(status) && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-medium">Admin Preview:</span> This campaign is not yet visible to
            the public.
          </p>
        </div>
      )}

      {/* Main Content Grid - 70:30 */}
      <div className="grid lg:grid-cols-10 gap-6">
        {/* Left Column - 7/10 (70%) - Sharp corners merged block */}
        <div className="lg:col-span-7">
          <div className="bg-card border border-border shadow-lg overflow-hidden">
            {/* Image with Title Overlay */}
            <ImageCarousel
              images={carouselImages}
              campaignName={metadata?.name}
              ngoName={metadata?.ngoName}
            />

            {/* Goal Summary */}
            <div className="p-6 border-t border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <p className="text-3xl font-bold text-primary">
                    ${raisedDisplay.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    raised of ${goal.toLocaleString()} goal
                    {isEthStrategy && (
                      <span className="block text-xs mt-0.5">
                        (
                        {vaultTotalAssetsNum.toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        })}{' '}
                        ETH)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-teal-600">
                    {progressDisplay.toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {Math.max(
                      0,
                      Math.ceil((endTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    )}{' '}
                    Days left
                  </span>
                </div>
              </div>
              <Progress
                value={progressDisplay}
                className="h-3 bg-teal-100"
                indicatorClassName="bg-gradient-to-r from-teal-400 to-teal-600"
              />
            </div>

            {/* About / Milestones Tabs */}
            <div className="p-6 border-t border-border">
              <Tabs value={leftTab} onValueChange={setLeftTab}>
                <TabsList className="w-full max-w-xs bg-muted/30 p-1 rounded-xl">
                  <TabsTrigger
                    value="about"
                    className="text-sm flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    About
                  </TabsTrigger>
                  <TabsTrigger
                    value="milestones"
                    className="text-sm flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Milestones
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="mt-4 space-y-4">
                  {/* Description */}
                  {isLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-muted w-full animate-pulse rounded" />
                      <div className="h-4 bg-muted w-3/4 animate-pulse rounded" />
                    </div>
                  ) : (
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm">
                      {metadata?.description ?? 'No description available'}
                    </p>
                  )}

                  {/* NGO Information */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={metadata?.ngoName}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {metadata?.ngoName?.slice(0, 1) || 'N'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold flex items-center gap-2">
                          {metadata?.ngoName ?? 'Unknown NGO'}
                          <Badge
                            variant="outline"
                            className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">Verified Organization</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {metadata?.socialLinks?.website && (
                        <a
                          href={
                            metadata.socialLinks.website.startsWith('http')
                              ? metadata.socialLinks.website
                              : `https://${metadata.socialLinks.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                            <Globe className="h-4 w-4" />
                            Website
                          </Button>
                        </a>
                      )}
                      {metadata?.socialLinks?.twitter && (
                        <a
                          href={
                            metadata.socialLinks.twitter.startsWith('http')
                              ? metadata.socialLinks.twitter
                              : `https://${metadata.socialLinks.twitter}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                            <Twitter className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="milestones" className="mt-4">
                  {/* Horizontal Milestone Timeline */}
                  {metadata?.milestones && metadata.milestones.length > 0 ? (
                    <div className="space-y-4">
                      {metadata.milestones.slice(0, 4).map((milestone, index) => {
                        const milestoneTarget = parseFloat(milestone.targetAmount || '0')
                        const isCompleted = raisedUsd >= milestoneTarget
                        const previousTarget = parseFloat(
                          metadata.milestones![index - 1]?.targetAmount || '0'
                        )
                        const isCurrent =
                          !isCompleted && (index === 0 || raisedUsd >= previousTarget)
                        const progressPercent =
                          milestoneTarget > 0
                            ? Math.min(100, (raisedUsd / milestoneTarget) * 100)
                            : 0

                        return (
                          <div
                            key={index}
                            className={`p-4 rounded-xl border ${
                              isCompleted
                                ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
                                : isCurrent
                                  ? 'bg-primary/5 border-primary/20'
                                  : 'bg-muted/30 border-border'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 ${
                                  isCompleted
                                    ? 'bg-teal-500 border-teal-500 text-white'
                                    : isCurrent
                                      ? 'bg-primary border-primary text-white'
                                      : 'bg-background border-muted-foreground/30 text-muted-foreground'
                                }`}
                              >
                                {isCompleted ? '✓' : index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium text-sm">{milestone.title}</p>
                                </div>
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">
                                      $
                                      {raisedDisplay.toLocaleString(undefined, {
                                        maximumFractionDigits: 0,
                                      })}{' '}
                                      / ${milestoneTarget.toLocaleString()}
                                    </span>
                                    <span
                                      className={
                                        isCompleted
                                          ? 'text-teal-600 font-medium'
                                          : 'text-muted-foreground'
                                      }
                                    >
                                      {progressPercent.toFixed(0)}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isCompleted
                                          ? 'bg-teal-500'
                                          : 'bg-gradient-to-r from-primary/60 to-primary'
                                      }`}
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No milestones defined</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Right Column - 3/10 (30%) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stats Card */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
            {/* Compact Stats Section */}
            <div className="p-6 space-y-4">
              {/* Row 1: Target % with Wave | TVL */}
              <div className="grid grid-cols-2 gap-3">
                {/* Target % with wave animation */}
                <div className="p-3 bg-muted/30 border border-border rounded-xl relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-1 relative z-10">
                    <Percent className="h-4 w-4 text-teal-600" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      Target
                    </span>
                  </div>
                  <p className="text-xl font-bold text-teal-600 relative z-10">
                    {progressDisplay.toFixed(1)}%
                  </p>
                  {/* Wave animation background */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-teal-500/20 to-transparent transition-all duration-1000"
                    style={{ height: `${Math.min(progressDisplay, 100)}%` }}
                  >
                    <svg
                      className="absolute top-0 left-0 w-full"
                      viewBox="0 0 100 10"
                      preserveAspectRatio="none"
                      style={{ height: '8px', transform: 'translateY(-50%)' }}
                    >
                      <path
                        d="M0,5 Q25,0 50,5 T100,5"
                        fill="none"
                        stroke="rgb(20 184 166 / 0.4)"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    </svg>
                  </div>
                </div>
                {/* TVL */}
                <div className="p-3 bg-muted/30 border border-border rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      TVL
                    </span>
                  </div>
                  <p className="text-lg font-bold">
                    ${raisedDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isEthStrategy
                      ? `${vaultTotalAssetsNum.toFixed(4)} ETH`
                      : `${vaultTotalAssetsNum.toLocaleString()} USDC`}
                  </p>
                </div>
              </div>

              {/* Row 2: APY with mini graph | Donations */}
              <div className="grid grid-cols-2 gap-3">
                {/* APY with mini line graph */}
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        APY
                      </span>
                    </div>
                    {/* Mini line graph */}
                    <svg width="40" height="16" className="text-emerald-500">
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points="0,12 8,8 16,10 24,4 32,6 40,2"
                      />
                    </svg>
                  </div>
                  <p className="text-xl font-bold text-emerald-600">{apy.toFixed(1)}%</p>
                </div>
                {/* Donations */}
                <div className="p-3 bg-muted/30 border border-border rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      Stakers
                    </span>
                  </div>
                  <p className="text-xl font-bold">{checkpointCount > 0 ? checkpointCount : 12}</p>
                </div>
              </div>

              {/* Stake Now Button */}
              <Button
                onClick={() => setIsStakeModalOpen(true)}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl"
                disabled={status !== CampaignStatus.Active}
              >
                <Wallet className="h-5 w-5 mr-2" />
                Stake Now
              </Button>
            </div>
          </div>

          {/* Announcement Section */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <span className="text-amber-600">📢</span>
              </div>
              <h3 className="font-semibold text-sm">Announcements</h3>
            </div>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {/* Mock announcements */}
              <div className="p-3 bg-muted/30 rounded-xl border-l-4 border-primary">
                <p className="text-sm font-medium">Campaign Launch Success!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  We've reached 25% of our goal in the first week!
                </p>
                <p className="text-xs text-muted-foreground mt-2">2 days ago</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border-l-4 border-muted-foreground/30">
                <p className="text-sm font-medium">Weekly Update</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Farm preparations are underway.
                </p>
                <p className="text-xs text-muted-foreground mt-2">5 days ago</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
            <h4 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recent Activity
            </h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {/* Mock donation logs */}
              {[
                { name: 'Alice.eth', amount: '500 USDC', time: '2 hours ago', avatar: 'A' },
                { name: '0x7c3...8f2d', amount: '0.25 ETH', time: '5 hours ago', avatar: '0' },
                { name: 'Bob.lens', amount: '1,200 USDC', time: '1 day ago', avatar: 'B' },
                { name: '0xf2a...c91b', amount: '0.1 ETH', time: '2 days ago', avatar: 'F' },
                { name: 'Carol.eth', amount: '300 USDC', time: '3 days ago', avatar: 'C' },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {log.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{log.name}</p>
                    <p className="text-xs text-muted-foreground">{log.time}</p>
                  </div>
                  <p className="font-semibold text-emerald-600 text-xs">{log.amount}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Your Position Card */}
          {/* <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
            <YourPositionCard address={address} stakeWeight={stakeWeight} />
          </div> */}
        </div>
      </div>

      {/* Stake Modal */}
      <Dialog open={isStakeModalOpen} onOpenChange={setIsStakeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Stake to Campaign
            </DialogTitle>
            <DialogDescription>
              Deposit funds to support this campaign and earn yield.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <DepositForm
              selectedAsset={selectedAsset}
              stakeAmount={stakeAmount}
              setStakeAmount={setStakeAmount}
              yieldAllocation={yieldAllocation}
              setYieldAllocation={setYieldAllocation}
              displayBalance={displayBalance}
              address={address}
              handleSetMax={handleSetMax}
              handleDeposit={() => {
                handleDeposit()
                // Optionally close modal after deposit
              }}
              isActionLoading={isActionLoading}
              ethDepositsEnabled={ethDepositsEnabled}
              depositAmount={depositAmount}
              apy={apy}
              toCampaign={toCampaign}
              toUser={toUser}
              totalReturn={totalReturn}
              userVaultBalance={userVaultBalance}
              myDailyYield={myDailyYield}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

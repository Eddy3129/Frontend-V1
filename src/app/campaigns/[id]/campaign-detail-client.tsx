'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount, useBalance, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { useCampaign, CampaignStatus, type CampaignConfig } from '@/hooks/useCampaign'
import { useAaveAPY, formatAPY } from '@/hooks/useAaveAPY'
import { useVault } from '@/hooks/useVault'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getGatewayUrl, parseCID, type CampaignMetadata } from '@/lib/pinata'
import {
  ArrowLeft,
  Calendar,
  Target,
  Users,
  ExternalLink,
  Shield,
  ImageIcon,
  Clock,
  Loader2,
  Check,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Wallet,
  PieChart,
  Activity,
  Globe,
  Twitter,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getContracts, ROLES, STRATEGY_IDS } from '@/config/contracts'
import { baseSepolia, ethereumSepolia } from '@/config/chains'
import { ACL_MANAGER_ABI, GIVE_VAULT_ABI, CAMPAIGN_VAULT_ABI } from '@/lib/abi'
import { ERC20_ABI } from '@/lib/abi/erc20'
import { UsdcCircleColorful, EthereumCircleColorful } from '@ant-design/web3-icons'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
  [CampaignStatus.Submitted]: 'Pending Review',
  [CampaignStatus.Approved]: 'Approved',
  [CampaignStatus.Rejected]: 'Rejected',
  [CampaignStatus.Active]: 'Active',
  [CampaignStatus.Paused]: 'Paused',
  [CampaignStatus.Cancelled]: 'Cancelled',
  [CampaignStatus.Completed]: 'Completed',
  [CampaignStatus.Unknown]: 'Unknown',
}

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
  const [expandedMilestones, setExpandedMilestones] = useState(false)
  const [ethPriceUsd, setEthPriceUsd] = useState<number | null>(null)
  const [ethPriceStale, setEthPriceStale] = useState(false)
  const [showDebug, setShowDebug] = useState(true)

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

  // Determine vault and strategy (hoisted for useVault)
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
    formattedUserUsdc, // generalized: token balance for selected asset
    formattedUserAssets,
    formattedTotalAssets,
    userAssets,
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

  // Console debug to verify admin address vs connected wallet
  useEffect(() => {
    console.debug('[CampaignDetail] Admin role check', {
      connectedAddress: address,
      chainId: activeChainId,
      aclManager: contracts?.aclManager,
      role: ROLES.CAMPAIGN_ADMIN,
      isAdmin,
    })
  }, [address, activeChainId, contracts?.aclManager, isAdmin])

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

  useEffect(() => {
    console.debug('[CampaignDetail] Strategy selection', {
      chainId: activeChainId,
      selectedNetwork,
      selectedAsset,
      strategy: selectedStrategy,
    })
  }, [activeChainId, selectedAsset, selectedNetwork, selectedStrategy])

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

  const campaignVault = campaignConfig?.vault // Alias for debug logs compatibility
  // isEthStrategy and effectiveVault are already defined above

  const vaultDecimals = isEthStrategy ? 18 : 6

  const { data: campaignVaultAssets } = useReadContract({
    address: effectiveVault,
    abi: CAMPAIGN_VAULT_ABI,
    functionName: 'totalAssets',
    query: { enabled: !!effectiveVault },
    chainId: supportedChainId,
  })

  const { data: campaignVaultSupply } = useReadContract({
    address: effectiveVault,
    abi: CAMPAIGN_VAULT_ABI,
    functionName: 'totalSupply',
    query: { enabled: !!effectiveVault },
    chainId: supportedChainId,
  })

  const { data: campaignVaultUserShares } = useReadContract({
    address: effectiveVault,
    abi: CAMPAIGN_VAULT_ABI,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!effectiveVault && !!address },
    chainId: supportedChainId,
  })

  const vaultTotalAssetsNum = campaignVaultAssets
    ? Number(formatUnits(campaignVaultAssets as bigint, vaultDecimals))
    : 0
  const vaultTotalSupplyNum = campaignVaultSupply
    ? Number(formatUnits(campaignVaultSupply as bigint, vaultDecimals))
    : 0
  const userSharesNum = campaignVaultUserShares
    ? Number(formatUnits(campaignVaultUserShares as bigint, vaultDecimals))
    : 0

  const sharePrice = vaultTotalSupplyNum > 0 ? vaultTotalAssetsNum / vaultTotalSupplyNum : 0
  const userAssetsComputed = sharePrice > 0 ? userSharesNum * sharePrice : 0

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

  // Debug log to verify vault reads / price
  useEffect(() => {
    console.debug('[Vault TVL debug]', {
      chain: supportedChainId,
      campaignVault,
      isEthStrategy,
      vaultTotalAssetsNum,
      vaultTotalSupplyNum,
      userSharesNum,
      sharePrice,
      ethPriceUsd,
      tvlUsd: raisedUsd,
    })
  }, [
    supportedChainId,
    campaignVault,
    isEthStrategy,
    vaultTotalAssetsNum,
    vaultTotalSupplyNum,
    userSharesNum,
    sharePrice,
    ethPriceUsd,
    raisedUsd,
  ])

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

  // Cover and logo handling
  const coverImageUrl = metadata?.coverImage
    ? getGatewayUrl(parseCID(metadata.coverImage))
    : metadata?.images?.[0]
      ? getGatewayUrl(parseCID(metadata.images[0]))
      : null

  const logoUrl =
    metadata?.coverImage && metadata?.images?.[0]
      ? getGatewayUrl(parseCID(metadata.images[0]))
      : null

  // Gallery excludes logo when coverImage exists
  const galleryImages =
    metadata?.images?.filter((_, index) => {
      if (metadata.coverImage && index === 0) return false // Exclude logo from gallery
      return true
    }) || []

  // Yield calculations
  const depositAmount = parseFloat(stakeAmount) || 0
  const annualYield = (depositAmount * apy) / 100
  const toCampaign = (annualYield * yieldAllocation) / 100
  const toUser = annualYield - toCampaign
  const totalReturn = depositAmount + toUser

  // Projection based on existing vault balance for selected asset
  const myAnnualYield = (userVaultBalance * apy) / 100
  const myDailyYield = myAnnualYield / 365
  const allocationOptions = [50, 75, 100] as const

  // Daily yield based on TVL
  const dailyYieldGeneration = (raisedUsd * (apy / 100)) / 365

  // Milestone target calculation (percentage of goal)
  const getMilestoneTarget = (index: number) => {
    if (!metadata?.milestones) return 0
    // Cumulative percentage - milestone 1 is 25%, milestone 2 is 60%, milestone 3 is 100%
    const cumulative = [25, 60, 100]
    return (goal * (cumulative[index] || 100)) / 100
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
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

      {/* Hero Section - NGO Style */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-72 w-full bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-2xl border-x border-t overflow-hidden">
          72
          {coverImageUrl && (
            <Image
              src={coverImageUrl}
              alt={metadata?.name || 'Campaign cover'}
              fill
              className="object-cover"
              priority
            />
          )}
        </div>

        {/* Logo positioned at bottom */}
        <div className="absolute -bottom-12 left-8">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl rounded-2xl">
            <AvatarImage src={logoUrl || undefined} alt={metadata?.name} className="object-cover" />
            <AvatarFallback className="text-2xl bg-primary/5 text-primary rounded-2xl">
              {metadata?.name?.slice(0, 2).toUpperCase() || 'CA'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Campaign Header */}
      <div className="pt-14 px-1">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              {isLoading ? (
                <div className="h-8 bg-muted rounded w-64 animate-pulse" />
              ) : (
                <h1 className="text-2xl md:text-3xl font-bold">
                  {metadata?.name ?? 'Unnamed Campaign'}
                </h1>
              )}
              <Badge variant="outline" className={statusColors[status]}>
                {statusLabels[status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              by <span className="font-medium">{metadata?.ngoName ?? 'Unknown NGO'}</span>
            </p>
            {metadata?.category && (
              <Badge variant="secondary" className="mt-1">
                {metadata.category}
              </Badge>
            )}
          </div>

          {/* Social Links */}
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
                <Button variant="outline" size="sm" className="gap-2">
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
                <Button variant="outline" size="sm" className="gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Column - 3/5 */}
        <div className="lg:col-span-3 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                About this Campaign
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full animate-pulse" />
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                </div>
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {metadata?.description ?? 'No description available'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Milestones - Step by Step */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Campaign Milestones
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {checkpointCount > 0
                      ? `${checkpointCount} milestones to achieve campaign goals`
                      : 'No milestones defined'}
                  </CardDescription>
                </div>
                {checkpointCount > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedMilestones(!expandedMilestones)}
                    className="text-muted-foreground"
                  >
                    {expandedMilestones ? 'Show Current' : 'Show All'}
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 ml-1 transition-transform',
                        expandedMilestones && 'rotate-180'
                      )}
                    />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-1/3" />
                      <div className="h-4 bg-muted rounded w-full" />
                    </div>
                  </div>
                </div>
              ) : checkpointCount === 0 ? (
                <p className="text-muted-foreground text-sm">No milestones defined</p>
              ) : (
                <div className="relative">
                  {/* Vertical line - only show when expanded */}
                  {expandedMilestones && (
                    <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
                  )}

                  <div className="space-y-4">
                    {(metadata?.milestones ?? []).map((milestone, index) => {
                      const milestoneTarget = getMilestoneTarget(index)
                      const isCompleted = raisedUsd >= milestoneTarget
                      const isCurrent =
                        !isCompleted && (index === 0 || raisedUsd >= getMilestoneTarget(index - 1))

                      // Only show current milestone unless expanded
                      if (!expandedMilestones && !isCurrent && !isCompleted) return null
                      // When collapsed, only show current
                      if (!expandedMilestones && isCompleted && !isCurrent) return null
                      // Actually, just show current when collapsed
                      if (!expandedMilestones && !isCurrent) return null

                      return (
                        <div key={index} className="relative flex gap-4">
                          {/* Step indicator */}
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10',
                              isCompleted
                                ? 'bg-emerald-500 text-white'
                                : isCurrent
                                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                                  : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <span className="font-bold">{index + 1}</span>
                            )}
                          </div>

                          {/* Content */}
                          <div
                            className={cn(
                              'flex-1 pb-2',
                              isCurrent && 'bg-primary/5 -m-3 p-3 rounded-lg'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="font-semibold text-base">{milestone.title}</h4>
                                {isCurrent && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs mt-1 bg-primary/10 text-teal-900 dark:text-teal-100 border-primary/20"
                                  >
                                    Current Goal
                                  </Badge>
                                )}
                                {isCompleted && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs mt-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  >
                                    Completed
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-lg">
                                  {`$${milestoneTarget.toLocaleString()}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {((milestoneTarget / goal) * 100).toFixed(0)}% of TVL
                                </p>
                              </div>
                            </div>

                            {/* Progress for current milestone */}
                            {isCurrent && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span>
                                    {isEthStrategy
                                      ? `${vaultTotalAssetsNum.toLocaleString()} ETH ($${raisedUsd.toLocaleString()})`
                                      : `$${raisedUsd.toLocaleString()}`}{' '}
                                    raised
                                  </span>
                                  <span>{((raisedUsd / milestoneTarget) * 99).toFixed(1)}%</span>
                                </div>
                                <Progress
                                  value={(raisedUsd / milestoneTarget) * 99}
                                  className="h-3 bg-teal-100"
                                  indicatorClassName="bg-teal-500"
                                />
                              </div>
                            )}

                            <p className="text-sm text-muted-foreground mt-3 text-justify pr-4">
                              {milestone.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gallery */}
          {galleryImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Gallery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {galleryImages.map((imageCid, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer"
                    >
                      <Image
                        src={getGatewayUrl(parseCID(imageCid))}
                        alt={`Image ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - 2/5 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Funding Progress Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-bold">
                      ${raisedUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      of ${goal.toLocaleString()} goal
                      {selectedAsset === 'ETH' && ethPriceStale && (
                        <span className="ml-2 text-amber-500">(price stale)</span>
                      )}
                      {isEthStrategy && (
                        <span className="block text-xs text-muted-foreground mt-1">
                          (
                          {vaultTotalAssetsNum.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })}{' '}
                          ETH)
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-teal-600">{progressDisplay.toFixed(1)}%</p>
                </div>
                <Progress
                  value={progressDisplay}
                  className="h-3 bg-teal-100"
                  indicatorClassName="bg-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Starts</p>
                  <p className="font-medium text-sm">{startTime.toLocaleDateString()}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Ends</p>
                  <p className="font-medium text-sm">{endTime.toLocaleDateString()}</p>
                </div>
              </div>

              {/* Daily Yield Generation */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Daily Yield Generation
                    </span>
                  </div>
                  <p className="font-bold text-emerald-600">
                    ${dailyYieldGeneration.toFixed(4)}/day
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Interaction Card */}
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="pb-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="deposit" className="text-sm">
                    <Wallet className="h-4 w-4 mr-2" />
                    Deposit
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="text-sm">
                    <PieChart className="h-4 w-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="pt-4">
                <TabsContent value="deposit" className="mt-0 space-y-4">
                  {/* Asset Selection with Icons Only - Restricted based on strategy */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Asset</p>
                    <div className="grid grid-cols-1 gap-3">
                      {/* Only show the allowed asset */}
                      <button
                        className={cn(
                          'flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all cursor-default border-primary bg-primary/5'
                        )}
                        disabled
                      >
                        {selectedAsset === 'USDC' ? (
                          <UsdcCircleColorful style={{ fontSize: 28 }} />
                        ) : (
                          <EthereumCircleColorful style={{ fontSize: 28 }} />
                        )}
                        <span className="font-medium">{selectedAsset}</span>
                      </button>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Amount</span>
                      <span className="text-muted-foreground">
                        Balance:{' '}
                        {displayBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="pr-20 text-lg h-12"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-primary"
                          onClick={handleSetMax}
                          disabled={!address}
                        >
                          MAX
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Yield Allocation */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Yield Allocation to Campaign</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[50, 75, 100].map((percent) => (
                        <button
                          key={percent}
                          onClick={() => setYieldAllocation(percent)}
                          className={cn(
                            'py-2.5 rounded-lg border-2 text-sm font-semibold transition-all',
                            yieldAllocation === percent
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          {percent}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Yield Estimation */}
                  {depositAmount > 0 && (
                    <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                      <h4 className="font-semibold text-sm">Yield Estimation (Annual)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deposit</span>
                          <span className="font-medium flex items-center gap-1">
                            {depositAmount.toFixed(2)}
                            {selectedAsset === 'USDC' ? (
                              <UsdcCircleColorful style={{ fontSize: 16 }} />
                            ) : (
                              <EthereumCircleColorful style={{ fontSize: 16 }} />
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">APY</span>
                          <span className="font-medium text-emerald-600">{formatAPY(apy)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-primary">
                          <span>To Campaign ({yieldAllocation}%)</span>
                          <span className="font-medium flex items-center gap-1">
                            {toCampaign.toFixed(4)}
                            {selectedAsset === 'USDC' ? (
                              <UsdcCircleColorful style={{ fontSize: 16 }} />
                            ) : (
                              <EthereumCircleColorful style={{ fontSize: 16 }} />
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-emerald-600">
                          <span>To You ({100 - yieldAllocation}%)</span>
                          <span className="font-medium flex items-center gap-1">
                            {toUser.toFixed(4)}
                            {selectedAsset === 'USDC' ? (
                              <UsdcCircleColorful style={{ fontSize: 16 }} />
                            ) : (
                              <EthereumCircleColorful style={{ fontSize: 16 }} />
                            )}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>You Get Back</span>
                          <span className="flex items-center gap-1">
                            {totalReturn.toFixed(4)}
                            {selectedAsset === 'USDC' ? (
                              <UsdcCircleColorful style={{ fontSize: 16 }} />
                            ) : (
                              <EthereumCircleColorful style={{ fontSize: 16 }} />
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Your Balance Projections */}
                  {userVaultBalance > 0 && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                      <h4 className="font-semibold text-sm">Your Balance ({selectedAsset})</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Balance</span>
                        <span className="font-semibold">
                          {userVaultBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
                          {selectedAsset}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Est. Daily Yield</span>
                        <span className="font-semibold">
                          {myDailyYield.toFixed(8)} {selectedAsset}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full h-12 text-base font-semibold"
                    disabled={
                      !stakeAmount ||
                      parseFloat(stakeAmount) <= 0 ||
                      isActionLoading ||
                      (selectedAsset === 'ETH' && !ethDepositsEnabled)
                    }
                    onClick={handleDeposit}
                  >
                    {isActionLoading ? 'Processing...' : 'Deposit Now'}
                  </Button>
                </TabsContent>

                <TabsContent value="analytics" className="mt-0 space-y-4">
                  {/* Asset Composition */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      Asset Composition
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <UsdcCircleColorful style={{ fontSize: 24 }} />
                          <span className="font-medium">USDC</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${assetComposition.usdc.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {assetComposition.usdcPercent}%
                          </p>
                        </div>
                      </div>
                      {assetComposition.eth > 0 && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <EthereumCircleColorful style={{ fontSize: 24 }} />
                            <span className="font-medium">ETH</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${assetComposition.eth.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {assetComposition.ethPercent}%
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Yield Stats */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Yield Statistics
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Current APY</span>
                        <span className="font-bold text-emerald-600">{formatAPY(apy)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Daily Yield</span>
                        <span className="font-bold">${dailyYieldGeneration.toFixed(2)}/day</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Est. Monthly Yield</span>
                        <span className="font-bold">${(dailyYieldGeneration * 30).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Campaign Stats */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Campaign Stats
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Total Value Locked (USD)
                        </span>
                        <span className="font-bold">
                          ${raisedUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {isEthStrategy && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm text-muted-foreground">Vault Assets</span>
                          <span className="font-bold">
                            {vaultTotalAssetsNum.toLocaleString(undefined, {
                              maximumFractionDigits: 6,
                            })}{' '}
                            ETH
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Funding Progress</span>
                        <span className="font-bold text-teal-600">
                          {progressDisplay.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Target TVL</span>
                        <span className="font-bold">${goal.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* {showDebug && (
                      <div className="p-3 rounded-lg bg-muted/60 border text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Vault</span>
                          <span className="font-mono text-[10px] break-all">{campaignVault ?? 'n/a'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Strategy</span>
                          <span>{isEthStrategy ? 'ETH' : 'USDC'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Assets</span>
                          <span>{vaultTotalAssetsNum.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Supply</span>
                          <span>{vaultTotalSupplyNum.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>User Shares</span>
                          <span>{userSharesNum.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Share Price</span>
                          <span>{sharePrice.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ETH Price</span>
                          <span>{ethPriceUsd ?? 'n/a'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>TVL USD</span>
                          <span>{raisedUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    )} */}
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Your Position */}
          {!!address && stakeWeight !== undefined && BigInt(String(stakeWeight)) > 0n && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <UsdcCircleColorful style={{ fontSize: 40 }} />
                  <div>
                    <p className="text-2xl font-bold">
                      {formatUnits(BigInt(String(stakeWeight)), 6)}
                    </p>
                    <p className="text-sm text-muted-foreground">staked USDC</p>
                  </div>
                </div>
                <Link href="/dashboard" className="mt-4 block">
                  <Button variant="outline" className="w-full">
                    Manage Position
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

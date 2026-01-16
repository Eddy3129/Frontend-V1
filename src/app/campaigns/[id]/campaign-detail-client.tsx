'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { useCampaign, CampaignStatus, type CampaignConfig } from '@/hooks/useCampaign'
import { useAaveAPY } from '@/hooks/useAaveAPY'
import { useVault } from '@/hooks/useVault'
import { useStakers } from '@/hooks/useStakers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { getGatewayUrl, parseCID, type CampaignMetadata } from '@/lib/pinata'
import { ArrowLeft, Clock, Target, TrendingUp, Vote, Users, Wallet } from 'lucide-react'
import { getContracts, ROLES, STRATEGY_IDS } from '@/config/contracts'
import { baseSepolia, ethereumSepolia } from '@/config/chains'
import { ACL_MANAGER_ABI, CAMPAIGN_VAULT_ABI } from '@/lib/abi'
import { ERC20_ABI } from '@/lib/abi/erc20'
import { toast } from 'sonner'
import { useBalance } from 'wagmi'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Import child components
import { ImageCarousel } from './components/ImageCarousel'
import { StakeModal } from './components/StakeModal'
import { MilestonesCard } from './components/MilestonesCard'
import { DepositForm } from './components/DepositForm'
import { AnalyticsTab } from './components/AnalyticsTab'
import { CheckpointVoting } from './components/CheckpointVoting'
import { StakersLeaderboard } from './components/StakersLeaderboard'
import { VotingPowerCard } from './components/VotingPowerCard'

import { GoalSummary } from './components/GoalSummary'
import { AboutSection } from './components/AboutSection'
import { AnnouncementsCard } from './components/AnnouncementsCard'
import { MilestonesTimeline } from './components/MilestonesTimeline'
import { StakeButton } from './components/StakeButton'
import { RecentActivity } from './components/RecentActivity'

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

  const { useGetCampaign, useGetStakeWeight, getMetadataCID } = useCampaign()
  const { data: campaignData } = useGetCampaign(id)
  const campaign = campaignData?.campaign
  const campaignChainId = campaignData?.chainId
  const { address, chainId } = useAccount()

  // Use campaign's chain if available, otherwise fall back to user's chain or default
  const supportedChainId = campaignChainId ?? chainId ?? baseSepolia.id
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

  // Fetch staker data for leaderboard
  const { topStakers, totalStakers, isLoading: isStakersLoading } = useStakers(id, supportedChainId)

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
    withdraw,
    isWithdrawPending,
    isWithdrawConfirming,
    isWithdrawConfirmed,
    withdrawError,
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
    chainId: supportedChainId as 84532 | 11155111 | undefined,
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

  const isActionLoading =
    isApprovePending ||
    isApproveConfirming ||
    isDepositPending ||
    isDepositConfirming ||
    isWithdrawPending ||
    isWithdrawConfirming

  const handleDeposit = async (amount: string) => {
    const amountNum = parseFloat(amount || '0')
    if (!address) {
      toast.error('Connect your wallet to deposit', { id: 'deposit' })
      return
    }
    if (!contracts?.usdcVault) {
      toast.error('Unsupported network for deposits.')
      return
    }
    if (!amountNum || amountNum <= 0) return

    try {
      if (selectedAsset === 'USDC') {
        if (!hasAllowance(amount)) {
          toast.loading('Approving USDC...', { id: 'approve' })
          approveMax()
          return
        }
        toast.loading('Depositing USDC...', { id: 'deposit' })
        deposit(amount)
      } else {
        toast.loading('Depositing ETH...', { id: 'deposit' })
        deposit(amount)
      }
    } catch (error) {
      console.error('[CampaignDetail] Deposit failed', error)
      toast.error('Deposit failed', { id: 'deposit' })
    }
  }

  const handleWithdraw = async (amount: string) => {
    const amountNum = parseFloat(amount || '0')
    if (!address) return
    if (!amountNum || amountNum <= 0) return

    try {
      toast.loading('Withdrawing stake...', { id: 'withdraw' })
      withdraw(amount)
    } catch (error) {
      console.error('[CampaignDetail] Withdraw failed', error)
      toast.error('Withdraw failed', { id: 'withdraw' })
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
    if (isWithdrawConfirmed) {
      toast.success('Stake withdrawn successfully!', { id: 'withdraw' })
      refetchAll()
    }
  }, [isWithdrawConfirmed, refetchAll])

  useEffect(() => {
    const err = depositError || withdrawError
    if (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed'
      // Use different IDs to allow both to show if needed, but usually only one is active
      toast.error(message, { id: 'deposit' })
      toast.error(message, { id: 'withdraw' })
      console.error('[CampaignDetail] Transaction error', err)
    }
  }, [depositError, withdrawError])

  // Parse campaign data safely
  const parsedCampaignData = campaign as
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
    query: { enabled: !!effectiveVault && !!campaignChainId },
    chainId: (campaignChainId ?? supportedChainId) as 84532 | 11155111 | undefined,
  })

  const vaultTotalAssetsNum = campaignVaultAssets
    ? Number(formatUnits(campaignVaultAssets as bigint, vaultDecimals))
    : 0

  const ethPrice = ethPriceUsd ?? 0

  // Goal is in USD (decimals depend on strategy/asset)
  const goal = parsedCampaignData?.targetStake
    ? Number(formatUnits(parsedCampaignData.targetStake, vaultDecimals))
    : 0

  // Calculate Raised in USD
  const raisedUsd = isEthStrategy ? vaultTotalAssetsNum * ethPrice : vaultTotalAssetsNum

  const progress = goal > 0 ? (raisedUsd / goal) * 100 : 0
  const status = (parsedCampaignData?.status as CampaignStatus) ?? CampaignStatus.Unknown
  const startTime = parsedCampaignData?.fundraisingStart
    ? new Date(Number(parsedCampaignData.fundraisingStart) * 1000)
    : new Date()
  const endTime = parsedCampaignData?.fundraisingEnd
    ? new Date(Number(parsedCampaignData.fundraisingEnd) * 1000)
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

    // For existing campaigns (old style), the logo was prepended to the images array.
    // If ngoLogo is missing, we assume metadata.images[0] is the logo and skip it.
    const isOldStyle = metadata && !metadata.ngoLogo

    // Add gallery images
    metadata?.images?.forEach((imageCid, index) => {
      if (isOldStyle && index === 0) return
      images.push(getGatewayUrl(parseCID(imageCid)))
    })

    return images
  }, [metadata])

  // Logo for header
  const logoUrl = metadata?.ngoLogo
    ? getGatewayUrl(parseCID(metadata.ngoLogo))
    : metadata?.images?.[0]
      ? getGatewayUrl(parseCID(metadata.images[0]))
      : null

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

  if (!campaign || !parsedCampaignData?.targetStake) {
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

  // Projections based on existing vault balance for selected asset
  const myAnnualYield = (userVaultBalance * apy) / 100
  const myDailyYield = myAnnualYield / 365

  // Daily yield based on TVL
  const dailyYieldGeneration = (raisedUsd * (apy / 100)) / 365

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Main Content Grid - 70:30 */}
      <div className="grid lg:grid-cols-10 gap-6 items-start">
        {/* Left Column - 7/10 (70%) - Sharp corners merged block */}
        <div className="lg:col-span-7 h-full">
          <div className="bg-card border border-border shadow-lg overflow-hidden h-full flex flex-col">
            {/* Image with Title Overlay */}
            <ImageCarousel
              images={carouselImages}
              campaignName={metadata?.name}
              ngoName={metadata?.ngoName}
            />

            {/* Goal Summary */}
            <GoalSummary
              raisedDisplay={raisedDisplay}
              goal={goal}
              progressDisplay={progressDisplay}
              endTime={endTime}
              isEthStrategy={isEthStrategy}
              vaultTotalAssetsNum={vaultTotalAssetsNum}
              apy={apy}
              totalStakers={totalStakers as number}
              ngoName={metadata?.ngoName}
              ngoWebsite={metadata?.socialLinks?.website}
              metadata={metadata}
            />

            {/* About / Milestones Tabs */}
            <div className="px-8 pt-4 pb-6 border-t border-border flex-1">
              <Tabs value={leftTab} onValueChange={setLeftTab} className="h-full flex flex-col">
                <TabsList className="w-fit bg-muted/20 p-1 rounded-2xl gap-1.5">
                  <TabsTrigger
                    value="about"
                    className="text-sm px-6 py-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    About
                  </TabsTrigger>
                  <TabsTrigger
                    value="milestones"
                    className="text-sm px-6 py-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Milestones
                  </TabsTrigger>
                  <TabsTrigger
                    value="governance"
                    className="text-sm px-6 py-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
                  >
                    <Vote className="h-4 w-4 mr-2" />
                    Governance
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-4 flex-1">
                  <AboutSection metadata={metadata} isLoading={isLoading} />
                </TabsContent>

                <TabsContent value="milestones" className="flex-1">
                  <MilestonesTimeline milestones={metadata?.milestones} raisedUsd={raisedUsd} />
                </TabsContent>

                <TabsContent value="governance" className="flex-1">
                  <CheckpointVoting
                    campaignId={id!}
                    milestones={metadata?.milestones}
                    chainId={supportedChainId}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-6 self-stretch">
          {/* Announcement Section */}
          {/* <AnnouncementsCard /> */}

          {/* Leaderboard and Staking Action */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
            <StakersLeaderboard
              campaignId={id!}
              maxStakers={5}
              showViewAll={true}
              chainId={supportedChainId}
              status={status}
              onStake={() => setIsStakeModalOpen(true)}
            />
          </div>

          {/* Recent Activity Section */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg flex-1 flex flex-col min-h-[400px]">
            <RecentActivity
              campaignId={id!}
              vaultAddress={effectiveVault}
              chainId={supportedChainId}
            />
          </div>

          {/* Voting Power Card */}
          {address && !!stakeWeight && BigInt(String(stakeWeight)) > 0n && (
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <VotingPowerCard
                votingPower={BigInt(String(stakeWeight))}
                votingPowerPercent={
                  parsedCampaignData?.totalStaked &&
                  BigInt(String(parsedCampaignData.totalStaked)) > 0n
                    ? (Number(stakeWeight) / Number(parsedCampaignData.totalStaked)) * 100
                    : 0
                }
                onViewGovernance={() => setLeftTab('governance')}
              />
            </div>
          )}
        </div>
      </div>

      <StakeModal
        isOpen={isStakeModalOpen}
        onClose={() => setIsStakeModalOpen(false)}
        selectedAsset={selectedAsset}
        displayBalance={displayBalance}
        userVaultBalance={userVaultBalance}
        apy={apy}
        isActionLoading={isActionLoading}
        handleDeposit={handleDeposit}
        handleWithdraw={handleWithdraw}
        isEthStrategy={isEthStrategy}
      />
    </div>
  )
}

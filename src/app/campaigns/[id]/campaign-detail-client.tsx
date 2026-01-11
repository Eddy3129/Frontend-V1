'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { useCampaign, CampaignStatus, type CampaignConfig } from '@/hooks/useCampaign'
import { useAaveAPY } from '@/hooks/useAaveAPY'
import { useVault } from '@/hooks/useVault'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getGatewayUrl, parseCID, type CampaignMetadata } from '@/lib/pinata'
import { ArrowLeft, Clock, Shield, Wallet, PieChart } from 'lucide-react'
import Link from 'next/link'
import { getContracts, ROLES, STRATEGY_IDS } from '@/config/contracts'
import { baseSepolia, ethereumSepolia } from '@/config/chains'
import { ACL_MANAGER_ABI, CAMPAIGN_VAULT_ABI } from '@/lib/abi'
import { ERC20_ABI } from '@/lib/abi/erc20'
import { toast } from 'sonner'
import { useBalance } from 'wagmi'

// Import child components
import { CampaignHero } from './components/CampaignHero'
import { CampaignHeader } from './components/CampaignHeader'
import { CampaignDescription } from './components/CampaignDescription'
import { MilestonesCard } from './components/MilestonesCard'
import { GalleryCard } from './components/GalleryCard'
import { FundingProgressCard } from './components/FundingProgressCard'
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

  // Daily yield based on TVL
  const dailyYieldGeneration = (raisedUsd * (apy / 100)) / 365

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

      {/* Hero Section */}
      <CampaignHero coverImageUrl={coverImageUrl} logoUrl={logoUrl} campaignName={metadata?.name} />

      {/* Campaign Header */}
      <CampaignHeader metadata={metadata} status={status} isLoading={isLoading} />

      <Separator />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Column - 3/5 */}
        <div className="lg:col-span-3 space-y-6">
          <CampaignDescription description={metadata?.description} isLoading={isLoading} />

          <MilestonesCard
            milestones={metadata?.milestones}
            goal={goal}
            raisedUsd={raisedUsd}
            vaultTotalAssetsNum={vaultTotalAssetsNum}
            isEthStrategy={isEthStrategy}
            isLoading={isLoading}
            checkpointCount={checkpointCount}
          />

          <GalleryCard galleryImages={galleryImages} />
        </div>

        {/* Right Column - 2/5 */}
        <div className="lg:col-span-2 space-y-6">
          <FundingProgressCard
            raisedUsd={raisedDisplay}
            goal={goal}
            progressDisplay={progressDisplay}
            startTime={startTime}
            endTime={endTime}
            dailyYieldGeneration={dailyYieldGeneration}
            selectedAsset={selectedAsset}
            ethPriceStale={ethPriceStale}
            isEthStrategy={isEthStrategy}
            vaultTotalAssetsNum={vaultTotalAssetsNum}
          />

          {/* Tabbed Interaction Card */}
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="px-6 pt-6 pb-0">
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
              </div>

              <div className="px-6 pb-6 pt-4">
                <TabsContent value="deposit" className="mt-0">
                  <DepositForm
                    selectedAsset={selectedAsset}
                    stakeAmount={stakeAmount}
                    setStakeAmount={setStakeAmount}
                    yieldAllocation={yieldAllocation}
                    setYieldAllocation={setYieldAllocation}
                    displayBalance={displayBalance}
                    address={address}
                    handleSetMax={handleSetMax}
                    handleDeposit={handleDeposit}
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
                </TabsContent>

                <TabsContent value="analytics" className="mt-0">
                  <AnalyticsTab
                    assetComposition={assetComposition}
                    apy={apy}
                    dailyYieldGeneration={dailyYieldGeneration}
                    raisedUsd={raisedUsd}
                    progressDisplay={progressDisplay}
                    goal={goal}
                    isEthStrategy={isEthStrategy}
                    vaultTotalAssetsNum={vaultTotalAssetsNum}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </Card>

          <YourPositionCard address={address} stakeWeight={stakeWeight} />
        </div>
      </div>
    </div>
  )
}

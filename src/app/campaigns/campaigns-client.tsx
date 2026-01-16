'use client'

import { useState, useMemo, useEffect } from 'react'
import { useCampaign, CampaignStatus, type CampaignConfig } from '@/hooks/useCampaign'
import { CampaignCard } from '@/components/campaigns/CampaignCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, Heart, Filter, Shield, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useConnection, useReadContract, useReadContracts } from 'wagmi'
import { getContracts, ROLES, STRATEGY_IDS } from '@/config/contracts'
import { ethereumSepolia } from '@/config/chains'
import { ACL_MANAGER_ABI, CAMPAIGN_VAULT_ABI } from '@/lib/abi'
import { formatUnits, type Abi } from 'viem'

export function CampaignsClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus | 'all'>(
    CampaignStatus.Active
  )
  const [ethPriceUsd, setEthPriceUsd] = useState<number>(0)

  const {
    campaignCount,
    useGetCampaigns,
    useGetActiveCampaigns,
    campaignIds: rawCampaignIds,
  } = useCampaign()
  const { address } = useConnection()

  const count = Number(campaignCount ?? 0n)
  // Use Ethereum Sepolia for admin role checks (adjust if your admin roles are on Base)
  const contracts = getContracts(ethereumSepolia.id)

  // Fetch ETH price for TVL calculation
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        )
        const json = await res.json()
        if (json?.ethereum?.usd) {
          setEthPriceUsd(Number(json.ethereum.usd))
        }
      } catch (err) {
        console.error('Failed to fetch ETH price', err)
      }
    }
    fetchPrice()
  }, [])

  // Check if user is campaign admin (only when wallet is connected)
  const { data: isAdminData } = useReadContract({
    address: contracts?.aclManager,
    abi: ACL_MANAGER_ABI,
    functionName: 'hasRole',
    args: [ROLES.CAMPAIGN_ADMIN, address ?? '0x0000000000000000000000000000000000000000'],
    chainId: ethereumSepolia.id,
    query: {
      enabled: !!contracts?.aclManager && !!address, // Only check when connected
    },
  })

  const isAdmin = Boolean(isAdminData)

  // Get all campaigns (up to 50) - No wallet required for public viewing
  const { data: allCampaigns } = useGetCampaigns(0, Math.min(count, 50))

  // Use real campaign IDs
  const campaignIds = (rawCampaignIds as `0x${string}`[]) || []

  // Filter campaigns for public view
  const allowedStatuses = useMemo(
    () =>
      isAdmin
        ? [CampaignStatus.Approved, CampaignStatus.Active, CampaignStatus.Completed]
        : [CampaignStatus.Active, CampaignStatus.Completed],
    [isAdmin]
  )

  const filteredCampaignIds = useMemo(() => {
    if (!allCampaigns) return campaignIds

    return campaignIds.filter((id) => {
      const campaign = (allCampaigns as CampaignConfig[]).find((c) => c.id === id)
      if (!campaign) return false

      // Check if allowed status
      if (!allowedStatuses.includes(campaign.status)) return false

      // Apply status filter
      if (selectedStatus !== 'all' && campaign.status !== selectedStatus) return false

      return true
    })
  }, [allCampaigns, campaignIds, allowedStatuses, selectedStatus])

  // Get active campaigns for TVL calculation
  const activeCampaigns = useMemo(() => {
    if (!allCampaigns) return []
    return (allCampaigns as CampaignConfig[]).filter((c) => c.status === CampaignStatus.Active)
  }, [allCampaigns])

  // Fetch vault assets for all active campaigns
  const { data: vaultAssets } = useReadContracts({
    contracts: activeCampaigns.map((campaign) => {
      const isEth = campaign.strategyId === STRATEGY_IDS.AAVE_ETH
      const defaultVault = isEth ? contracts?.ethVault : contracts?.usdcVault
      const vaultAddress =
        campaign.vault && campaign.vault !== '0x0000000000000000000000000000000000000000'
          ? campaign.vault
          : defaultVault

      return {
        address: vaultAddress,
        abi: CAMPAIGN_VAULT_ABI as Abi,
        functionName: 'totalAssets',
        chainId: ethereumSepolia.id, // Current limitation: assumes Eth Sepolia or synced state
      }
    }),
    query: {
      enabled: activeCampaigns.length > 0,
    },
  })

  // Calculate total staked across all active campaigns
  const totalStaked = useMemo(() => {
    if (!activeCampaigns || !vaultAssets) return 0

    return activeCampaigns.reduce((sum, campaign, index) => {
      const result = vaultAssets[index]
      if (result.status !== 'success' || !result.result) return sum

      const assets = result.result as bigint
      const isEth = campaign.strategyId === STRATEGY_IDS.AAVE_ETH

      let usdValue = 0
      if (isEth) {
        const ethValue = Number(formatUnits(assets, 18))
        usdValue = ethValue * ethPriceUsd
      } else {
        usdValue = Number(formatUnits(assets, 6)) // USDC
      }

      return sum + usdValue
    }, 0)
  }, [activeCampaigns, vaultAssets, ethPriceUsd])

  // Count active campaigns
  const activeCampaignCount = activeCampaigns.length

  const statusFilters = [
    { value: 'all', label: 'All Campaigns' },
    { value: CampaignStatus.Active, label: 'Active' },
    ...(isAdmin ? [{ value: CampaignStatus.Approved, label: 'Approved' }] : []),
    { value: CampaignStatus.Completed, label: 'Completed' },
    ...(isAdmin ? [{ value: CampaignStatus.Submitted, label: 'Pending' }] : []),
  ]

  const currentFilter = statusFilters.find((f) => f.value === selectedStatus)

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground text-lg">
            Browse and support campaigns from verified NGOs
          </p>
        </div>

        {/* Summary Stats - Top Right */}
        <div className="flex gap-4">
          <div className="text-right border border-border rounded-lg px-4 py-3 bg-card/50">
            <p className="text-sm text-muted-foreground">Total Staked</p>
            <p className="text-2xl font-bold">
              ${totalStaked.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="text-right border border-border rounded-lg px-4 py-3 bg-card/50">
            <p className="text-sm text-muted-foreground">Active Campaigns</p>
            <p className="text-2xl font-bold">{activeCampaignCount}</p>
          </div>
        </div>
      </div>

      {/* Search, Filter & Create Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns..."
            className="pl-11 h-11"
          />
        </div>

        {/* Status Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="shrink-0 gap-2 h-11">
              <Filter className="h-4 w-4" />
              {currentFilter?.label || 'All Campaigns'}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {statusFilters.map((filter) => (
              <DropdownMenuItem
                key={filter.value}
                onClick={() => setSelectedStatus(filter.value as CampaignStatus | 'all')}
                className="cursor-pointer"
              >
                {filter.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex gap-3">
          {isAdmin && (
            <Link href="/campaigns/admin" className="shrink-0">
              <Button variant="outline" className="gap-2 w-full sm:w-auto h-11">
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          )}
          <Link href="/campaigns/create" className="shrink-0">
            <Button className="btn-brand w-full sm:w-auto h-11">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Campaigns Grid */}
      {filteredCampaignIds.length === 0 ? (
        <EmptyState message={`No ${currentFilter?.label.toLowerCase()} yet`} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaignIds.map((id) => (
            <CampaignCard key={id.toString()} campaignId={id} hideIfNoMetadata />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ message = 'No campaigns yet' }: { message?: string }) {
  return (
    <Card className="card-highlight">
      <CardContent className="py-20 text-center space-y-6">
        <div className="icon-box-brand-xl mx-auto">
          <Heart className="h-8 w-8" />
        </div>
        <div className="space-y-3">
          <h3 className="text-xl font-semibold">{message}</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Be the first to create a campaign and start receiving yield donations from the
            community.
          </p>
        </div>
        <Link href="/campaigns/create">
          <Button className="btn-brand mt-2">
            <Plus className="mr-2 h-4 w-4" />
            Create the First Campaign
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { useCampaign, CampaignStatus, type CampaignConfig } from '@/hooks/useCampaign'
import { CampaignCard } from '@/components/campaigns/CampaignCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Heart, Filter, Clock, Shield, CheckCircle2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useAccount, useReadContract } from 'wagmi'
import { getContracts, ROLES } from '@/config/contracts'
import { baseSepolia } from '@/config/chains'
import { ACL_MANAGER_ABI } from '@/lib/abi'

export function CampaignsClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const {
    campaignCount,
    useGetCampaigns,
    useGetActiveCampaigns,
    campaignIds: rawCampaignIds,
  } = useCampaign()
  const { address, chainId } = useAccount()

  const count = Number(campaignCount ?? 0n)
  const activeChainId = chainId ?? baseSepolia.id
  const contracts = getContracts(activeChainId)

  // Check if user is campaign admin
  const { data: isAdminData } = useReadContract({
    address: contracts?.aclManager,
    abi: ACL_MANAGER_ABI,
    functionName: 'hasRole',
    args: [ROLES.CAMPAIGN_ADMIN, address ?? '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: !!contracts?.aclManager && !!address,
    },
  })

  const isAdmin = Boolean(isAdminData)

  // Get all campaigns (up to 50)
  const { data: allCampaigns } = useGetCampaigns(0, Math.min(count, 50))
  const { data: _activeCampaigns } = useGetActiveCampaigns()

  // Use real campaign IDs
  const campaignIds = (rawCampaignIds as `0x${string}`[]) || []

  // Filter campaigns for public view: only show Approved or Active
  // Non-admins should not see Submitted, Rejected, Paused, Cancelled campaigns
  const allowedStatuses = useMemo(
    () =>
      isAdmin
        ? [CampaignStatus.Approved, CampaignStatus.Active, CampaignStatus.Completed]
        : [CampaignStatus.Active, CampaignStatus.Completed],
    [isAdmin]
  )

  const getVisibleCampaignIds = (statusFilter?: CampaignStatus) => {
    if (!allCampaigns) return campaignIds

    return campaignIds.filter((id) => {
      const campaign = (allCampaigns as CampaignConfig[]).find((c) => c.id === id)
      if (!campaign) return false

      // If specific status filter provided, enforce admin-only visibility too
      if (statusFilter !== undefined) {
        return allowedStatuses.includes(campaign.status) && campaign.status === statusFilter
      }

      // For general "all" view: only show allowed statuses (admin sees more)
      return allowedStatuses.includes(campaign.status)
    })
  }

  // Count visible campaigns by status
  const countByStatus = (status: CampaignStatus) => {
    if (!allCampaigns) return 0
    return (allCampaigns as CampaignConfig[]).filter((c) => c.status === status).length
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-3 lg:gap-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground text-lg">
            Browse and support campaigns from verified NGOs
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {isAdmin && (
            <Link href="/campaigns/admin" className="shrink-0">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Shield className="h-4 w-4" />
                Admin Panel
              </Button>
            </Link>
          )}
          <Link href="/campaigns/create" className="shrink-0">
            <Button size="lg" className="btn-brand w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 input-lg"
          />
        </div>
        <Button variant="outline" className="shrink-0">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList
          className={`w-full sm:w-auto grid sm:inline-flex ${isAdmin ? 'grid-cols-4' : 'grid-cols-2'}`}
        >
          <TabsTrigger value="active" className="gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Active
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approved
              {countByStatus(CampaignStatus.Approved) > 0 && (
                <span className="ml-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs px-1.5 py-0.5 rounded-full">
                  {countByStatus(CampaignStatus.Approved)}
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="completed" className="gap-2">
            Completed
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-3.5 w-3.5 sm:hidden" />
              <span className="hidden sm:inline">⏳</span> Pending
              {countByStatus(CampaignStatus.Submitted) > 0 && (
                <span className="ml-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs px-1.5 py-0.5 rounded-full">
                  {countByStatus(CampaignStatus.Submitted)}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="active">
          {getVisibleCampaignIds(CampaignStatus.Active).length === 0 ? (
            <EmptyState message="No active campaigns yet" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {getVisibleCampaignIds(CampaignStatus.Active).map((id) => (
                <CampaignCard key={id.toString()} campaignId={id} hideIfNoMetadata />
              ))}
            </div>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="approved">
            {getVisibleCampaignIds(CampaignStatus.Approved).length === 0 ? (
              <EmptyState message="No approved campaigns ready for funding" />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {getVisibleCampaignIds(CampaignStatus.Approved).map((id) => (
                  <CampaignCard key={id.toString()} campaignId={id} hideIfNoMetadata />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="completed">
          {getVisibleCampaignIds(CampaignStatus.Completed).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-20 text-center space-y-4">
                <p className="text-muted-foreground">No completed campaigns yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {getVisibleCampaignIds(CampaignStatus.Completed).map((id) => (
                <CampaignCard key={id.toString()} campaignId={id} hideIfNoMetadata />
              ))}
            </div>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending" className="mt-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <Shield className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">Admin View:</span> Review and approve pending
                    campaigns
                  </p>
                  <Link href="/campaigns/admin" className="text-xs text-primary hover:underline">
                    Go to full admin panel →
                  </Link>
                </div>
              </div>
              {getVisibleCampaignIds(CampaignStatus.Submitted).length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-20 text-center space-y-4">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground">No pending campaigns to review</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {getVisibleCampaignIds(CampaignStatus.Submitted).map((id) => (
                    <CampaignCard key={id.toString()} campaignId={id} showApproveButton />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
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

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Shield,
  RefreshCw,
  Eye,
  ExternalLink,
  Target,
  Calendar,
  Wallet,
  ImageIcon,
  FileText,
} from 'lucide-react'
import { useCampaign, CampaignStatus, type CampaignConfig } from '@/hooks/useCampaign'
import { getGatewayUrl, parseCID, type CampaignMetadata } from '@/lib/pinata'
import { formatUnits } from 'viem'
import Image from 'next/image'
import { getContracts, ROLES, STRATEGY_IDS } from '@/config/contracts'
import { baseSepolia } from '@/config/chains'
import { ACL_MANAGER_ABI, CAMPAIGN_REGISTRY_ABI } from '@/lib/abi'

const statusColors = {
  submitted:
    'bg-amber-500/5 text-amber-700/70 border-amber-500/10 dark:bg-amber-500/10 dark:text-amber-400/70 dark:border-amber-500/20',
  approved:
    'bg-emerald-500/5 text-emerald-700/70 border-emerald-500/10 dark:bg-emerald-500/10 dark:text-emerald-400/70 dark:border-emerald-500/20',
  rejected:
    'bg-rose-500/5 text-rose-700/70 border-rose-500/10 dark:bg-rose-500/10 dark:text-rose-400/70 dark:border-rose-500/20',
  active:
    'bg-blue-500/5 text-blue-700/70 border-blue-500/10 dark:bg-blue-500/10 dark:text-blue-400/70 dark:border-blue-500/20',
}

export function CampaignAdminClient() {
  const { address, chainId } = useAccount()
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>(
    'submitted'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Review dialog state
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignConfig | null>(null)
  const [selectedMetadata, setSelectedMetadata] = useState<CampaignMetadata | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const {
    campaignCount,
    useGetCampaigns,
    approveCampaign,
    isApproveCampaignPending,
    isApproveCampaignConfirming,
    isApproveCampaignConfirmed,
    rejectCampaign,
    isRejectCampaignPending,
    isRejectCampaignConfirming,
    isRejectCampaignConfirmed,
    activateCampaign,
    setCampaignStatus,
    isSetCampaignStatusPending,
    isSetCampaignStatusConfirming,
    isSetCampaignStatusConfirmed,
    deployCampaignVault,
    isDeployVaultPending,
    isDeployVaultConfirming,
    isDeployVaultConfirmed,
    getMetadataCID,
  } = useCampaign()

  const contracts = getContracts(chainId ?? baseSepolia.id)

  // Get CAMPAIGN_ADMIN_ROLE from registry
  const { data: campaignAdminRoleHash } = useReadContract({
    address: contracts?.campaignRegistry,
    abi: CAMPAIGN_REGISTRY_ABI,
    functionName: 'CAMPAIGN_ADMIN_ROLE',
    query: {
      enabled: !!contracts?.campaignRegistry,
    },
  })

  // Check if user is campaign admin
  const { data: isAdminData, isLoading: isAuthLoading } = useReadContract({
    address: contracts?.aclManager,
    abi: ACL_MANAGER_ABI,
    functionName: 'hasRole',
    args: [
      campaignAdminRoleHash ?? ROLES.CAMPAIGN_ADMIN,
      address ?? '0x0000000000000000000000000000000000000000',
    ],
    query: {
      enabled:
        !!contracts?.aclManager && !!address && (!!campaignAdminRoleHash || !!ROLES.CAMPAIGN_ADMIN),
    },
  })

  const isAdmin = Boolean(isAdminData)

  // Debug role check to help diagnose missing admin actions
  useEffect(() => {
    console.debug('[CampaignAdmin] Role check', {
      connectedAddress: address,
      chainId,
      aclManager: contracts?.aclManager,
      role: campaignAdminRoleHash ?? ROLES.CAMPAIGN_ADMIN,
      isAdmin,
    })
  }, [address, chainId, contracts?.aclManager, campaignAdminRoleHash, isAdmin])

  // Fetch all campaigns
  const count = Number(campaignCount ?? 0n)
  const {
    data: rawCampaigns,
    isLoading: isCampaignsLoading,
    refetch: refetchCampaigns,
  } = useGetCampaigns(0, Math.min(count, 100))
  const allCampaigns = (rawCampaigns as CampaignConfig[]) || []

  // Filter campaigns by status
  const getFilteredCampaigns = useCallback(() => {
    let filtered = allCampaigns

    // Apply status filter
    if (statusFilter === 'submitted') {
      filtered = filtered.filter((c) => c.status === CampaignStatus.Submitted)
    } else if (statusFilter === 'approved') {
      filtered = filtered.filter(
        (c) => c.status === CampaignStatus.Approved || c.status === CampaignStatus.Active
      )
    } else if (statusFilter === 'rejected') {
      filtered = filtered.filter((c) => c.status === CampaignStatus.Rejected)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) => c.id.toLowerCase().includes(query) || c.proposer.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [allCampaigns, statusFilter, searchQuery])

  const filteredCampaigns = getFilteredCampaigns()

  // Loading state
  useEffect(() => {
    if (!isCampaignsLoading) {
      setIsLoading(false)
    }
  }, [isCampaignsLoading])

  // Open review dialog
  const openReview = async (campaign: CampaignConfig) => {
    setSelectedCampaign(campaign)
    setIsReviewOpen(true)
    setSelectedMetadata(null)
    setRejectionReason('')

    // Fetch metadata
    try {
      const cid = await getMetadataCID(campaign.id)
      if (cid) {
        const response = await fetch(getGatewayUrl(cid))
        if (response.ok) {
          const data = await response.json()
          setSelectedMetadata(data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error)
    }
  }

  // Parse common contract errors
  const parseContractError = (error: Error): string => {
    const msg = error.message.toLowerCase()

    if (msg.includes('user rejected') || msg.includes('user denied')) {
      return 'Transaction cancelled by user'
    }
    if (msg.includes('unauthorized') || msg.includes('accesscontrol')) {
      return `Unauthorized: Your wallet doesn't have CAMPAIGN_ADMIN_ROLE on this chain.`
    }
    if (msg.includes('campaigndoesnotexist')) {
      return 'Campaign does not exist'
    }
    if (msg.includes('campaignnotsubmitted')) {
      return 'Campaign is not in submitted status'
    }
    if (msg.includes('execution reverted')) {
      return 'Transaction reverted. You may not have the required role on this network.'
    }

    return error.message.length > 150 ? `${error.message.slice(0, 150)}...` : error.message
  }

  // Handle approve action
  const handleApprove = async () => {
    if (!selectedCampaign || !address) return

    setIsProcessing(true)
    toast.loading('Submitting approval to blockchain...', { id: 'campaign-action' })

    try {
      approveCampaign(selectedCampaign.id, address)
    } catch (error) {
      const errorMessage = parseContractError(error as Error)
      toast.error(errorMessage, { id: 'campaign-action' })
      setIsProcessing(false)
    }
  }

  // Handle reject action
  const handleReject = async () => {
    if (!selectedCampaign || !rejectionReason) return

    setIsProcessing(true)
    toast.loading('Submitting rejection to blockchain...', { id: 'campaign-action' })

    try {
      rejectCampaign(selectedCampaign.id, rejectionReason)
    } catch (error) {
      const errorMessage = parseContractError(error as Error)
      toast.error(errorMessage, { id: 'campaign-action' })
      setIsProcessing(false)
    }
  }

  // Handle approval transaction confirmation
  useEffect(() => {
    if (isApproveCampaignConfirmed) {
      toast.success('Campaign approved successfully!', { id: 'campaign-action' })
      setIsReviewOpen(false)
      setSelectedCampaign(null)
      setIsProcessing(false)
      refetchCampaigns()
    }
  }, [isApproveCampaignConfirmed, refetchCampaigns])

  // Handle rejection transaction confirmation
  useEffect(() => {
    if (isRejectCampaignConfirmed) {
      toast.success('Campaign rejected successfully!', { id: 'campaign-action' })
      setIsReviewOpen(false)
      setSelectedCampaign(null)
      setRejectionReason('')
      setIsProcessing(false)
      refetchCampaigns()
    }
  }, [isRejectCampaignConfirmed, refetchCampaigns])

  // Handle cancel action
  const handleCancel = async (campaign?: CampaignConfig) => {
    const targetCampaign = campaign ?? selectedCampaign
    if (!targetCampaign) return

    // Keep selectedCampaign in sync
    setSelectedCampaign(targetCampaign)

    if (!confirm('Are you sure you want to cancel this campaign? This action cannot be undone.'))
      return

    setIsProcessing(true)
    toast.loading('Cancelling campaign...', { id: 'campaign-action' })

    try {
      setCampaignStatus(targetCampaign.id, CampaignStatus.Cancelled)
    } catch (error) {
      const errorMessage = parseContractError(error as Error)
      toast.error(errorMessage, { id: 'campaign-action' })
      setIsProcessing(false)
    }
  }

  // Handle deploy vault action
  const handleDeployVault = async (campaign?: CampaignConfig) => {
    const targetCampaign = campaign ?? selectedCampaign
    if (!targetCampaign || !address) return

    setIsProcessing(true)
    toast.loading('Deploying campaign vault...', { id: 'campaign-action' })

    try {
      const isEth = targetCampaign.strategyId === STRATEGY_IDS.AAVE_ETH
      const asset = isEth ? contracts?.weth : contracts?.usdc

      if (!asset) throw new Error('Asset address not found for chain')

      deployCampaignVault({
        campaignId: targetCampaign.id,
        strategyId: targetCampaign.strategyId,
        asset,
        admin: address, // Admin as vault admin
        name: `Give ${isEth ? 'ETH' : 'USDC'} Campaign`,
        symbol: `g${isEth ? 'ETH' : 'USDC'}C`,
      })
    } catch (error) {
      const errorMessage = parseContractError(error as Error)
      toast.error(errorMessage, { id: 'campaign-action' })
      setIsProcessing(false)
    }
  }

  // Handle vault deployment confirmation
  useEffect(() => {
    if (isDeployVaultConfirmed) {
      toast.success('Vault deployed successfully!', { id: 'campaign-action' })
      setIsReviewOpen(false)
      setSelectedCampaign(null)
      setIsProcessing(false)
      refetchCampaigns()
    }
  }, [isDeployVaultConfirmed, refetchCampaigns])

  // Handle activate action
  const handleActivate = async (campaign?: CampaignConfig) => {
    const targetCampaign = campaign ?? selectedCampaign
    if (!targetCampaign) return

    // Keep selectedCampaign in sync so dialog state reflects the action target
    setSelectedCampaign(targetCampaign)

    setIsProcessing(true)
    toast.loading('Activating campaign...', { id: 'campaign-action' })

    try {
      activateCampaign(targetCampaign.id)
    } catch (error) {
      const errorMessage = parseContractError(error as Error)
      toast.error(errorMessage, { id: 'campaign-action' })
      setIsProcessing(false)
    }
  }

  // Handle activate transaction confirmation
  useEffect(() => {
    if (isSetCampaignStatusConfirmed) {
      toast.success('Campaign activated successfully!', { id: 'campaign-action' })
      setIsReviewOpen(false)
      setSelectedCampaign(null)
      setIsProcessing(false)
      refetchCampaigns()
    }
  }, [isSetCampaignStatusConfirmed, refetchCampaigns])

  // Stats
  const submittedCount = allCampaigns.filter((c) => c.status === CampaignStatus.Submitted).length
  const approvedCount = allCampaigns.filter(
    (c) => c.status === CampaignStatus.Approved || c.status === CampaignStatus.Active
  ).length
  const rejectedCount = allCampaigns.filter((c) => c.status === CampaignStatus.Rejected).length

  // Loading state for role check
  if (isAuthLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // Not connected or doesn't have admin role
  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <Card className="card-highlight">
          <CardContent className="py-20 text-center space-y-6">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Admin Access Required</h3>
              <p className="text-muted-foreground">
                You do not have the Campaign Admin role required to access this page.
              </p>
              {address && (
                <p className="text-xs text-muted-foreground font-mono mt-4">
                  Connected: {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Campaign Admin Panel
          </h1>
          <p className="text-muted-foreground">Review and approve pending campaign submissions</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Connected to:</span>
            <Badge variant="outline" className="font-mono">
              {chainId === 84532
                ? 'Base Sepolia'
                : chainId === 11155111
                  ? 'Ethereum Sepolia'
                  : `Chain ${chainId}`}
            </Badge>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetchCampaigns()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:border-amber-500/30 transition-colors"
          onClick={() => setStatusFilter('submitted')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-amber-600/80 dark:text-amber-400/80">
                  {submittedCount}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:border-emerald-500/30 transition-colors"
          onClick={() => setStatusFilter('approved')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-emerald-600/80 dark:text-emerald-400/80">
                  {approvedCount}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:border-rose-500/30 transition-colors"
          onClick={() => setStatusFilter('rejected')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-rose-600/80 dark:text-rose-400/80">
                  {rejectedCount}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-rose-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by campaign ID or proposer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'submitted', 'approved', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Campaign List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card className="card-highlight">
          <CardContent className="py-20 text-center space-y-6">
            <Target className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No Campaigns</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'submitted'
                  ? 'No pending campaigns to review'
                  : `No ${statusFilter} campaigns found`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <CampaignListItem
              key={campaign.id}
              campaign={campaign}
              onReview={() => openReview(campaign)}
              getMetadataCID={getMetadataCID}
              onActivate={() => handleActivate(campaign)}
              isActivating={
                isProcessing || isSetCampaignStatusPending || isSetCampaignStatusConfirming
              }
            />
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Review Campaign Submission
            </DialogTitle>
            <DialogDescription>Review the campaign details and approve or reject</DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-6">
              {/* Campaign Info */}
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={
                      selectedCampaign.status === CampaignStatus.Submitted
                        ? statusColors.submitted
                        : selectedCampaign.status === CampaignStatus.Approved ||
                            selectedCampaign.status === CampaignStatus.Active
                          ? statusColors.approved
                          : statusColors.rejected
                    }
                  >
                    {CampaignStatus[selectedCampaign.status]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Created: {new Date(Number(selectedCampaign.createdAt) * 1000).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Proposer
                  </p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block">
                    {selectedCampaign.proposer}
                  </code>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Target Stake</p>
                    <p className="text-lg font-bold">
                      $
                      {selectedCampaign?.targetStake !== undefined
                        ? Number(formatUnits(selectedCampaign.targetStake, 6)).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Min Stake</p>
                    <p className="text-lg font-bold">
                      $
                      {selectedCampaign?.minStake !== undefined
                        ? Number(formatUnits(selectedCampaign.minStake, 6)).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fundraising Start
                    </p>
                    <p className="text-sm">
                      {new Date(
                        Number(selectedCampaign.fundraisingStart) * 1000
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fundraising End
                    </p>
                    <p className="text-sm">
                      {new Date(
                        Number(selectedCampaign.fundraisingEnd) * 1000
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metadata Preview */}
              {selectedMetadata ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      {selectedMetadata.coverImage && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                          <Image
                            src={getGatewayUrl(parseCID(selectedMetadata.coverImage))}
                            alt="Cover"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{selectedMetadata.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          by {selectedMetadata.ngoName}
                        </p>
                        <Badge variant="outline">{selectedMetadata.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Description</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedMetadata.description}
                      </p>
                    </div>

                    {/* Milestones */}
                    {selectedMetadata.milestones && selectedMetadata.milestones.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Milestones ({selectedMetadata.milestones.length})
                        </p>
                        <div className="space-y-2">
                          {selectedMetadata.milestones.map((milestone, index) => (
                            <div key={index} className="border rounded-lg p-3 text-sm">
                              <div className="flex items-center gap-2 font-medium">
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                                  {index + 1}
                                </span>
                                {milestone.title}
                              </div>
                              <p className="text-muted-foreground mt-1 ml-7">
                                {milestone.description}
                              </p>
                              {milestone.targetAmount && (
                                <Badge variant="secondary" className="mt-2 ml-7">
                                  Target: ${Number(milestone.targetAmount).toLocaleString()}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Images */}
                    {selectedMetadata.images && selectedMetadata.images.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Images ({selectedMetadata.images.length})
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {selectedMetadata.images.slice(0, 4).map((imageCid, index) => (
                            <a
                              key={index}
                              href={getGatewayUrl(parseCID(imageCid))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative w-16 h-16 rounded overflow-hidden hover:opacity-80 transition-opacity"
                            >
                              <Image
                                src={getGatewayUrl(parseCID(imageCid))}
                                alt={`Image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </a>
                          ))}
                          {selectedMetadata.images.length > 4 && (
                            <div className="w-16 h-16 rounded bg-muted flex items-center justify-center text-sm text-muted-foreground">
                              +{selectedMetadata.images.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Social Links */}
                    {selectedMetadata.socialLinks && (
                      <div className="flex gap-2 flex-wrap">
                        {selectedMetadata.socialLinks.website && (
                          <a
                            href={selectedMetadata.socialLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Website
                            </Badge>
                          </a>
                        )}
                        {selectedMetadata.socialLinks.twitter && (
                          <a
                            href={selectedMetadata.socialLinks.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Twitter
                            </Badge>
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Actions */}
              {selectedCampaign.status === CampaignStatus.Submitted && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Rejection Reason (required for rejection)</p>
                    <Textarea
                      placeholder="Provide a reason if rejecting..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={
                        isProcessing ||
                        isApproveCampaignPending ||
                        isApproveCampaignConfirming ||
                        isRejectCampaignPending ||
                        isRejectCampaignConfirming ||
                        !rejectionReason
                      }
                    >
                      {isRejectCampaignPending || isRejectCampaignConfirming ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      {isRejectCampaignPending
                        ? 'Sign Transaction...'
                        : isRejectCampaignConfirming
                          ? 'Confirming...'
                          : 'Reject'}
                    </Button>
                    <Button
                      className="btn-brand"
                      onClick={handleApprove}
                      disabled={
                        isProcessing ||
                        isApproveCampaignPending ||
                        isApproveCampaignConfirming ||
                        isRejectCampaignPending ||
                        isRejectCampaignConfirming
                      }
                    >
                      {isApproveCampaignPending || isApproveCampaignConfirming ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      {isApproveCampaignPending
                        ? 'Sign Transaction...'
                        : isApproveCampaignConfirming
                          ? 'Confirming...'
                          : 'Approve'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Activate button for approved campaigns */}
              {selectedCampaign.status === CampaignStatus.Approved && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      This campaign is approved.
                      {selectedCampaign.vault === '0x0000000000000000000000000000000000000000'
                        ? ' Please deploy a vault before activating to enable deposits.'
                        : ' Ready to go live. Activating will allow users to stake funds.'}
                    </p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="destructive"
                      className="mr-auto"
                      onClick={() => handleCancel(selectedCampaign)}
                      disabled={
                        isProcessing || isSetCampaignStatusPending || isSetCampaignStatusConfirming
                      }
                    >
                      Cancel
                    </Button>
                    {selectedCampaign.vault === '0x0000000000000000000000000000000000000000' ? (
                      <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleDeployVault(selectedCampaign)}
                        disabled={isProcessing || isDeployVaultPending || isDeployVaultConfirming}
                      >
                        {isDeployVaultPending || isDeployVaultConfirming ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Wallet className="h-4 w-4 mr-2" />
                        )}
                        {isDeployVaultPending
                          ? 'Sign Transaction...'
                          : isDeployVaultConfirming
                            ? 'Confirming...'
                            : 'Deploy Vault'}
                      </Button>
                    ) : (
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleActivate(selectedCampaign)}
                        disabled={
                          isProcessing ||
                          isSetCampaignStatusPending ||
                          isSetCampaignStatusConfirming
                        }
                      >
                        {isSetCampaignStatusPending || isSetCampaignStatusConfirming ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        {isSetCampaignStatusPending
                          ? 'Sign Transaction...'
                          : isSetCampaignStatusConfirming
                            ? 'Confirming...'
                            : 'Activate Campaign'}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Cancel button for Active campaigns */}
              {selectedCampaign.status === CampaignStatus.Active && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      This campaign is currently active. Cancelling it will stop new deposits.
                    </p>
                  </div>
                  <div className="flex justify-start">
                    <Button
                      variant="destructive"
                      onClick={() => handleCancel(selectedCampaign)}
                      disabled={
                        isProcessing || isSetCampaignStatusPending || isSetCampaignStatusConfirming
                      }
                    >
                      {isSetCampaignStatusPending || isSetCampaignStatusConfirming ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Cancel Campaign
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Campaign list item component
function CampaignListItem({
  campaign,
  onReview,
  getMetadataCID,
  onActivate,
  isActivating,
}: {
  campaign: CampaignConfig
  onReview: () => void
  getMetadataCID: (campaignId: `0x${string}`) => Promise<string | null>
  onActivate?: () => void
  isActivating?: boolean
}) {
  const [metadata, setMetadata] = useState<CampaignMetadata | null>(null)

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const cid = await getMetadataCID(campaign.id)
        if (cid) {
          const response = await fetch(getGatewayUrl(cid))
          if (response.ok) {
            const data = await response.json()
            setMetadata(data)
          }
        }
      } catch (error) {
        console.error('Failed to fetch metadata:', error)
      }
    }
    fetchMetadata()
  }, [campaign.id, getMetadataCID])

  const statusKey =
    campaign.status === CampaignStatus.Submitted
      ? 'submitted'
      : campaign.status === CampaignStatus.Approved || campaign.status === CampaignStatus.Active
        ? 'approved'
        : campaign.status === CampaignStatus.Rejected
          ? 'rejected'
          : 'submitted'

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            {/* Thumbnail */}
            {metadata?.coverImage || metadata?.images?.[0] ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                <Image
                  src={getGatewayUrl(parseCID(metadata.coverImage || metadata.images![0]))}
                  alt={metadata.name || 'Campaign'}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Target className="h-6 w-6 text-muted-foreground" />
              </div>
            )}

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={statusColors[statusKey]}>
                  {CampaignStatus[campaign.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(Number(campaign.createdAt) * 1000).toLocaleDateString()}
                </span>
              </div>
              <p className="font-semibold truncate">{metadata?.name || 'Loading...'}</p>
              <p className="text-sm text-muted-foreground truncate">
                {metadata?.ngoName || campaign.proposer.slice(0, 10) + '...'}
              </p>
              <p className="text-xs text-muted-foreground">
                Target: ${Number(formatUnits(campaign.targetStake, 6)).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onReview}>
              <Eye className="h-4 w-4 mr-1" />
              Review
            </Button>
            {campaign.status === CampaignStatus.Approved && onActivate && (
              <Button
                size="sm"
                onClick={onActivate}
                disabled={isActivating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isActivating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                )}
                Activate
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

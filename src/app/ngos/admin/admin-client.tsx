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
  Shield,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Wallet,
} from 'lucide-react'
import Image from 'next/image'
import { getGatewayUrl } from '@/lib/pinata'
import { useNGO } from '@/hooks/useNGO'
import { ACL_MANAGER_ABI, NGO_REGISTRY_ABI } from '@/lib/abi'
import { getContracts } from '@/config/contracts'
import { baseSepolia } from '@/config/chains'
import type { NGOIPFSMetadata } from '@/types/ngo'

interface PendingApplication {
  id: string
  metadataCID: string
  walletAddress: string
  ngoName: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
}

const statusColors = {
  pending:
    'bg-amber-500/5 text-amber-700/70 border-amber-500/10 dark:bg-amber-500/10 dark:text-amber-400/70 dark:border-amber-500/20',
  approved:
    'bg-emerald-500/5 text-emerald-700/70 border-emerald-500/10 dark:bg-emerald-500/10 dark:text-emerald-400/70 dark:border-emerald-500/20',
  rejected:
    'bg-rose-500/5 text-rose-700/70 border-rose-500/10 dark:bg-rose-500/10 dark:text-rose-400/70 dark:border-rose-500/20',
}

export function NGOAdminClient() {
  const { isConnected, address, chainId } = useAccount()
  const contracts = getContracts(chainId ?? baseSepolia.id)

  // First, read the NGO_MANAGER_ROLE hash from the NGORegistry contract
  const { data: ngoManagerRoleHash } = useReadContract({
    address: contracts?.ngoRegistry,
    abi: NGO_REGISTRY_ABI,
    functionName: 'NGO_MANAGER_ROLE',
    query: {
      enabled: !!contracts?.ngoRegistry,
    },
  })

  // Then check if current user has that role
  const { data: hasNGOManagerRole, isLoading: isRoleLoading } = useReadContract({
    address: contracts?.aclManager,
    abi: ACL_MANAGER_ABI,
    functionName: 'hasRole',
    args: [ngoManagerRoleHash as `0x${string}`, address!],
    query: {
      enabled: !!contracts?.aclManager && !!address && isConnected && !!ngoManagerRoleHash,
    },
  })

  const [applications, setApplications] = useState<PendingApplication[]>([])
  const [allApplications, setAllApplications] = useState<PendingApplication[]>([]) // For stats
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<PendingApplication | null>(null)
  const [selectedMetadata, setSelectedMetadata] = useState<NGOIPFSMetadata | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'pending'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const {
    addNGO,
    isAddNGOPending,
    isAddNGOConfirming,
    isAddNGOConfirmed,
    addNGOHash,
    resetAddNGO,
  } = useNGO()

  // Fetch all applications for stats
  const fetchAllApplications = async () => {
    try {
      const response = await fetch('/api/ngo/applications?status=all')
      if (response.ok) {
        const data = await response.json()
        setAllApplications(data.applications || [])
      }
    } catch (error) {
      console.error('Failed to fetch all applications:', error)
    }
  }

  // Fetch applications based on filter
  const fetchApplications = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/ngo/applications?status=${statusFilter}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  // Initial load - fetch all for stats (runs once on mount)
  useEffect(() => {
    fetchAllApplications()
  }, [])

  // Filter change - fetch filtered list
  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  // Fetch metadata for selected application
  const fetchMetadata = async (cid: string) => {
    try {
      const response = await fetch(`/api/ngo/applications?cid=${cid}`)
      if (response.ok) {
        const data = await response.json()
        return data.metadata as NGOIPFSMetadata
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error)
    }
    return null
  }

  // Open review dialog
  const openReview = async (app: PendingApplication) => {
    setSelectedApp(app)
    setIsReviewOpen(true)
    setSelectedMetadata(null)

    const metadata = await fetchMetadata(app.metadataCID)
    setSelectedMetadata(metadata)
  }

  // State to track pending approval
  const [pendingApproval, setPendingApproval] = useState<{
    appId: string
    walletAddress: string
  } | null>(null)

  // Parse common contract errors
  const parseContractError = (error: Error): string => {
    const msg = error.message.toLowerCase()

    if (msg.includes('user rejected') || msg.includes('user denied')) {
      return 'Transaction cancelled by user'
    }
    if (msg.includes('unauthorized')) {
      return `Unauthorized: Your wallet doesn't have NGO_MANAGER_ROLE on this chain. Switch to a network where you have admin permissions.`
    }
    if (msg.includes('ngoalreadyapproved')) {
      return 'This NGO is already approved on-chain'
    }
    if (msg.includes('invalidngoaddress')) {
      return 'Invalid NGO wallet address'
    }
    if (msg.includes('invalidmetadatacid')) {
      return 'Invalid metadata CID'
    }
    if (msg.includes('enforcedpause')) {
      return 'Contract is paused'
    }
    if (msg.includes('execution reverted')) {
      return 'Transaction reverted. You may not have the NGO_MANAGER_ROLE on this network.'
    }

    // Truncate long messages
    return error.message.length > 150 ? `${error.message.slice(0, 150)}...` : error.message
  }

  // Handle transaction error (wallet rejection or on-chain failure)
  const handleTxError = (error: Error) => {
    console.error('Transaction error:', error)
    const errorMessage = parseContractError(error)
    toast.error(errorMessage, { id: 'approve', duration: 8000 })
    setPendingApproval(null)
    setIsProcessing(false)
    resetAddNGO()
  }

  // Update application status
  const updateStatus = async (status: 'approved' | 'rejected') => {
    if (!selectedApp || !address) return

    setIsProcessing(true)

    try {
      if (status === 'approved' && selectedMetadata) {
        // For approval: First submit on-chain tx, wait for confirmation before updating IPFS
        toast.loading('Submitting to blockchain...', { id: 'approve' })

        // Store pending approval info to update IPFS after tx confirms
        setPendingApproval({
          appId: selectedApp.id,
          walletAddress: selectedApp.walletAddress,
        })

        // Call the smart contract with error callback
        // The admin approving becomes the attestor (who verified the KYC)
        addNGO({
          ngoAddress: selectedApp.walletAddress as `0x${string}`,
          metadataCid: selectedApp.metadataCID,
          attestor: address as `0x${string}`,
          onError: handleTxError,
        })

        // Don't update IPFS here - wait for on-chain confirmation
        return
      }

      // For rejection: Update IPFS immediately (no on-chain tx needed)
      const response = await fetch('/api/ngo/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedApp.id,
          status,
          reviewedBy: address,
          rejectionReason: rejectionReason || undefined,
        }),
      })

      if (response.ok) {
        toast.success('Application rejected', { id: 'approve' })
        setIsReviewOpen(false)
        setRejectionReason('')
        fetchApplications()
        fetchAllApplications()
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update application status', { id: 'approve' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle on-chain confirmation - only update IPFS after tx is confirmed
  useEffect(() => {
    const updateIPFSAfterConfirmation = async () => {
      if (isAddNGOConfirmed && addNGOHash && pendingApproval) {
        try {
          // On-chain tx confirmed - now update IPFS status
          const response = await fetch('/api/ngo/applications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: pendingApproval.appId,
              status: 'approved',
              reviewedBy: address,
              txHash: addNGOHash,
            }),
          })

          if (response.ok) {
            toast.success('NGO approved and added to on-chain registry!', { id: 'approve' })
            setIsReviewOpen(false)
            setRejectionReason('')
            fetchApplications()
            fetchAllApplications()
          } else {
            toast.error('On-chain succeeded but failed to update application record', {
              id: 'approve',
            })
          }
        } catch (error) {
          console.error('Error updating IPFS after confirmation:', error)
          toast.error('On-chain succeeded but failed to update application record', {
            id: 'approve',
          })
        } finally {
          setPendingApproval(null)
          setIsProcessing(false)
          resetAddNGO()
        }
      }
    }

    updateIPFSAfterConfirmation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddNGOConfirmed, addNGOHash, pendingApproval])

  // Filter applications by search
  const filteredApplications = applications.filter(
    (app) =>
      app.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.metadataCID.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Loading state for role check (wait for both role hash fetch and role check)
  if (isRoleLoading || (!ngoManagerRoleHash && isConnected)) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // Not connected or doesn't have admin role
  if (!isConnected || !hasNGOManagerRole) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <Card className="card-highlight">
          <CardContent className="empty-state">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-semibold">Admin Access Required</h3>
              <p className="text-muted-foreground">
                {!isConnected
                  ? 'Please connect your wallet to access this page.'
                  : 'You do not have the NGO Manager role required to access this page.'}
              </p>
              {isConnected && address && (
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
            NGO Admin Panel
          </h1>
          <p className="text-muted-foreground">Review and approve pending NGO applications</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Connected to:</span>
            <Badge variant="outline" className="font-mono">
              {chainId === 84532
                ? 'Base Sepolia'
                : chainId === 11155111
                  ? 'Ethereum Sepolia'
                  : `Chain ${chainId}`}
            </Badge>
            <span className="text-xs text-muted-foreground">
              (NGO will be added to this network)
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            fetchApplications()
            fetchAllApplications()
          }}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="stat-card cursor-pointer" onClick={() => setStatusFilter('pending')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-amber-600/80 dark:text-amber-400/80">
                  {allApplications.filter((a) => a.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card cursor-pointer" onClick={() => setStatusFilter('approved')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-emerald-600/80 dark:text-emerald-400/80">
                  {allApplications.filter((a) => a.status === 'approved').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card cursor-pointer" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-rose-600/80 dark:text-rose-400/80">
                  {allApplications.filter((a) => a.status === 'rejected').length}
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
            placeholder="Search by wallet address or CID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
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

      {/* Applications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredApplications.length === 0 ? (
        <Card className="card-highlight">
          <CardContent className="empty-state">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-semibold">No Applications</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'pending'
                  ? 'No pending applications to review'
                  : `No ${statusFilter} applications found`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <Card key={app.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColors[app.status]}>
                        {app.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="pl-2 font-semibold truncate">{app.ngoName || 'Unknown NGO'}</p>
                    <p className="pl-2 font-mono text-xs text-muted-foreground truncate">
                      {app.walletAddress}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openReview(app)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    <a
                      href={getGatewayUrl(app.metadataCID)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Review NGO Application
            </DialogTitle>
            <DialogDescription>
              Review the application details and approve or reject
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6">
              {/* Application Info */}
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={statusColors[selectedApp.status]}>
                    {selectedApp.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Submitted: {new Date(selectedApp.submittedAt).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Wallet Address
                  </p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block">
                    {selectedApp.walletAddress}
                  </code>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Metadata CID</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                    {selectedApp.metadataCID}
                  </code>
                </div>
              </div>

              {/* Metadata Preview */}
              {selectedMetadata ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      {selectedMetadata.documents?.logo && (
                        <div className="relative w-10 h-10 rounded overflow-hidden">
                          <Image
                            src={getGatewayUrl(selectedMetadata.documents.logo)}
                            alt="Logo"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      {selectedMetadata.name}
                    </CardTitle>
                    <CardDescription className="text-justify pr-4">
                      {selectedMetadata.mission}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedMetadata.contact?.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {selectedMetadata.organization?.country},{' '}
                          {selectedMetadata.organization?.city}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Reg Number: {selectedMetadata.organization?.registrationNumber}</span>
                    </div>
                    <p className="text-muted-foreground text-justify pr-4">
                      {selectedMetadata.description}
                    </p>

                    {/* Documents */}
                    <div className="flex gap-2 flex-wrap">
                      {selectedMetadata.documents?.registrationDocument && (
                        <a
                          href={getGatewayUrl(selectedMetadata.documents.registrationDocument)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                            <FileText className="h-3 w-3 mr-1" />
                            Registration Doc
                          </Badge>
                        </a>
                      )}
                      {selectedMetadata.documents?.taxDocument && (
                        <a
                          href={getGatewayUrl(selectedMetadata.documents.taxDocument)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                            <FileText className="h-3 w-3 mr-1" />
                            Tax Document
                          </Badge>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Actions */}
              {selectedApp.status === 'pending' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Rejection Reason (optional)</p>
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
                      onClick={() => updateStatus('rejected')}
                      disabled={isProcessing || isAddNGOPending || isAddNGOConfirming}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Reject
                    </Button>
                    <Button
                      className="btn-brand"
                      onClick={() => updateStatus('approved')}
                      disabled={isProcessing || isAddNGOPending || isAddNGOConfirming}
                    >
                      {isProcessing || isAddNGOPending || isAddNGOConfirming ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      {isAddNGOPending
                        ? 'Sign Transaction...'
                        : isAddNGOConfirming
                          ? 'Confirming...'
                          : pendingApproval
                            ? 'Updating...'
                            : 'Approve'}
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

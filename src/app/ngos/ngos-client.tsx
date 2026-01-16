'use client'

import { useState, useEffect } from 'react'
import { useConnection, useReadContract } from 'wagmi'
import { useNGO, NGOStatus, type NGOInfo } from '@/hooks/useNGO'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Users, FileCheck, ArrowRight, CheckCircle2, Plus, Shield } from 'lucide-react'
import Link from 'next/link'
import type { Address } from 'viem'
import { ACL_MANAGER_ABI, NGO_REGISTRY_ABI } from '@/lib/abi'
import { getContracts } from '@/config/contracts'
import { ethereumSepolia } from '@/config/chains'

const statusColors: Record<NGOStatus, string> = {
  [NGOStatus.Pending]: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  [NGOStatus.Active]: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  [NGOStatus.Suspended]: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  [NGOStatus.Removed]: 'bg-red-500/10 text-red-600 border-red-500/20',
}

export function NGOsClient() {
  const { approvedNGOs, useGetActiveNGOs } = useNGO()
  const { data: activeNGOs } = useGetActiveNGOs()
  const { address, isConnected } = useConnection()
  // Use Ethereum Sepolia for admin role checks (adjust if your admin roles are on Base)
  const contracts = getContracts(ethereumSepolia.id)

  // Fetch NGO_MANAGER_ROLE from registry (always available)
  const { data: ngoManagerRole } = useReadContract({
    address: contracts?.ngoRegistry,
    abi: NGO_REGISTRY_ABI,
    functionName: 'NGO_MANAGER_ROLE',
    chainId: ethereumSepolia.id,
    query: {
      enabled: !!contracts?.ngoRegistry, // Always fetch role, no wallet required
    },
  })

  // Only check if connected wallet has admin role when wallet is connected
  const { data: hasNGOManagerRole } = useReadContract({
    address: contracts?.aclManager,
    abi: ACL_MANAGER_ABI,
    functionName: 'hasRole',
    args: [
      ngoManagerRole as `0x${string}`,
      address ?? '0x0000000000000000000000000000000000000000',
    ],
    chainId: ethereumSepolia.id,
    query: {
      enabled: !!contracts?.aclManager && !!address && isConnected && !!ngoManagerRole, // Only when connected
    },
  })

  const showAdminPanelCTA = Boolean(hasNGOManagerRole)

  // approvedNGOs is an array of addresses - No wallet required for public viewing
  const ngoAddresses = (approvedNGOs as Address[] | undefined) ?? []
  const count = ngoAddresses.length

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold">Verified NGOs</h1>
          <p className="text-muted-foreground text-lg">
            Browse registered and verified non-governmental organizations
          </p>
        </div>
        <div className="flex gap-3">
          {showAdminPanelCTA && (
            <Link href="/ngos/admin">
              <Button variant="outline" className="gap-2">
                <Shield className="h-4 w-4" />
                Admin Panel
              </Button>
            </Link>
          )}
          <Link href="/ngos/register">
            <Button className="btn-brand gap-2">
              <Plus className="h-4 w-4" />
              Register NGO
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total NGOs</p>
              <p className="text-xl font-bold text-gradient-give">{count}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Active NGOs</p>
              <p className="text-xl font-bold text-gradient-give">
                {Array.isArray(activeNGOs) ? activeNGOs.length : 0}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Campaigns</p>
              <p className="text-xl font-bold text-gradient-give">0</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
              <FileCheck className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Raised</p>
              <p className="text-xl font-bold text-gradient-give">$0</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
              <Users className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NGO List */}
      {count === 0 ? (
        <Card className="card-highlight">
          <CardContent className="empty-state">
            <div className="icon-box-brand-xl mx-auto">
              <Building2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No NGOs Registered Yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                NGOs can be registered by protocol admins after verification.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ngoAddresses.map((address) => (
            <NGOCard key={address} ngoAddress={address} />
          ))}
        </div>
      )}

      {/* How to Register */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            For NGOs: How to Register
          </CardTitle>
          <CardDescription>Join Give Protocol and start receiving yield donations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex gap-3">
              <div className="step-number shrink-0">1</div>
              <div>
                <h4 className="font-medium mb-1">Fill Application</h4>
                <p className="text-sm text-muted-foreground">Complete the registration form</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="step-number shrink-0">2</div>
              <div>
                <h4 className="font-medium mb-1">Upload Documents</h4>
                <p className="text-sm text-muted-foreground">Provide registration & tax status</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="step-number shrink-0">3</div>
              <div>
                <h4 className="font-medium mb-1">Get Verified</h4>
                <p className="text-sm text-muted-foreground">Admin reviews your application</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="step-number shrink-0">4</div>
              <div>
                <h4 className="font-medium mb-1">Create Campaigns</h4>
                <p className="text-sm text-muted-foreground">Start receiving yield donations</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Ready to join? Start your application now or contact us at{' '}
              <a
                href="mailto:ngos@giveprotocol.io"
                className="text-primary hover:underline font-medium"
              >
                ngos@giveprotocol.io
              </a>
            </p>
            <Link href="/ngos/register">
              <Button className="btn-brand gap-2">
                <Plus className="h-4 w-4" />
                Register Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getGatewayUrl } from '@/lib/pinata'

function NGOCard({ ngoAddress }: { ngoAddress: Address }) {
  const { useGetNGOInfo } = useNGO()
  const { data: ngoInfo } = useGetNGOInfo(ngoAddress)
  const [metadata, setMetadata] = useState<{
    name?: string
    documents?: { logo?: string }
  } | null>(null)

  // Fetch metadata from IPFS
  useEffect(() => {
    if (ngoInfo && (ngoInfo as NGOInfo).metadataCid) {
      const cid = (ngoInfo as NGOInfo).metadataCid
      fetch(`/api/ngo/applications?cid=${cid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.metadata) {
            setMetadata(data.metadata)
          }
        })
        .catch(console.error)
    }
  }, [ngoInfo])

  if (!ngoInfo) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-4 bg-muted rounded w-full" />
        </CardContent>
      </Card>
    )
  }

  const info = ngoInfo as NGOInfo
  const isActive = info.isActive

  return (
    <Link href={`/ngos/${ngoAddress}`} className="block group">
      <Card className="stat-card h-full transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-12 w-12 border-2 border-background shadow-sm shrink-0">
                <AvatarImage
                  src={
                    metadata?.documents?.logo ? getGatewayUrl(metadata.documents.logo) : undefined
                  }
                  alt={metadata?.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/5 text-primary font-semibold">
                  {metadata?.name?.slice(0, 2).toUpperCase() || 'NGO'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 min-w-0">
                <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                  {metadata?.name || 'Loading...'}
                </CardTitle>
                <CardDescription className="truncate font-mono text-xs flex items-center gap-1">
                  {ngoAddress.slice(0, 6)}...{ngoAddress.slice(-4)}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`shrink-0 ${isActive ? statusColors[NGOStatus.Active] : statusColors[NGOStatus.Suspended]}`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Registered</p>
              <p className="font-medium">
                {new Date(Number(info.createdAt) * 1000).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Active Campaigns</p>
              <p className="font-medium flex items-center gap-1">
                0 <span className="text-muted-foreground text-xs font-normal">(Coming Soon)</span>
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Button
              variant="secondary"
              className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            >
              View Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

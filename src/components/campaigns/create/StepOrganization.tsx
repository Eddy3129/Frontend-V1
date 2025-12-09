'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type CampaignFormData } from '@/types/campaign'
import { Building2, User, ChevronDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getGatewayUrl } from '@/lib/pinata'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { Address } from 'viem'

interface StepOrganizationProps {
  formData: CampaignFormData
  updateFormData: (updates: Partial<CampaignFormData>) => void
}

interface NGOMetadata {
  ngoName: string
  logo?: string
  email: string
  website?: string
  country?: string
  socialLinks?: {
    twitter?: string
    discord?: string
    telegram?: string
  }
}

interface ApprovedNGOInfo {
  address: Address
  ngoName: string
  metadata: NGOMetadata | null
  metadataCid: string
  isLoading: boolean
}

export function StepOrganization({ formData, updateFormData }: StepOrganizationProps) {
  const [ngosWithMetadata, setNgosWithMetadata] = useState<ApprovedNGOInfo[]>([])
  const [isLoadingNGOs, setIsLoadingNGOs] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Fetch approved NGOs from IPFS applications index (status=approved)
  useEffect(() => {
    const fetchApprovedNGOs = async () => {
      setIsLoadingNGOs(true)
      try {
        // Fetch approved applications from IPFS index
        const response = await fetch('/api/ngo/applications?status=approved')
        if (!response.ok) {
          throw new Error('Failed to fetch approved NGOs')
        }

        const data = await response.json()
        console.log('[StepOrganization] Approved NGOs from IPFS:', data)

        if (!data.applications || data.applications.length === 0) {
          console.log('[StepOrganization] No approved NGOs found in IPFS index')
          setIsLoadingNGOs(false)
          return
        }

        // Initialize NGOs with data from applications index
        const ngosInfo: ApprovedNGOInfo[] = data.applications.map(
          (app: { walletAddress: string; ngoName: string; metadataCID: string }) => ({
            address: app.walletAddress as Address,
            ngoName: app.ngoName || 'Unknown NGO',
            metadata: null,
            metadataCid: app.metadataCID,
            isLoading: true,
          })
        )
        setNgosWithMetadata(ngosInfo)

        // Fetch full metadata for each NGO from IPFS
        for (let i = 0; i < ngosInfo.length; i++) {
          try {
            const metadataResponse = await fetch(
              `/api/ngo/applications?cid=${ngosInfo[i].metadataCid}`
            )
            if (metadataResponse.ok) {
              const metadataData = await metadataResponse.json()
              const ipfsMetadata = metadataData.metadata

              // Map IPFS metadata format to component format
              const mappedMetadata: NGOMetadata = {
                ngoName: ipfsMetadata.name || ipfsMetadata.ngoName || ngosInfo[i].ngoName,
                logo: ipfsMetadata.documents?.logo || ipfsMetadata.logo,
                email: ipfsMetadata.contact?.email || ipfsMetadata.email,
                website: ipfsMetadata.contact?.website || ipfsMetadata.website,
                country: ipfsMetadata.organization?.country || ipfsMetadata.country,
                socialLinks: ipfsMetadata.socialLinks,
              }

              ngosInfo[i] = {
                ...ngosInfo[i],
                metadata: mappedMetadata,
                isLoading: false,
              }
            } else {
              ngosInfo[i] = { ...ngosInfo[i], isLoading: false }
            }
          } catch (error) {
            console.error(`Failed to fetch metadata for NGO ${ngosInfo[i].address}:`, error)
            ngosInfo[i] = { ...ngosInfo[i], isLoading: false }
          }
          setNgosWithMetadata([...ngosInfo])
        }
      } catch (error) {
        console.error('[StepOrganization] Error fetching NGOs:', error)
        toast.error('Failed to load organizations')
      } finally {
        setIsLoadingNGOs(false)
      }
    }

    fetchApprovedNGOs()
  }, [])

  // Handle NGO selection
  const handleSelectNGO = (ngo: ApprovedNGOInfo) => {
    if (!ngo.metadata) {
      toast.error('Unable to load NGO details')
      return
    }

    updateFormData({
      selectedNgoAddress: ngo.address,
      organizationName: ngo.metadata.ngoName,
      organizationLogo: ngo.metadata.logo || null,
      email: ngo.metadata.email,
      website: ngo.metadata.website || '',
      socialLinks: ngo.metadata.socialLinks || {},
    })

    setIsDropdownOpen(false)
    toast.success(`Selected ${ngo.metadata.ngoName}`)
  }

  // Get selected NGO info
  const selectedNgo = ngosWithMetadata.find((n) => n.address === formData.selectedNgoAddress)

  return (
    <div className="space-y-6">
      {/* NGO Selector */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-sm">
          <Building2 className="h-3.5 w-3.5" />
          Select Your Organization <span className="text-red-500">*</span>
        </Label>

        {isLoadingNGOs ? (
          <Card className="border-dashed">
            <CardContent className="py-8 flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Loading approved organizations...
              </span>
            </CardContent>
          </Card>
        ) : ngosWithMetadata.length === 0 ? (
          <Card className="border-dashed border-amber-500/50 bg-amber-500/5">
            <CardContent className="py-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium">No approved organizations found</p>
                <p className="text-xs text-muted-foreground">
                  Your organization must be registered and approved before creating a campaign.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                'hover:border-primary/50 hover:bg-accent/50',
                isDropdownOpen ? 'border-primary ring-2 ring-primary/20' : 'border-input',
                formData.selectedNgoAddress ? 'bg-primary/5 border-primary/30' : ''
              )}
            >
              {formData.selectedNgoAddress && selectedNgo?.metadata ? (
                <>
                  {selectedNgo.metadata.logo ? (
                    <Image
                      src={getGatewayUrl(selectedNgo.metadata.logo)}
                      alt={selectedNgo.metadata.ngoName}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedNgo.metadata.ngoName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedNgo.address.slice(0, 6)}...{selectedNgo.address.slice(-4)}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-lg border-2 border-dashed flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="flex-1 text-muted-foreground">Select an organization...</span>
                </>
              )}
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
                  isDropdownOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Dropdown Options */}
            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 rounded-lg border bg-popover shadow-lg max-h-[300px] overflow-y-auto">
                {ngosWithMetadata.map((ngo, index) => (
                  <button
                    key={`${ngo.address}-${index}`}
                    type="button"
                    onClick={() => handleSelectNGO(ngo)}
                    disabled={ngo.isLoading || !ngo.metadata}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 text-left transition-colors',
                      'hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed',
                      formData.selectedNgoAddress === ngo.address && 'bg-primary/10'
                    )}
                  >
                    {ngo.isLoading ? (
                      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground p-2" />
                    ) : ngo.metadata?.logo ? (
                      <Image
                        src={getGatewayUrl(ngo.metadata.logo)}
                        alt={ngo.metadata.ngoName}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {ngo.isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      ) : ngo.metadata ? (
                        <>
                          <p className="font-medium truncate">{ngo.metadata.ngoName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ngo.metadata.country && `${ngo.metadata.country} • `}
                            {ngo.address.slice(0, 6)}...{ngo.address.slice(-4)}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {ngo.ngoName.startsWith('0x') && ngo.ngoName.length === 42
                            ? 'Unknown Organization'
                            : ngo.ngoName}{' '}
                          • {ngo.address.slice(0, 6)}...{ngo.address.slice(-4)}
                        </p>
                      )}
                    </div>
                    {formData.selectedNgoAddress === ngo.address && (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Campaign Coordinator (editable) */}
      {formData.selectedNgoAddress && (
        <>
          <div className="space-y-2">
            <Label htmlFor="personInCharge" className="flex items-center gap-1.5 text-sm">
              <User className="h-3.5 w-3.5" />
              Campaign Coordinator <span className="text-red-500">*</span>
            </Label>
            <Input
              id="personInCharge"
              placeholder="Full name of the person in charge"
              value={formData.personInCharge}
              onChange={(e) => updateFormData({ personInCharge: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              This is the primary contact for this specific campaign
            </p>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="text-sm">
                Contact Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="campaign@ngo.org"
                value={formData.contactEmail}
                onChange={(e) => updateFormData({ contactEmail: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="text-sm">
                Phone Number
              </Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="+1 234 567 890"
                value={formData.contactPhone}
                onChange={(e) => updateFormData({ contactPhone: e.target.value })}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="contactTelegram" className="text-sm">
                Telegram / Social Handle
              </Label>
              <Input
                id="contactTelegram"
                placeholder="@username"
                value={formData.contactTelegram}
                onChange={(e) => updateFormData({ contactTelegram: e.target.value })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

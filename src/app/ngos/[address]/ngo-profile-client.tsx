'use client'

import { useState, useEffect } from 'react'
import { useNGO, NGOStatus, type NGOInfo } from '@/hooks/useNGO'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  FileText,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { type Address } from 'viem'
import { getGatewayUrl } from '@/lib/pinata'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { type NGOIPFSMetadata } from '@/types/ngo'

const statusColors: Record<NGOStatus, string> = {
  [NGOStatus.Pending]: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  [NGOStatus.Active]: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  [NGOStatus.Suspended]: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  [NGOStatus.Removed]: 'bg-red-500/10 text-red-600 border-red-500/20',
}

export function NGOProfileClient({ address }: { address: string }) {
  const { useGetNGOInfo } = useNGO()
  const { data: ngoInfo } = useGetNGOInfo(address as Address)
  const [metadata, setMetadata] = useState<NGOIPFSMetadata | null>(null)
  const [isMetadataLoading, setIsMetadataLoading] = useState(false)

  useEffect(() => {
    if (ngoInfo && (ngoInfo as NGOInfo).metadataCid) {
      setIsMetadataLoading(true)
      const cid = (ngoInfo as NGOInfo).metadataCid
      fetch(`/api/ngo/applications?cid=${cid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.metadata) {
            setMetadata(data.metadata)
          }
        })
        .catch(console.error)
        .finally(() => setIsMetadataLoading(false))
    }
  }, [ngoInfo])

  if (isMetadataLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="space-y-6">
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
          <div className="grid grid-cols-3 gap-6">
            <div className="h-32 bg-muted rounded-xl animate-pulse" />
            <div className="h-32 bg-muted rounded-xl animate-pulse" />
            <div className="h-32 bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!ngoInfo) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">NGO Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The NGO with address {address} could not be found.
        </p>
        <Link href="/ngos">
          <Button>Back to NGOs</Button>
        </Link>
      </div>
    )
  }

  const info = ngoInfo as NGOInfo
  const isActive = info.isActive

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
      {/* Back Button */}
      <Link
        href="/ngos"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to NGOs
      </Link>

      {/* Header Profile */}
      <div className="relative">
        {/* Cover Image Placeholder (could be added to metadata later) */}
        <div className="h-48 w-full bg-linear-to-r from-primary/10 to-primary/5 rounded-t-2xl border-x border-t" />

        <div className="absolute -bottom-16 left-8 flex items-end gap-6">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl rounded-2xl">
            <AvatarImage
              src={metadata?.documents?.logo ? getGatewayUrl(metadata.documents.logo) : undefined}
              alt={metadata?.name}
              className="object-cover"
            />
            <AvatarFallback className="text-4xl bg-primary/5 text-primary rounded-2xl">
              {metadata?.name?.slice(0, 2).toUpperCase() || 'NGO'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="pt-20 px-1">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{metadata?.name || 'Unknown NGO'}</h1>
              <Badge
                variant="outline"
                className={
                  isActive ? statusColors[NGOStatus.Active] : statusColors[NGOStatus.Suspended]
                }
              >
                {isActive ? 'Verified Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm">
              <span>{address}</span>
              <ExternalLink className="h-3 w-3 cursor-pointer hover:text-primary" />
            </div>
            {metadata?.organization && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                {metadata.organization.city && metadata.organization.country && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {metadata.organization.city}, {metadata.organization.country}
                  </div>
                )}
                {metadata.organization.foundedYear && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Est. {metadata.organization.foundedYear}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {metadata?.contact?.website && (
              <a href={metadata.contact.website} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Button>
              </a>
            )}
            {metadata?.contact?.email && (
              <a href={`mailto:${metadata.contact.email}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Mission
            </h2>
            <Card className="bg-primary/5 border-primary/10">
              <CardContent>
                <p className="text-md font-medium italic text-primary/80">
                  &quot;{metadata?.mission || 'No mission statement provided.'}&quot;
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              About Organization
            </h2>
            <p className="text-muted-foreground text-justify leading-relaxed whitespace-pre-wrap">
              {metadata?.description || 'No description provided.'}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Active Campaigns
            </h2>
            {/* Placeholder for campaigns */}
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No active campaigns found for this NGO.</p>
                <Button variant="link" className="mt-2">
                  View Past Campaigns
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {metadata?.contact?.email && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p className="font-medium truncate">{metadata.contact.email}</p>
                  </div>
                </div>
              )}
              {metadata?.contact?.phone && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Phone</p>
                    <p className="font-medium">{metadata.contact.phone}</p>
                  </div>
                </div>
              )}
              {metadata?.organization?.address && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Address</p>
                    <p className="font-medium">{metadata.organization.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Social Profiles</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {metadata?.socialLinks?.twitter && (
                <a
                  href={metadata.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {metadata?.socialLinks?.linkedin && (
                <a
                  href={metadata.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {metadata?.socialLinks?.facebook && (
                <a
                  href={metadata.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {metadata?.socialLinks?.instagram && (
                <a
                  href={metadata.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {!metadata?.socialLinks && (
                <p className="text-sm text-muted-foreground">No social profiles linked.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registration Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={isActive ? 'text-emerald-600 border-emerald-200' : ''}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registered On</span>
                <span className="font-medium">
                  {new Date(Number(info.createdAt) * 1000).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Received</span>
                <span className="font-medium text-primary">
                  ${(Number(info.totalReceived) / 1e6).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Globe, Twitter } from 'lucide-react'
import { CampaignStatus } from '@/hooks/useCampaign'
import type { CampaignMetadata } from '@/lib/pinata'

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

interface CampaignHeaderProps {
  metadata: CampaignMetadata | null
  status: CampaignStatus
  isLoading: boolean
}

export function CampaignHeader({ metadata, status, isLoading }: CampaignHeaderProps) {
  return (
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
  )
}

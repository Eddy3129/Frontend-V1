import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Globe, Twitter, CheckCircle2 } from 'lucide-react'
import { getGatewayUrl, parseCID, type CampaignMetadata } from '@/lib/pinata'

interface AboutSectionProps {
  metadata: CampaignMetadata | null
  isLoading: boolean
}

export function AboutSection({ metadata, isLoading }: AboutSectionProps) {
  const logoUrl = metadata?.images?.[0] ? getGatewayUrl(parseCID(metadata.images[0])) : null

  return (
    <div className="mt-4 space-y-4">
      {/* Description */}
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-4 bg-muted w-full animate-pulse rounded" />
          <div className="h-4 bg-muted w-3/4 animate-pulse rounded" />
        </div>
      ) : (
        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm">
          {metadata?.description ?? 'No description available'}
        </p>
      )}

      {/* NGO Information */}
      <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={metadata?.ngoName}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {metadata?.ngoName?.slice(0, 1) || 'N'}
              </span>
            </div>
          )}
          <div>
            <p className="font-semibold flex items-center gap-2">
              {metadata?.ngoName ?? 'Unknown NGO'}
              <Badge
                variant="outline"
                className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </p>
            <p className="text-xs text-muted-foreground">Verified Organization</p>
          </div>
        </div>
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
              <Button variant="outline" size="sm" className="gap-2 rounded-lg">
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
              <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                <Twitter className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

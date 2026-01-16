import { type CampaignMetadata } from '@/lib/pinata'

interface AboutSectionProps {
  metadata: CampaignMetadata | null
  isLoading: boolean
}

export function AboutSection({ metadata, isLoading }: AboutSectionProps) {
  return (
    <div className="space-y-4">
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
    </div>
  )
}

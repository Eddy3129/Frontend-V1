import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'

interface CampaignDescriptionProps {
  description?: string
  isLoading: boolean
}

export function CampaignDescription({ description, isLoading }: CampaignDescriptionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          About this Campaign
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full animate-pulse" />
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
          </div>
        ) : (
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {description ?? 'No description available'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

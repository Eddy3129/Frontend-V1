import { Card, CardContent } from '@/components/ui/card'

export default function CreateCampaignLoading() {
  return (
    <div className="section-spacing">
      {/* Header Skeleton */}
      <div className="page-header animate-pulse">
        <div className="h-10 bg-muted rounded w-64 mb-2" />
        <div className="h-5 bg-muted rounded w-96" />
      </div>

      {/* Progress Steps Skeleton */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-muted" />
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Form Skeleton */}
      <Card className="card-elevated">
        <CardContent className="p-8 space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="space-y-4">
            <div className="h-12 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-12 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

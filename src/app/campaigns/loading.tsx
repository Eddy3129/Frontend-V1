import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function CampaignsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="h-4 bg-muted rounded w-64 mt-2 animate-pulse" />
        </div>
        <div className="h-10 bg-muted rounded w-36 animate-pulse" />
      </div>

      {/* Search skeleton */}
      <div className="h-10 bg-muted rounded max-w-md animate-pulse" />

      {/* Tabs skeleton */}
      <div className="h-10 bg-muted rounded w-64 animate-pulse" />

      {/* Cards skeleton */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-muted rounded" />
              <div className="h-2 bg-muted rounded mt-4" />
              <div className="h-4 bg-muted rounded w-1/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

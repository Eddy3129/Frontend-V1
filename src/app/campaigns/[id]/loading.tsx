import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function CampaignDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back Button Skeleton */}
      <div className="h-8 w-40 bg-muted rounded animate-pulse" />

      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-9 w-80 bg-muted rounded animate-pulse" />
        <div className="h-5 w-40 bg-muted rounded animate-pulse" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-24 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-6 w-40 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-3 w-full bg-muted rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-6 w-24 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-8 w-20 bg-muted rounded animate-pulse" />
              <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

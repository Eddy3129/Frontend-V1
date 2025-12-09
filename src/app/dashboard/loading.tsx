import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function StakeLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-40 bg-muted rounded animate-pulse mb-2" />
        <div className="h-5 w-96 bg-muted rounded animate-pulse" />
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="h-10 w-64 bg-muted rounded animate-pulse" />

      {/* Content */}
      <div className="max-w-md">
        <Card>
          <CardHeader>
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

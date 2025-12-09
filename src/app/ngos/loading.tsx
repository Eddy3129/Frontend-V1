import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function NGOsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-48 bg-muted rounded animate-pulse mb-2" />
        <div className="h-5 w-96 bg-muted rounded animate-pulse" />
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-4 w-20 bg-muted rounded animate-pulse mb-2" />
              <div className="h-8 w-12 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content */}
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  )
}

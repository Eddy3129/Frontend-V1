import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-4">
        <div className="h-2 w-full bg-muted animate-pulse rounded" />
        <div className="flex justify-between">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
              <div className="h-3 w-16 hidden sm:block bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardContent className="p-5 flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>

      {/* Buttons */}
      <div className="flex justify-between">
        <div className="h-9 w-24 bg-muted animate-pulse rounded" />
        <div className="h-9 w-24 bg-muted animate-pulse rounded" />
      </div>
    </div>
  )
}

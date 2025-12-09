import { Heart } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="relative">
        <Heart className="h-12 w-12 text-primary fill-primary animate-pulse" />
        <div className="absolute inset-0 blur-md bg-primary/40 rounded-full animate-pulse" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  )
}

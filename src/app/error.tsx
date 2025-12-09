'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md border-2 border-destructive/20">
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong!</CardTitle>
          <CardDescription>An error occurred while loading this page.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={reset} className="gradient-give text-white glow-give">
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

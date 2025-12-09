import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Heart } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md text-center border-2">
        <CardHeader>
          <div className="relative mx-auto mb-4">
            <Heart className="h-12 w-12 text-muted-foreground/30 fill-muted-foreground/10" />
          </div>
          <CardTitle className="text-6xl font-bold text-gradient-give">404</CardTitle>
          <CardDescription className="text-lg">Page not found</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link href="/">
            <Button className="gradient-give text-white glow-give">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

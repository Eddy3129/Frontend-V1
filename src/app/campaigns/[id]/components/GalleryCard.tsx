import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageIcon } from 'lucide-react'
import { getGatewayUrl, parseCID } from '@/lib/pinata'

interface GalleryCardProps {
  galleryImages: string[]
}

export function GalleryCard({ galleryImages }: GalleryCardProps) {
  if (galleryImages.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Gallery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {galleryImages.map((imageCid, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer"
            >
              <Image
                src={getGatewayUrl(parseCID(imageCid))}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

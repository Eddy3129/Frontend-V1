'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageCarouselProps {
  images: string[]
  campaignName?: string
  ngoName?: string
  showOverlay?: boolean
}

export function ImageCarousel({
  images,
  campaignName,
  ngoName,
  showOverlay = true,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  if (images.length === 0) {
    return (
      <div className="relative h-80 w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
        <p className="text-muted-foreground">No images available</p>
        {/* Title overlay even without image */}
        {showOverlay && campaignName && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {campaignName}
            </h1>
            {ngoName && (
              <p className="text-sm text-white/90 mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                by {ngoName}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative group">
      {/* Main Image Container - No rounded corners */}
      <div className="relative h-80 md:h-96 w-full overflow-hidden bg-black">
        {images.map((src, index) => (
          <div
            key={index}
            className={cn(
              'absolute inset-0 transition-opacity duration-500 ease-in-out flex items-center justify-center',
              index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            <div className="relative w-full h-full">
              <Image
                src={src}
                alt={`${campaignName || 'Campaign'} - Image ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 800px"
                className="object-contain"
                priority={index === 0}
              />
            </div>
          </div>
        ))}

        {/* Gradient overlay for title */}
        {showOverlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        )}

        {/* Title overlay on image */}
        {showOverlay && campaignName && (
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-tight">
              {campaignName}
            </h1>
            {ngoName && (
              <p className="text-sm md:text-base text-white/90 mt-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                by {ngoName}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </Button>
        </>
      )}

      {/* Dot Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

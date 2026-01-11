'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

const HERO_SLIDES = [
  {
    image:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=2000&q=80',
    title: 'Education for Every Child',
    subtitle: 'Your yield funds classrooms across the globe',
    accent: 'from-amber-500/80 to-orange-600/80',
  },
  {
    image:
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=2000&q=80',
    title: 'Hands That Give',
    subtitle: 'Join thousands making a difference without losing a dime',
    accent: 'from-emerald-500/80 to-teal-600/80',
  },
  {
    image:
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=2000&q=80',
    title: 'Preserve Our Planet',
    subtitle: 'Fund reforestation and conservation projects',
    accent: 'from-green-500/80 to-emerald-700/80',
  },
  {
    image:
      'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=2000&q=80',
    title: 'Clean Water Access',
    subtitle: 'Building wells and water systems worldwide',
    accent: 'from-blue-500/80 to-cyan-600/80',
  },
  {
    image:
      'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=2000&q=80',
    title: 'Community Support',
    subtitle: 'Empowering local initiatives with sustainable funding',
    accent: 'from-purple-500/80 to-pink-600/80',
  },
]

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const nextSlide = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    setTimeout(() => setIsTransitioning(false), 700)
  }, [isTransitioning])

  const prevSlide = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
    setTimeout(() => setIsTransitioning(false), 700)
  }, [isTransitioning])

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentSlide) return
    setIsTransitioning(true)
    setCurrentSlide(index)
    setTimeout(() => setIsTransitioning(false), 700)
  }

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [isPlaying, nextSlide])

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden rounded-3xl group">
      {/* Slides */}
      {HERO_SLIDES.map((slide, index) => (
        <div
          key={index}
          className={cn(
            'absolute inset-0 transition-all duration-700 ease-out',
            index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          )}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          />

          {/* Gradient Overlay */}
          <div className={cn('absolute inset-0 bg-gradient-to-t', slide.accent, 'opacity-60')} />

          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Content */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 p-8 md:p-12 transition-all duration-700 delay-150',
              index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            )}
          >
            <h3 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3 drop-shadow-lg">
              {slide.title}
            </h3>
            <p className="text-lg md:text-xl text-white/90 max-w-xl drop-shadow-md">
              {slide.subtitle}
            </p>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
        {/* Dots */}
        <div className="flex items-center gap-2">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'transition-all duration-300',
                index === currentSlide
                  ? 'w-8 h-2 bg-white rounded-full'
                  : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/70'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Play/Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
          aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm font-medium text-white">Impact Stories</span>
      </div>
    </div>
  )
}

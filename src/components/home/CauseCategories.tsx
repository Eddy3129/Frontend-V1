'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useInView } from '@/hooks/useInView'

const CAUSE_CATEGORIES = [
  {
    id: 'education',
    title: 'Education',
    image:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
    stats: { campaigns: 24, raised: '$1.2M', donors: '3.4K' },
    description: 'Fund schools, scholarships, and learning programs worldwide',
  },
  {
    id: 'humanitarian',
    title: 'Humanitarian',
    image:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
    stats: { campaigns: 18, raised: '$890K', donors: '2.1K' },
    description: 'Support disaster relief, refugees, and crisis response',
  },
  {
    id: 'environment',
    title: 'Environment',
    image:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    stats: { campaigns: 32, raised: '$2.1M', donors: '5.8K' },
    description: 'Protect forests, oceans, and wildlife habitats',
  },
  {
    id: 'healthcare',
    title: 'Healthcare',
    image:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    stats: { campaigns: 15, raised: '$720K', donors: '1.9K' },
    description: 'Provide medical care and health infrastructure',
  },
]

// Stagger delay classes for sequential animation
const STAGGER_DELAYS = ['', 'delay-150', 'delay-300', 'delay-450']

function CauseCard({
  cause,
  index,
  isInView,
}: {
  cause: (typeof CAUSE_CATEGORIES)[0]
  index: number
  isInView: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={`/campaigns?category=${cause.id}`}
      className={`relative flex-1 min-h-[400px] lg:min-h-0 overflow-hidden cursor-pointer group transition-all duration-[2100ms] ease-out ${
        isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-24 bg-accent/10'
      }`}
      style={{ transitionDelay: `${index * 450}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image - Always visible */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{ backgroundImage: `url(${cause.image})` }}
      />

      {/* Gradient overlay - Always visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Title - Always visible at bottom */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-6 lg:p-8 transition-all duration-500 ${isHovered ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
      >
        <h3 className="text-xl lg:text-2xl font-serif font-bold text-white drop-shadow-lg">
          {cause.title}
        </h3>
        <p className="text-white/70 text-sm mt-2 line-clamp-2">{cause.description}</p>
      </div>

      {/* Hover State - Slides down from top with semi-transparent overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/85 backdrop-blur-sm flex flex-col justify-center p-6 lg:p-8 transition-all duration-700 ease-out ${
          isHovered ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="space-y-4">
          <h3 className="text-2xl lg:text-3xl font-serif font-bold text-white">{cause.title}</h3>
          <p className="text-sm lg:text-base text-white/80 leading-relaxed">{cause.description}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 py-4 border-y border-white/20">
            <div>
              <p className="text-xl lg:text-2xl font-bold text-primary">{cause.stats.campaigns}</p>
              <p className="text-xs uppercase tracking-wider text-white/60">Campaigns</p>
            </div>
            <div>
              <p className="text-xl lg:text-2xl font-bold text-accent">{cause.stats.raised}</p>
              <p className="text-xs uppercase tracking-wider text-white/60">Raised</p>
            </div>
            <div>
              <p className="text-xl lg:text-2xl font-bold text-white">{cause.stats.donors}</p>
              <p className="text-xs uppercase tracking-wider text-white/60">Donors</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 text-primary font-medium group/cta">
            <span>Explore Campaigns</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover/cta:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  )
}

export function CauseCategories() {
  const [sectionRef, isInView] = useInView<HTMLElement>({ threshold: 0.2, triggerOnce: false })

  return (
    <section ref={sectionRef} className="snap-section flex flex-col">
      {/* Section Divider Line - Top */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Section Header - Left aligned with accent line */}
      <div
        className={`relative px-6 md:px-12 lg:px-16 pt-16 pb-4 transition-all duration-[2100ms] ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        {/* Decorative vertical line */}
        <div className="absolute left-6 md:left-12 lg:left-16 top-16 bottom-4 w-px bg-gradient-to-b from-primary via-accent to-transparent" />

        <div className="pl-8 md:pl-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-black text-foreground tracking-tight">
            Support Causes you care about.
            <span className="block h-1 w-40 md:w-56 bg-gradient-to-r from-primary to-accent mt-3 rounded-full" />
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-xl leading-relaxed">
            Simple stake with a button and witness how you contribute.
          </p>
        </div>
      </div>

      {/* Cause Cards Row - Full width with slide-in animation */}
      <div className="flex-1 flex flex-col lg:flex-row w-full">
        {CAUSE_CATEGORIES.map((cause, index) => (
          <CauseCard key={cause.id} cause={cause} index={index} isInView={isInView} />
        ))}
      </div>

      {/* Section Divider Line - Bottom */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  )
}

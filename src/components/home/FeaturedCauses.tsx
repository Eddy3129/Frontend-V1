'use client'

import { ArrowRight, Users, TrendingUp, Clock, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useCampaign } from '@/hooks/useCampaign'
import { useInView } from '@/hooks/useInView'

// Featured campaign
const FEATURED_CAMPAIGN = {
  id: 1,
  title: 'Amazon Rainforest Protection Initiative',
  organizer: 'GreenEarth Foundation',
  description:
    'Help protect over 1.5 million acres of pristine Amazon rainforest from deforestation through local ranger programs and satellite monitoring.',
  target: 500000,
  current: 342000,
  donors: 1240,
  daysLeft: 45,
  apy: 6.2,
  image:
    'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1920&q=80',
}

export function FeaturedCauses() {
  const { useGetActiveCampaigns } = useCampaign()
  const { data: activeCampaigns } = useGetActiveCampaigns()
  const [sectionRef, isInView] = useInView<HTMLElement>({ threshold: 0.15, triggerOnce: false })

  const hasRealCampaigns = (activeCampaigns?.length ?? 0) > 0
  const campaign = FEATURED_CAMPAIGN
  const progress = (campaign.current / campaign.target) * 100

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
            Make a difference today.
            <span className="block h-1 w-40 md:w-56 bg-gradient-to-r from-primary to-accent mt-3 rounded-full" />
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-xl leading-relaxed">
            Support high-impact campaigns making real change around the world.
          </p>
        </div>
      </div>

      {/* Featured Campaign - Two Column Layout */}
      <div className="flex-1 grid lg:grid-cols-2">
        {/* Left: Image - Simple fade-in within section */}
        <div
          className={`relative min-h-[280px] lg:min-h-0 overflow-hidden transition-all duration-[2100ms] ease-out ${
            isInView ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className={`absolute inset-0 bg-cover bg-center transition-transform duration-[2400ms] ease-out ${
              isInView ? 'scale-100' : 'scale-105'
            }`}
            style={{ backgroundImage: `url(${campaign.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/20" />

          {/* Mobile overlay content */}
          <div className="lg:hidden absolute bottom-0 left-0 right-0 p-6">
            <p className="text-primary font-medium text-sm mb-1">by {campaign.organizer}</p>
            <h3 className="text-2xl font-serif font-bold text-white">{campaign.title}</h3>
          </div>
        </div>

        {/* Right: Content - Staged reveal */}
        <div className="flex flex-col justify-center p-6 lg:p-10 xl:p-12 bg-card">
          {/* Desktop title */}
          <div
            className={`hidden lg:block mb-5 transition-all duration-[2100ms] ease-out ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 text-accent'
            }`}
            style={{ transitionDelay: '600ms' }}
          >
            <p className="text-primary font-medium mb-2">by {campaign.organizer}</p>
            <h3 className="text-2xl xl:text-3xl font-serif font-bold text-foreground leading-tight">
              {campaign.title}
            </h3>
          </div>

          <p
            className={`text-base lg:text-lg leading-relaxed mb-6 transition-all duration-[2100ms] ease-out ${
              isInView
                ? 'opacity-100 translate-y-0 text-muted-foreground'
                : 'opacity-0 translate-y-6 text-primary/60'
            }`}
            style={{ transitionDelay: '900ms' }}
          >
            {campaign.description}
          </p>

          {/* Progress */}
          <div
            className={`mb-6 transition-all duration-[2100ms] ease-out ${
              isInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-6 bg-accent/10 rounded-xl'
            }`}
            style={{ transitionDelay: '1200ms' }}
          >
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl xl:text-4xl font-black text-primary">
                ${(campaign.current / 1000).toFixed(0)}K
              </span>
              <span className="text-muted-foreground text-sm">
                of ${(campaign.target / 1000).toFixed(0)}K goal
              </span>
            </div>
            <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r from-primary to-accent rounded-full relative overflow-hidden transition-all duration-1000 ease-out ${
                  isInView ? '' : 'w-0'
                }`}
                style={{ width: isInView ? `${progress}%` : '0%', transitionDelay: '1800ms' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div
            className={`grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-border transition-all duration-[2100ms] ease-out ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '1500ms' }}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xl font-bold text-foreground">{campaign.donors}</span>
              </div>
              <span className="text-xs text-muted-foreground">Stakers</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xl font-bold text-foreground">{campaign.apy}%</span>
              </div>
              <span className="text-xs text-muted-foreground">APY</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-xl font-bold text-foreground">{campaign.daysLeft}</span>
              </div>
              <span className="text-xs text-muted-foreground">Days Left</span>
            </div>
          </div>

          {/* CTAs */}
          <div
            className={`flex flex-col sm:flex-row gap-3 transition-all duration-[2100ms] ease-out ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '1800ms' }}
          >
            <Link href={`/campaigns/${campaign.id}`} className="flex-1">
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-xl opacity-40 blur-lg group-hover:opacity-70 transition-all duration-500 animate-gradient bg-[length:200%_100%]" />
                <Button
                  size="lg"
                  className="w-full relative bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl px-6 py-5 text-base font-bold shadow-lg transition-all duration-300 group-hover:scale-[1.02]"
                >
                  <span className="flex items-center justify-center gap-2">
                    Support This Cause
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </div>
            </Link>
            <Link href="/campaigns">
              <div className="group relative">
                <div className="absolute -inset-px bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Button
                  variant="outline"
                  size="lg"
                  className="relative border-2 border-border bg-background/80 backdrop-blur-sm rounded-xl px-6 py-5 text-base font-bold transition-all duration-300 group-hover:scale-[1.02]"
                >
                  All Campaigns
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* NGO CTA */}
      {!hasRealCampaigns && (
        <div
          className={`py-5 px-6 bg-secondary/30 border-t border-border transition-all duration-[2100ms] ${
            isInView ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionDelay: '2100ms' }}
        >
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-foreground">Are you an NGO?</p>
              <p className="text-sm text-muted-foreground">
                Create campaigns and receive yield-based donations.
              </p>
            </div>
            <Link href="/campaigns/create">
              <Button className="bg-gradient-to-r from-primary to-accent text-white rounded-xl px-6 py-4 font-bold group hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Section Divider Line - Bottom */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  )
}

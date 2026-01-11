'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Lock, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { DonationsMarquee } from '@/components/home/DonationsMarquee'
import { CauseCategories } from '@/components/home/CauseCategories'
import { ArchitectureFlow } from '@/components/home/ArchitectureFlow'
import { FeaturedCauses } from '@/components/home/FeaturedCauses'

// Dynamic import for Three.js Globe
const Globe = dynamic(() => import('@/components/home/Globe').then((mod) => mod.Globe), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-14 h-14 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
    </div>
  ),
})

export function HomeClient() {
  return (
    <div className="text-foreground font-sans selection:bg-accent selection:text-accent-foreground">
      {/* Live Donations Marquee */}
      <DonationsMarquee />

      {/* Hero Section */}
      <section className="snap-section-full flex flex-col justify-center relative overflow-hidden pb-[10vh]">
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full py-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Globe */}
            <div className="order-2 lg:order-1 flex justify-center">
              <div className="relative w-[350px] h-[350px] lg:w-[450px] lg:h-[450px]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-2xl" />
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    </div>
                  }
                >
                  <Globe />
                </Suspense>
              </div>
            </div>

            {/* Text Content */}
            <div className="order-1 lg:order-2 text-center flex flex-col items-center lg:items-center">
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-serif font-black text-foreground mb-6 leading-[1.05] tracking-tight opacity-0 animate-fade-in-up"
                style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
              >
                Grow your wealth.
                <br />
                <span className="text-gradient-hero">Heal the world.</span>
              </h1>

              <p
                className="text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed opacity-0 animate-fade-in-up"
                style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
              >
                Deposit assets into secure DeFi vaults. Keep your principal 100% safe. The yield
                goes to verified causes.
              </p>

              <div
                className="flex flex-col sm:flex-row justify-center gap-4 opacity-0 animate-fade-in-up"
                style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
              >
                <Link href="/dashboard">
                  <div className="group relative">
                    {/* Glow effect behind button */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl opacity-50 blur-lg group-hover:opacity-80 group-hover:blur-xl transition-all duration-500 animate-gradient bg-[length:200%_100%]" />
                    <Button
                      size="lg"
                      className="relative bg-brand-gradient text-primary-foreground rounded-2xl px-10 py-7 text-base font-bold shadow-2xl transition-all duration-500 group-hover:scale-[1.02] overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Start Staking
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_100%] opacity-0 group-hover:opacity-100 animate-gradient transition-opacity duration-500" />
                    </Button>
                  </div>
                </Link>
                <Link href="/campaigns">
                  <div className="group relative">
                    {/* Subtle border glow */}
                    <div className="absolute -inset-px bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Button
                      variant="outline"
                      size="lg"
                      className="relative border-2 border-border bg-background/80 backdrop-blur-sm hover:border-transparent hover:bg-background/90 text-foreground rounded-2xl px-10 py-7 text-base font-bold transition-all duration-500 group-hover:scale-[1.02]"
                    >
                      <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text group-hover:text-transparent transition-all duration-500">
                        Browse Campaigns
                      </span>
                    </Button>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-bounce">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </div>
      </section>

      {/* Featured Causes */}
      <FeaturedCauses />

      {/* How It Works */}
      <ArchitectureFlow />

      {/* Categories */}
      <CauseCategories />

      {/* Final CTA Section */}
      <section className="snap-section py-20 relative overflow-hidden flex flex-col justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />

        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-8">
            <Lock className="w-4 h-4" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-6">
            Ready to make an impact?
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto">
            Join thousands of donors changing the world without risking their assets.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <Link href="/dashboard">
              <div className="group relative">
                {/* Glow effect behind button */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl opacity-60 blur-xl group-hover:opacity-90 group-hover:blur-2xl transition-all duration-500 animate-gradient bg-[length:200%_100%]" />
                <Button
                  size="xl"
                  className="relative bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground rounded-2xl px-12 py-8 text-lg font-bold shadow-2xl transition-all duration-500 group-hover:scale-[1.02] overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Start Donating Now
                    <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_100%] opacity-0 group-hover:opacity-100 animate-gradient transition-opacity duration-500" />
                </Button>
              </div>
            </Link>
            <Link href="/ngos/register">
              <div className="group relative">
                {/* Subtle border glow */}
                <div className="absolute -inset-px bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Button
                  variant="outline"
                  size="xl"
                  className="relative border-2 border-border bg-background/80 backdrop-blur-sm hover:border-transparent hover:bg-background/90 text-foreground rounded-2xl px-12 py-8 text-lg font-bold transition-all duration-500 group-hover:scale-[1.02]"
                >
                  <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text group-hover:text-transparent transition-all duration-500">
                    Register as NGO
                  </span>
                </Button>
              </div>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div>
              <p className="text-3xl md:text-4xl font-black font-serif text-foreground">$2.4M</p>
              <p className="text-sm text-muted-foreground mt-1">Value Locked</p>
            </div>
            <div className="border-x border-border px-4">
              <p className="text-3xl md:text-4xl font-black font-serif text-primary">$420K</p>
              <p className="text-sm text-muted-foreground mt-1">Yield Donated</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black font-serif text-foreground">89</p>
              <p className="text-sm text-muted-foreground mt-1">Verified NGOs</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

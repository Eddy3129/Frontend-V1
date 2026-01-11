'use client'

import { Heart, Zap } from 'lucide-react'

// Mock recent donations - in production, this would come from on-chain events
const RECENT_DONATIONS = [
  { donor: '0x1a2...3b4c', amount: '$1,250', campaign: 'Save the Rainforest', time: '2m ago' },
  { donor: '0x5d6...7e8f', amount: '$500', campaign: 'Clean Water Initiative', time: '5m ago' },
  { donor: '0x9g0...1h2i', amount: '$2,000', campaign: 'Tech for Kids', time: '8m ago' },
  { donor: '0x3j4...5k6l', amount: '$750', campaign: 'Ocean Cleanup', time: '12m ago' },
  { donor: '0x7m8...9n0o', amount: '$3,500', campaign: 'Education for All', time: '15m ago' },
  { donor: '0xp1q...2r3s', amount: '$180', campaign: 'Wildlife Protection', time: '18m ago' },
  { donor: '0xt4u...5v6w', amount: '$920', campaign: 'Hunger Relief Fund', time: '22m ago' },
  { donor: '0xx7y...8z9a', amount: '$1,800', campaign: 'Medical Aid Africa', time: '25m ago' },
]

function DonationItem({
  donor,
  amount,
  campaign,
}: {
  donor: string
  amount: string
  campaign: string
}) {
  return (
    <div className="flex items-center gap-2 px-4 whitespace-nowrap text-sm">
      <Heart className="w-3 h-3 text-primary fill-primary/30" />
      <span className="font-mono text-muted-foreground">{donor}</span>
      <span className="font-bold text-primary">{amount}</span>
      <span className="text-muted-foreground/50">→</span>
      <span className="text-foreground/80">{campaign}</span>
    </div>
  )
}

export function DonationsMarquee() {
  return (
    <div className="w-full py-2.5 overflow-hidden border-b border-border/50 bg-secondary/30 backdrop-blur-sm">
      <div className="flex items-center">
        {/* Marquee container */}
        <div className="relative flex-1 overflow-hidden">
          {/* Gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-secondary/30 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-secondary/30 to-transparent z-10 pointer-events-none" />

          <div className="flex animate-marquee">
            {/* First set */}
            <div className="flex shrink-0">
              {RECENT_DONATIONS.map((donation, i) => (
                <DonationItem key={`a-${i}`} {...donation} />
              ))}
            </div>
            {/* Duplicate for seamless loop */}
            <div className="flex shrink-0">
              {RECENT_DONATIONS.map((donation, i) => (
                <DonationItem key={`b-${i}`} {...donation} />
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 px-4 border-l border-border/50 shrink-0 hidden md:flex">
          <Zap className="w-3 h-3 text-accent" />
          <span className="text-xs font-bold text-muted-foreground">$42.8K today</span>
        </div>
      </div>
    </div>
  )
}

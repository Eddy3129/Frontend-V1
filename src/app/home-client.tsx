'use client'

import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { ArrowRight, Users, Zap, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { FlipBook } from '@/components/home/FlipBook'
import { CampaignCard } from '@/components/campaigns/CampaignCard'
import { useCampaign } from '@/hooks/useCampaign'

// Mock featured campaigns for display
const MOCK_CAMPAIGNS = [
  {
    id: 1,
    title: 'Trees for Brazil',
    organizer: 'GreenEarth',
    target: 500000,
    current: 342000,
    donors: 1240,
    image:
      'https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    tags: ['Nature'],
  },
  {
    id: 2,
    title: 'Clean H2O Project',
    organizer: 'WaterWorks',
    target: 150000,
    current: 89000,
    donors: 850,
    image:
      'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    tags: ['Water'],
  },
  {
    id: 3,
    title: 'Tech for Kids',
    organizer: 'CodeFree',
    target: 200000,
    current: 12000,
    donors: 120,
    image:
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    tags: ['Education'],
  },
]

// Mock Campaign Card for homepage (when no on-chain data)
function MockCampaignCard({ campaign }: { campaign: (typeof MOCK_CAMPAIGNS)[0] }) {
  const progress = (campaign.current / campaign.target) * 100

  return (
    <div className="group relative bg-card rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-border">
      <div className="aspect-4/3 overflow-hidden relative">
        <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide text-foreground shadow-sm">
          {campaign.tags[0]}
        </div>
        <img
          src={campaign.image}
          alt={campaign.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/60 to-transparent">
          <h3 className="text-2xl font-serif font-bold leading-tight mb-1 text-white">
            {campaign.title}
          </h3>
          <p className="text-white/90 text-sm opacity-90">by {campaign.organizer}</p>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Yield Donated</p>
            <p className="text-2xl font-black text-foreground">
              ${(campaign.current / 1000).toFixed(1)}k
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Target</p>
            <p className="text-lg font-bold text-muted-foreground/60">
              ${(campaign.target / 1000).toFixed(0)}k
            </p>
          </div>
        </div>

        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mb-6">
          <div
            className="bg-yellow-500 h-full rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-sm font-medium text-foreground">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {campaign.donors} Stakers
          </div>
          <div className="flex items-center gap-1 text-white bg-secondary px-3 py-1 rounded-md">
            <Zap className="w-4 h-4" />
            Aave USDC
          </div>
        </div>
      </div>
    </div>
  )
}

// Real Campaign Cards Section
function FeaturedCampaigns() {
  const { useGetActiveCampaigns } = useCampaign()
  const { data: activeCampaigns } = useGetActiveCampaigns()

  const campaignIds = activeCampaigns?.slice(0, 3).map((c) => c.id) || []

  // If we have real campaigns, show them
  if (campaignIds.length > 0) {
    return (
      <div className="grid md:grid-cols-3 gap-8">
        {campaignIds.map((id) => (
          <CampaignCard key={id.toString()} campaignId={id} />
        ))}
      </div>
    )
  }

  // Otherwise show mock campaigns
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {MOCK_CAMPAIGNS.map((campaign) => (
        <MockCampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  )
}

export function HomeClient() {
  useAccount()

  return (
    <div className="min-h-screen text-foreground font-sans selection:bg-accent selection:text-accent-foreground">
      {/* Hero Section - Classy Style */}
      <section className="min-h-[90vh] max-w-6xl mx-auto px-6 text-center">
        <div className="mt-16 inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-white dark:text-teal-100 text-sm font-bold mb-8 border border-border">
          <ShieldCheck className="w-4 h-4" /> The No-Loss Donation Protocol
        </div>
        <h1 className="text-6xl md:text-8xl font-serif font-black text-foreground mb-6 leading-tight tracking-tight">
          Grow your wealth.
          <br />
          <span className="text-gradient-hero">Heal the world.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Deposit assets into secure DeFi vaults. Keep your principal 100% safe. Automatically
          donate the generated yield.
        </p>
        <div className="flex flex-col mt-10 sm:flex-row justify-center gap-4">
          <Link href="/campaigns">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 py-3 text-base font-bold shadow-md hover:shadow-lg transition-all duration-300 transform active:scale-95"
            >
              Browse Campaigns
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-primary text-primary hover:bg-secondary rounded-xl px-6 py-3 text-base font-bold"
            >
              View Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* The 3D Flipbook Section with How It Works */}
      <FlipBook />

      {/* Featured Campaigns Section */}
      <section className="max-w-6xl min-h-[80vh] mx-auto px-6 py-24">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-serif font-bold text-foreground">Featured Causes</h2>
            <p className="text-muted-foreground mt-2">Support verified campaigns with your yield</p>
          </div>
          <Link
            href="/campaigns"
            className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all"
          >
            See All <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <FeaturedCampaigns />
      </section>

      {/* Why Give Protocol Section */}
      {/* <section className="max-w-6xl mx-auto px-6 py-24 border-t border-emerald-100">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold text-emerald-950 mb-4">
            Why Give Protocol?
          </h2>
          <p className="text-emerald-800/60 max-w-xl mx-auto">
            Built for transparency, security, and community governance.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Shield,
              title: 'Principal Protected',
              desc: 'Only yield goes to NGOs—your deposit stays safe.',
            },
            {
              icon: Users,
              title: 'Community Governed',
              desc: 'Stakers vote on campaign checkpoints.',
            },
            {
              icon: Zap,
              title: 'Instant Withdrawals',
              desc: 'Access your funds anytime with no lock-up.',
            },
            {
              icon: CheckCircle2,
              title: 'Verified NGOs',
              desc: 'All organizations are thoroughly vetted.',
            },
          ].map((feature, i) => (
            <Card
              key={i}
              className="bg-card border border-border rounded-3xl shadow-none hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
            >
              <CardContent className="pt-8 pb-8 space-y-4 text-center">
                <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center group-hover:bg-secondary/80 transition-colors">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-xl text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section> */}
    </div>
  )
}

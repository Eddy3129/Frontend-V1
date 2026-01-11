'use client'

import { Wallet, Shield, TrendingUp, Heart } from 'lucide-react'
import { useInView } from '@/hooks/useInView'

const FLOW_STEPS = [
  {
    id: 'deposit',
    icon: Wallet,
    number: '01',
    title: 'Deposit',
    subtitle: 'Stake Your Assets',
    description:
      'Deposit USDC or ETH into our ERC-4626 compliant vaults. Your principal remains 100% protected and withdrawable anytime.',
  },
  {
    id: 'secure',
    icon: Shield,
    number: '02',
    title: 'Secure',
    subtitle: 'Protected Vaults',
    description:
      'Assets are secured in audited smart contracts following the tokenized vault standard with multi-sig administration.',
  },
  {
    id: 'yield',
    icon: TrendingUp,
    number: '03',
    title: 'Earn',
    subtitle: 'Generate Yield',
    description:
      'Your assets are deployed to Aave V3 to generate sustainable yield. Half stays with you, half funds causes.',
  },
  {
    id: 'impact',
    icon: Heart,
    number: '04',
    title: 'Impact',
    subtitle: 'Fund NGOs',
    description:
      'Yield is distributed to verified NGOs you choose. Community votes verify milestones before payouts.',
  },
]

// Cyclic clockwise animation: 01 → 02 → 04 → 03
// Each card's background expands FROM an edge while content stays fixed
// The flow stays WITHIN the container bounds (never goes outside)
const CYCLIC_ANIMATIONS = [
  {
    // 01 (Top-left): Background expands from LEFT edge
    clipPath: { hidden: 'inset(0 100% 0 0)', visible: 'inset(0 0 0 0)' },
    delay: 0,
  },
  {
    // 02 (Top-right): Background expands from TOP edge
    clipPath: { hidden: 'inset(0 0 100% 0)', visible: 'inset(0 0 0 0)' },
    delay: 600,
  },
  {
    // 03 (Bottom-left): Background expands from BOTTOM edge (comes last in cycle)
    clipPath: { hidden: 'inset(100% 0 0 0)', visible: 'inset(0 0 0 0)' },
    delay: 1800,
  },
  {
    // 04 (Bottom-right): Background expands from RIGHT edge
    clipPath: { hidden: 'inset(0 0 0 100%)', visible: 'inset(0 0 0 0)' },
    delay: 1200,
  },
]

function StepCard({
  step,
  index,
  isInView,
}: {
  step: (typeof FLOW_STEPS)[0]
  index: number
  isInView: boolean
}) {
  const Icon = step.icon
  const animation = CYCLIC_ANIMATIONS[index]

  return (
    <div className="relative p-6 lg:p-8 overflow-hidden">
      {/* Animated background layer - this is what animates */}
      <div
        className="absolute inset-0 bg-card border-r border-b border-border transition-all duration-[2400ms] ease-out"
        style={{
          clipPath: isInView ? animation.clipPath.visible : animation.clipPath.hidden,
          transitionDelay: `${animation.delay}ms`,
        }}
      />

      {/* Accent background during animation */}
      <div
        className={`absolute inset-0 bg-accent/10 transition-opacity duration-[2400ms] ease-out ${
          isInView ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ transitionDelay: `${animation.delay}ms` }}
      />

      {/* Step number - animates with background */}
      <span
        className="text-5xl lg:text-6xl font-black text-border/50 absolute top-3 right-4 font-mono transition-all duration-[2400ms] ease-out"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'scale(1)' : 'scale(1.5)',
          transitionDelay: `${animation.delay}ms`,
        }}
      >
        {step.number}
      </span>

      {/* Content - stays in fixed position, only fades in */}
      <div
        className="relative z-10 transition-opacity duration-[1800ms] ease-out"
        style={{
          opacity: isInView ? 1 : 0,
          transitionDelay: `${animation.delay + 300}ms`,
        }}
      >
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>

        {/* Text Content */}
        <h3 className="text-xl lg:text-2xl font-serif font-bold text-foreground mb-1">
          {step.title}
        </h3>
        <p className="text-xs lg:text-sm text-primary font-medium uppercase tracking-wider mb-3">
          {step.subtitle}
        </p>
        <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
          {step.description}
        </p>
      </div>
    </div>
  )
}

export function ArchitectureFlow() {
  const [sectionRef, isInView] = useInView<HTMLElement>({ threshold: 0.15, triggerOnce: false })

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
            From deposit to impact.
            <span className="block h-1 w-40 md:w-56 bg-gradient-to-r from-primary to-accent mt-3 rounded-full" />
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-xl leading-relaxed">
            A simple 4-step process that turns your assets into sustainable donations.
          </p>
        </div>
      </div>

      {/* 2x2 Grid with cyclic animation */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 border-t border-border">
        {FLOW_STEPS.map((step, index) => (
          <StepCard key={step.id} step={step} index={index} isInView={isInView} />
        ))}
      </div>

      {/* Section Divider Line - Bottom */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  )
}

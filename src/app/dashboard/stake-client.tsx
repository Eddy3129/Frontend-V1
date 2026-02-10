'use client'

import { useAccount } from 'wagmi'
import { useDonorDashboard, useNGODashboard } from '@/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { formatUnits } from 'viem'
import { formatDistanceToNow } from 'date-fns'
import {
  Wallet,
  TrendingUp,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Target,
  DollarSign,
  Briefcase,
  Sparkles,
  Heart,
  ChevronRight,
  ArrowRight,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { getGatewayUrl, parseCID } from '@/lib/pinata'
import Image from 'next/image'

// ── Helpers ──

/** Format an activity amount using the correct decimals for its campaign */
function formatActivityAmount(
  amount: string | null | undefined,
  campaignId: string,
  campaignDecimals: Map<string, { decimals: number; symbol: string }>
): string {
  if (!amount) return '-'
  const info = campaignDecimals.get(campaignId.toLowerCase())
  const decimals = info?.decimals ?? 18
  const symbol = info?.symbol ?? 'ETH'

  try {
    const value = Number(formatUnits(BigInt(amount), decimals))
    if (symbol === 'USDC') {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH`
  } catch {
    return '-'
  }
}

// ── Metric Card ──

function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconBg,
  index = 0,
}: {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  iconBg: string
  index?: number
}) {
  return (
    <Card
      className="relative overflow-hidden hover-shine group opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
    >
      <CardContent className="pt-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-black mt-2 font-serif">{value}</h3>
            {change && (
              <p
                className={cn(
                  'text-xs flex items-center mt-1 font-medium',
                  changeType === 'positive' && 'text-emerald-600',
                  changeType === 'negative' && 'text-red-500',
                  changeType === 'neutral' && 'text-muted-foreground'
                )}
              >
                {changeType === 'positive' && <ArrowUpRight className="h-3 w-3 mr-1" />}
                {changeType === 'negative' && <ArrowDownRight className="h-3 w-3 mr-1" />}
                {change}
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl transition-transform group-hover:scale-110', iconBg)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
      {/* Decorative gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Card>
  )
}

// ── Activity Item ──

function ActivityItem({
  action,
  target,
  amount,
  date,
  icon: Icon,
  color,
}: {
  action: string
  target: string
  amount: string
  date: string
  icon: LucideIcon
  color: string
}) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0 group hover:bg-muted/30 -mx-2 px-2 py-2 rounded-lg transition-colors">
      <div
        className={cn(
          'p-2 rounded-full',
          color.replace('text-', 'bg-').replace('600', '100'),
          'dark:bg-opacity-20'
        )}
      >
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <p className="text-sm font-bold truncate">{action}</p>
          <span className={cn('text-sm font-bold whitespace-nowrap ml-2', color)}>{amount}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{target}</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">{date}</p>
      </div>
    </div>
  )
}

// ── Main Component ──

export function StakeClient() {
  const { address, isConnected } = useAccount()
  const donorDashboard = useDonorDashboard(address)
  const ngoDashboard = useNGODashboard(address)

  // Only show NGO tab if user is a campaign proposer / payout recipient
  const showNGOTab = ngoDashboard.campaigns.length > 0

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-10">
        <div
          className="space-y-3 opacity-0 animate-fade-in-up"
          style={{ animationFillMode: 'forwards' }}
        >
          <h1 className="text-4xl font-bold font-serif">Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Connect your wallet to view your assets and campaign performance.
          </p>
        </div>

        <Card
          className="border-dashed border-2 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
        >
          <CardContent className="py-20 text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto">
              <div
                className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping"
                style={{ animationDuration: '2s' }}
              />
              <div
                className="absolute inset-2 rounded-full border-2 border-primary/30 animate-ping"
                style={{ animationDuration: '2s', animationDelay: '0.5s' }}
              />
              <div className="relative w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center">
                <Wallet className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold font-serif">Connect Your Wallet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Connect your wallet to access your personalized donor or NGO dashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl px-8"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
              <Link href="/campaigns">
                <Button variant="outline" size="lg" className="rounded-xl px-8">
                  Browse Campaigns
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-8">
      {/* Header */}
      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-0 animate-fade-in-up"
        style={{ animationFillMode: 'forwards' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-gradient-to-r from-primary to-accent rounded-full" />
            <span className="text-sm font-bold text-primary uppercase tracking-wider">
              Welcome Back
            </span>
          </div>
          <h1 className="text-3xl font-bold font-serif">Dashboard</h1>
          <p className="text-muted-foreground">Here's your impact overview for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/campaigns">
            <Button className="bg-gradient-to-r from-primary to-accent text-white rounded-xl">
              <Sparkles className="mr-2 h-4 w-4" />
              Stake More
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="donor" className="w-full">
        <TabsList
          className={cn(
            'p-1 bg-muted/50 rounded-xl',
            showNGOTab ? 'grid w-full grid-cols-2 lg:w-[400px]' : 'w-auto'
          )}
        >
          <TabsTrigger
            value="donor"
            className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Wallet className="h-4 w-4" />
            Donor View
          </TabsTrigger>
          {showNGOTab && (
            <TabsTrigger
              value="ngo"
              className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Briefcase className="h-4 w-4" />
              NGO Manager
            </TabsTrigger>
          )}
        </TabsList>

        {/* ═══════════ DONOR DASHBOARD ═══════════ */}
        <TabsContent value="donor" className="space-y-6 mt-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Total Assets Staked"
              value={`$${donorDashboard.totalStakedUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={Wallet}
              iconBg="bg-primary/10 text-primary"
              index={0}
            />

            <MetricCard
              title="Yield Earned"
              value={`$${donorDashboard.yieldEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`}
              change="Accumulated from vaults"
              changeType="neutral"
              icon={TrendingUp}
              iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
              index={1}
            />

            <MetricCard
              title="Campaigns Supported"
              value={donorDashboard.campaignsSupported.toString()}
              change={
                donorDashboard.yieldEarned > 0
                  ? `$${donorDashboard.yieldEarned.toFixed(2)} donated`
                  : undefined
              }
              changeType="positive"
              icon={Heart}
              iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600"
              index={2}
            />
          </div>

          {/* Single Column Layout */}
          <div className="space-y-6">
            {/* Stake Positions */}
            <Card
              className="opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-primary" />
                      Your Stakes
                    </CardTitle>
                    <CardDescription>Breakdown by campaign</CardDescription>
                  </div>
                  <Link href="/campaigns">
                    <Button variant="ghost" size="sm" className="text-primary">
                      View All <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {donorDashboard.stakePositions.length > 0 ? (
                  <div className="space-y-3">
                    {donorDashboard.stakePositions.map((position) => (
                      <Link
                        key={position.campaignId}
                        href={`/campaigns/${position.campaignId}`}
                        className="block p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-muted/30 transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          {/* NGO Logo */}
                          <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-accent/10">
                            {position.ngoLogo ? (
                              <Image
                                src={getGatewayUrl(parseCID(position.ngoLogo))}
                                alt={position.ngoName || 'NGO'}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Campaign Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm group-hover:text-primary transition-colors truncate">
                              {position.campaignName ||
                                `Campaign ${position.campaignId.slice(0, 8)}...`}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {position.ngoName || 'Organization'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full w-2/3" />
                              </div>
                              <span className="text-xs text-muted-foreground">Active</span>
                            </div>
                          </div>

                          {/* Stake Amount */}
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-base group-hover:text-primary transition-colors">
                              {position.amountFormatted}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {position.symbol}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <PieChart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {donorDashboard.isLoading
                        ? 'Loading your stakes...'
                        : 'No stakes yet. Visit campaigns to get started.'}
                    </p>
                    {!donorDashboard.isLoading && (
                      <Link href="/campaigns">
                        <Button variant="outline" size="sm" className="mt-4">
                          Browse Campaigns
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity Feed */}
            <Card
              className="opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {donorDashboard.recentActivity.length > 0 ? (
                  <div className="space-y-2">
                    {donorDashboard.recentActivity.slice(0, 5).map((activity) => {
                      const activityConfig =
                        activity.type === 'DEPOSIT'
                          ? { action: 'Staked', icon: TrendingUp, color: 'text-emerald-600' }
                          : activity.type === 'WITHDRAW'
                            ? { action: 'Withdrawn', icon: ArrowDownRight, color: 'text-red-600' }
                            : { action: 'Voted', icon: Users, color: 'text-blue-600' }

                      return (
                        <ActivityItem
                          key={activity.id}
                          action={activityConfig.action}
                          target={`Campaign ${activity.campaignId.slice(0, 8)}...`}
                          amount={
                            activity.type === 'VOTE'
                              ? `Checkpoint #${activity.checkpointIndex}`
                              : formatActivityAmount(
                                  activity.amount,
                                  activity.campaignId,
                                  donorDashboard.campaignDecimals
                                )
                          }
                          date={formatDistanceToNow(
                            new Date(Number(activity.blockTimestamp) * 1000),
                            { addSuffix: true }
                          )}
                          icon={activityConfig.icon}
                          color={activityConfig.color}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════ NGO DASHBOARD ═══════════ */}
        {showNGOTab && (
          <TabsContent value="ngo" className="space-y-6 mt-6">
            {/* NGO Identity Header */}
            {ngoDashboard.ngoName && (
              <div
                className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 opacity-0 animate-fade-in-up"
                style={{ animationFillMode: 'forwards' }}
              >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-accent/10 border border-border/50">
                  {ngoDashboard.ngoLogoUrl ? (
                    <Image
                      src={ngoDashboard.ngoLogoUrl}
                      alt={ngoDashboard.ngoName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-7 w-7 text-primary" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold font-serif truncate">{ngoDashboard.ngoName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Managing {ngoDashboard.activeCampaigns} active campaign
                    {ngoDashboard.activeCampaigns !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                title="Total Staked"
                value={
                  ngoDashboard.primarySymbol === 'ETH'
                    ? `${ngoDashboard.totalRaised.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ETH`
                    : `$${ngoDashboard.totalRaised.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
                icon={DollarSign}
                iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                index={0}
              />

              <MetricCard
                title="Active Campaigns"
                value={ngoDashboard.activeCampaigns.toString()}
                icon={Target}
                iconBg="bg-primary/10 text-primary"
                index={1}
              />

              <MetricCard
                title="Unique Donors"
                value={ngoDashboard.uniqueDonors.toString()}
                icon={Users}
                iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                index={2}
              />

              <MetricCard
                title="Avg. Donation"
                value={
                  ngoDashboard.uniqueDonors > 0
                    ? ngoDashboard.primarySymbol === 'ETH'
                      ? `${(ngoDashboard.totalRaised / ngoDashboard.uniqueDonors).toFixed(4)} ETH`
                      : `$${(ngoDashboard.totalRaised / ngoDashboard.uniqueDonors).toFixed(2)}`
                    : ngoDashboard.primarySymbol === 'ETH'
                      ? '0 ETH'
                      : '$0.00'
                }
                icon={Activity}
                iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                index={3}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Campaign Performance */}
              <Card
                className="lg:col-span-2 opacity-0 animate-fade-in-up"
                style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Campaign Performance
                      </CardTitle>
                      <CardDescription>Total staked and payouts received</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {ngoDashboard.campaigns.length > 0 ? (
                    ngoDashboard.campaigns.map((campaign) => (
                      <Link
                        key={campaign.id}
                        href={`/campaigns/${campaign.id}`}
                        className="block p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-muted/30 transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          {/* Campaign Logo */}
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-accent/10">
                            {campaign.ngoLogo ? (
                              <Image
                                src={getGatewayUrl(parseCID(campaign.ngoLogo))}
                                alt={campaign.name || 'Campaign'}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Target className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Campaign Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm group-hover:text-primary transition-colors truncate">
                                  {campaign.name || `Campaign ${campaign.id.slice(0, 8)}...`}
                                </h4>
                                <span
                                  className={cn(
                                    'inline-flex items-center text-xs font-medium mt-0.5 px-2 py-0.5 rounded-full',
                                    campaign.status === 3
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                      : campaign.status === 1
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'bg-muted text-muted-foreground'
                                  )}
                                >
                                  {campaign.status === 3
                                    ? 'Active'
                                    : campaign.status === 1
                                      ? 'Approved'
                                      : 'Other'}
                                </span>
                              </div>
                              <div className="text-right flex-shrink-0 ml-3">
                                <p className="font-bold text-sm">
                                  {campaign.totalStaked.toFixed(campaign.symbol === 'USDC' ? 2 : 4)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {campaign.symbol} staked
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${Math.min(100, campaign.totalStaked > 0 ? 60 : 0)}%`,
                                  }}
                                />
                              </div>
                              {campaign.payouts > 0 && (
                                <span className="text-xs text-emerald-600 font-medium whitespace-nowrap">
                                  {campaign.payouts.toFixed(campaign.symbol === 'USDC' ? 2 : 4)}{' '}
                                  {campaign.symbol} received
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No campaigns yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Donations */}
              <Card
                className="opacity-0 animate-fade-in-up"
                style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-primary" />
                        Recent Donations
                      </CardTitle>
                      <CardDescription>Latest supporter activity</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {ngoDashboard.recentActivity.length > 0 ? (
                    <div className="space-y-2">
                      {ngoDashboard.recentActivity.slice(0, 6).map((activity) => {
                        const shortAddr = `${activity.supporterId.slice(0, 6)}...${activity.supporterId.slice(-4)}`
                        const isDeposit = activity.type === 'DEPOSIT'
                        return (
                          <div
                            key={activity.id}
                            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold',
                                  isDeposit
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                                )}
                              >
                                {isDeposit ? (
                                  <ArrowUpRight className="h-4 w-4" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold font-mono">{shortAddr}</p>
                                <p className="text-xs text-muted-foreground">
                                  {isDeposit ? 'Staked' : 'Withdrew'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className={cn(
                                  'text-sm font-bold block',
                                  isDeposit ? 'text-emerald-600' : 'text-red-500'
                                )}
                              >
                                {formatActivityAmount(
                                  activity.amount,
                                  activity.campaignId,
                                  ngoDashboard.campaignDecimals
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(Number(activity.blockTimestamp) * 1000),
                                  { addSuffix: true }
                                )}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground">No recent donations</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

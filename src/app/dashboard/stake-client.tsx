'use client'

import { useConnection } from 'wagmi'
import { useVault } from '@/hooks/useVault'
import { useAaveAPY, formatAPY } from '@/hooks/useAaveAPY'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
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
  Calendar,
  Globe,
  Award,
  Sparkles,
  Heart,
  ChevronRight,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

// Enhanced Mock Data for Charts
const MOCK_PORTFOLIO_HISTORY = [
  { day: 'Mon', value: 1000 },
  { day: 'Tue', value: 1025 },
  { day: 'Wed', value: 1040 },
  { day: 'Thu', value: 1035 },
  { day: 'Fri', value: 1060 },
  { day: 'Sat', value: 1090 },
  { day: 'Sun', value: 1120 },
]

const MOCK_NGO_DONATIONS = [
  { day: 'Mon', value: 1200 },
  { day: 'Tue', value: 1850 },
  { day: 'Wed', value: 1400 },
  { day: 'Thu', value: 2200 },
  { day: 'Fri', value: 3100 },
  { day: 'Sat', value: 2800 },
  { day: 'Sun', value: 3500 },
]

const MOCK_REGIONS = [
  { name: 'North America', value: 45, color: 'bg-emerald-500' },
  { name: 'Europe', value: 30, color: 'bg-blue-500' },
  { name: 'Asia Pacific', value: 15, color: 'bg-amber-500' },
  { name: 'South America', value: 10, color: 'bg-purple-500' },
]

const MOCK_ALLOCATION = [
  {
    name: 'Save the Forests',
    percentage: 45,
    amount: 0,
    color: 'bg-emerald-500',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  {
    name: 'Clean Water Initiative',
    percentage: 30,
    amount: 0,
    color: 'bg-blue-500',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    name: 'Education for All',
    percentage: 15,
    amount: 0,
    color: 'bg-amber-500',
    gradient: 'from-amber-400 to-amber-600',
  },
  {
    name: 'Unallocated',
    percentage: 10,
    amount: 0,
    color: 'bg-stone-300',
    gradient: 'from-stone-300 to-stone-400',
  },
]

// Animated Line Chart Component
function AnimatedLineChart({
  data,
  color = 'text-primary',
  height = 60,
  strokeWidth = 2.5,
  showGradient = true,
}: {
  data: { value: number }[]
  color?: string
  height?: number
  strokeWidth?: number
  showGradient?: boolean
}) {
  const min = Math.min(...data.map((d) => d.value))
  const max = Math.max(...data.map((d) => d.value))
  const range = max - min || 1

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 100 - ((d.value - min) / range) * 100
      return `${x},${y}`
    })
    .join(' ')

  const areaPoints = `0,100 ${points} 100,100`

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {showGradient && (
          <polygon fill="url(#areaGradient)" points={areaPoints} className={color} />
        )}
        <polyline
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth={strokeWidth}
          points={points}
          className={color}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

// Enhanced Donut Chart
function DonutChart({ data }: { data: typeof MOCK_ALLOCATION }) {
  let accumulatedDeg = 0
  const gradients = data.map((item) => {
    const startDeg = accumulatedDeg
    const endDeg = accumulatedDeg + (item.percentage / 100) * 360
    accumulatedDeg = endDeg

    const colorMap: Record<string, string> = {
      'bg-emerald-500': '#10b981',
      'bg-blue-500': '#3b82f6',
      'bg-amber-500': '#f59e0b',
      'bg-stone-300': '#d6d3d1',
    }
    return `${colorMap[item.color] || '#ccc'} ${startDeg}deg ${endDeg}deg`
  })

  const gradientString = `conic-gradient(${gradients.join(', ')})`

  return (
    <div
      className="relative w-48 h-48 rounded-full mx-auto group"
      style={{ background: gradientString }}
    >
      <div className="absolute inset-3 bg-card rounded-full flex items-center justify-center shadow-inner">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Allocated
          </p>
          <p className="text-3xl font-black font-serif bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            90%
          </p>
        </div>
      </div>
      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: '0 0 40px rgba(16, 185, 129, 0.3)' }}
      />
    </div>
  )
}

// Metric Card Component
function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconBg,
  chart,
  index = 0,
}: {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  iconBg: string
  chart?: React.ReactNode
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
        {chart && (
          <div className="h-12 w-full opacity-50 group-hover:opacity-80 transition-opacity">
            {chart}
          </div>
        )}
      </CardContent>
      {/* Decorative gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Card>
  )
}

// Activity Item Component
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

export function StakeClient() {
  const { isConnected } = useConnection()
  const { formattedUserAssets } = useVault()
  const { strategies } = useAaveAPY()

  const maxApy = Math.max(...strategies.map((s) => s.apy || 0), 0)
  const totalBalance = parseFloat(formattedUserAssets || '0')
  const estimatedYield = totalBalance * (maxApy / 100)

  const allocationData = MOCK_ALLOCATION.map((item) => ({
    ...item,
    amount: totalBalance * (item.percentage / 100),
  }))

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
              {/* Animated rings */}
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
          <Button variant="outline" className="rounded-xl">
            <Calendar className="mr-2 h-4 w-4" />
            Last 7 Days
          </Button>
          <Button className="bg-gradient-to-r from-primary to-accent text-white rounded-xl">
            <Sparkles className="mr-2 h-4 w-4" />
            Stake More
          </Button>
        </div>
      </div>

      <Tabs defaultValue="donor" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] p-1 bg-muted/50 rounded-xl">
          <TabsTrigger
            value="donor"
            className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Wallet className="h-4 w-4" />
            Donor View
          </TabsTrigger>
          <TabsTrigger
            value="ngo"
            className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Briefcase className="h-4 w-4" />
            NGO Manager
          </TabsTrigger>
        </TabsList>

        {/* DONOR DASHBOARD */}
        <TabsContent value="donor" className="space-y-6 mt-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Total Assets Staked"
              value={`$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              change="+2.5% this month"
              changeType="positive"
              icon={Wallet}
              iconBg="bg-primary/10 text-primary"
              chart={
                <AnimatedLineChart data={MOCK_PORTFOLIO_HISTORY} color="text-primary" height={48} />
              }
              index={0}
            />

            <MetricCard
              title="Est. Annual Yield"
              value={`+$${estimatedYield.toFixed(2)}`}
              change={`Based on ${formatAPY(maxApy)} APY`}
              changeType="neutral"
              icon={TrendingUp}
              iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
              index={1}
            />

            <MetricCard
              title="Impact Score"
              value="850"
              change="Top 10% of donors"
              changeType="positive"
              icon={Award}
              iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600"
              index={2}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Allocation Chart */}
            <Card
              className="lg:col-span-2 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-primary" />
                      Asset Allocation
                    </CardTitle>
                    <CardDescription>Distribution across campaigns</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary">
                    Manage <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <DonutChart data={allocationData} />
                  <div className="flex-1 w-full space-y-4">
                    {allocationData.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn('w-3 h-3 rounded-full bg-gradient-to-r', item.gradient)}
                          />
                          <span className="font-medium text-sm group-hover:text-primary transition-colors">
                            {item.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold block">${item.amount.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Feed */}
            <Card
              className="opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Your latest transactions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <ActivityItem
                    action="Staked"
                    target="Save the Forests"
                    amount="+$500.00"
                    date="2 days ago"
                    icon={TrendingUp}
                    color="text-emerald-600"
                  />
                  <ActivityItem
                    action="Yield Claimed"
                    target="Protocol"
                    amount="+$12.50"
                    date="5 days ago"
                    icon={DollarSign}
                    color="text-amber-600"
                  />
                  <ActivityItem
                    action="Voted"
                    target="Clean Water"
                    amount="Checkpoint #2"
                    date="1 week ago"
                    icon={Users}
                    color="text-blue-600"
                  />
                  <ActivityItem
                    action="Staked"
                    target="Education for All"
                    amount="+$200.00"
                    date="2 weeks ago"
                    icon={TrendingUp}
                    color="text-emerald-600"
                  />
                </div>
                <Button variant="ghost" className="w-full mt-4 text-xs hover:text-primary">
                  View All History
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* NGO DASHBOARD */}
        <TabsContent value="ngo" className="space-y-6 mt-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Raised"
              value="$45,231.00"
              change="+12% this week"
              changeType="positive"
              icon={DollarSign}
              iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
              index={0}
            />

            <MetricCard
              title="Active Campaigns"
              value="3"
              change="1 pending review"
              changeType="neutral"
              icon={Target}
              iconBg="bg-primary/10 text-primary"
              index={1}
            />

            <MetricCard
              title="Unique Donors"
              value="1,204"
              change="+54 new"
              changeType="positive"
              icon={Users}
              iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
              index={2}
            />

            <MetricCard
              title="Avg. Donation"
              value="$37.50"
              change="Global avg: $32"
              changeType="positive"
              icon={Activity}
              iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600"
              index={3}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donation Inflow Chart */}
            <Card
              className="lg:col-span-2 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Donation Inflow
                    </CardTitle>
                    <CardDescription>
                      Daily donation volume (USD) over the last 7 days
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent" />
                    <span className="text-muted-foreground">Total: $16,050</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4 flex items-end justify-between gap-2 px-2">
                  {MOCK_NGO_DONATIONS.map((d, i) => (
                    <div
                      key={d.day}
                      className="flex flex-col items-center gap-2 w-full group h-full justify-end"
                    >
                      <div
                        className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg group-hover:from-accent group-hover:to-accent/60 transition-all duration-300 relative min-h-[4px] shadow-sm"
                        style={{
                          height: `${Math.max((d.value / 4000) * 100, 5)}%`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      >
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs py-2 px-4 rounded-lg opacity-0 group-hover:opacity-100 shadow-xl transition-all duration-200 whitespace-nowrap z-10 border font-bold">
                          <div className="text-primary">${d.value.toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground">{d.day}</div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{d.day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Donors */}
            <Card
              className="opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary" />
                      Top Donors
                    </CardTitle>
                    <CardDescription>Recent contributions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      user: '0x12...45A',
                      amount: '$5,000.00',
                      campaign: 'Save the Forests',
                      time: '2h ago',
                      rank: 1,
                    },
                    {
                      user: '0x8B...9CC',
                      amount: '$2,500.00',
                      campaign: 'Clean Water',
                      time: '5h ago',
                      rank: 2,
                    },
                    {
                      user: '0x4F...112',
                      amount: '$1,200.00',
                      campaign: 'Education',
                      time: '1d ago',
                      rank: 3,
                    },
                    {
                      user: '0x99...777',
                      amount: '$850.00',
                      campaign: 'Save the Forests',
                      time: '1d ago',
                      rank: 4,
                    },
                    {
                      user: '0x3D...22F',
                      amount: '$500.00',
                      campaign: 'Clean Water',
                      time: '2d ago',
                      rank: 5,
                    },
                  ].map((item) => (
                    <div
                      key={item.user}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                            {item.user.charAt(2)}
                          </div>
                          {item.rank <= 3 && (
                            <div
                              className={cn(
                                'absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                                item.rank === 1 && 'bg-amber-400 text-amber-900',
                                item.rank === 2 && 'bg-slate-300 text-slate-700',
                                item.rank === 3 && 'bg-amber-600 text-amber-100'
                              )}
                            >
                              {item.rank}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold font-mono">{item.user}</p>
                          <p className="text-xs text-muted-foreground">{item.campaign}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-600 block">
                          {item.amount}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 text-xs">
                  View All Donors
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Performance & Geographic Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              className="opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Campaign Performance
                </CardTitle>
                <CardDescription>Yield generated vs Goal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    name: 'Save the Forests',
                    raised: 45000,
                    goal: 100000,
                    color: 'bg-emerald-500',
                  },
                  {
                    name: 'Clean Water Initiative',
                    raised: 28000,
                    goal: 50000,
                    color: 'bg-blue-500',
                  },
                  { name: 'Education for All', raised: 15000, goal: 80000, color: 'bg-amber-500' },
                ].map((campaign) => (
                  <div key={campaign.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{campaign.name}</span>
                      <span className="text-muted-foreground font-bold">
                        {Math.round((campaign.raised / campaign.goal) * 100)}%
                      </span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-1000',
                          campaign.color
                        )}
                        style={{ width: `${(campaign.raised / campaign.goal) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>${campaign.raised.toLocaleString()} raised</span>
                      <span>${campaign.goal.toLocaleString()} goal</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card
              className="opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Geographic Impact
                </CardTitle>
                <CardDescription>Top regions supporting campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {MOCK_REGIONS.map((region) => (
                  <div key={region.name} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{region.name}</span>
                      <span className="text-primary font-bold">{region.value}%</span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-1000',
                          region.color
                        )}
                        style={{ width: `${region.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

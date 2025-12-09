'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  { name: 'Save the Forests', percentage: 45, amount: 0, color: 'bg-emerald-500' },
  { name: 'Clean Water Initiative', percentage: 30, amount: 0, color: 'bg-blue-500' },
  { name: 'Education for All', percentage: 15, amount: 0, color: 'bg-amber-500' },
  { name: 'Unallocated', percentage: 10, amount: 0, color: 'bg-stone-300' },
]

// Simple SVG Line Chart Component
function SimpleLineChart({
  data,
  color = 'text-primary',
  height = 60,
  strokeWidth = 2,
}: {
  data: { value: number }[]
  color?: string
  height?: number
  strokeWidth?: number
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

  return (
    <div className={`relative w-full h-[${height}px] overflow-hidden`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke="currentColor"
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

// Simple Donut Chart using CSS conic-gradient
function DonutChart({ data }: { data: typeof MOCK_ALLOCATION }) {
  // Construct conic gradient string
  let accumulatedDeg = 0
  const gradients = data.map((item) => {
    const startDeg = accumulatedDeg
    const endDeg = accumulatedDeg + (item.percentage / 100) * 360
    accumulatedDeg = endDeg

    // Map Tailwind classes to hex for gradient (simplified)
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
    <div className="relative w-48 h-48 rounded-full mx-auto" style={{ background: gradientString }}>
      <div className="absolute inset-4 bg-card rounded-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-bold font-serif">100%</p>
        </div>
      </div>
    </div>
  )
}

export function StakeClient() {
  const { isConnected } = useConnection()
  const { formattedUserAssets } = useVault()
  const { strategies } = useAaveAPY()

  // Get highest APY for display
  const maxApy = Math.max(...strategies.map((s) => s.apy || 0), 0)

  // Mock calculated values based on real vault data
  const totalBalance = parseFloat(formattedUserAssets || '0')
  const estimatedYield = totalBalance * (maxApy / 100)

  // Update allocation mock with real balance
  const allocationData = MOCK_ALLOCATION.map((item) => ({
    ...item,
    amount: totalBalance * (item.percentage / 100),
  }))

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-10">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Connect your wallet to view your assets and campaign performance.
          </p>
        </div>
        <Card className="card-highlight">
          <CardContent className="py-20 text-center space-y-6">
            <div className="icon-box-brand-xl mx-auto">
              <Wallet className="h-8 w-8" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Connect Your Wallet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Connect your wallet to access your personalized donor or NGO dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-serif">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your impact overview.</p>
        </div>
      </div>

      <Tabs defaultValue="donor" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="donor" className="gap-2">
            <Wallet className="h-4 w-4" />
            Donor View
          </TabsTrigger>
          <TabsTrigger value="ngo" className="gap-2">
            <Briefcase className="h-4 w-4" />
            NGO Manager
          </TabsTrigger>
        </TabsList>

        {/* DONOR DASHBOARD */}
        <TabsContent value="donor" className="space-y-6 mt-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="card-default relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Assets Staked</p>
                    <h3 className="text-3xl font-bold mt-2">
                      $
                      {totalBalance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </h3>
                    <p className="text-xs text-emerald-600 flex items-center mt-1">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +2.5% this month
                    </p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Wallet className="h-5 w-5" />
                  </div>
                </div>
                <div className="h-12 w-full opacity-20">
                  <SimpleLineChart data={MOCK_PORTFOLIO_HISTORY} color="text-primary" height={48} />
                </div>
              </CardContent>
            </Card>

            <Card className="card-default">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Est. Annual Yield</p>
                    <h3 className="text-3xl font-bold mt-2 text-emerald-600">
                      +${estimatedYield.toFixed(2)}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on {formatAPY(maxApy)} APY
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-default">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Impact Score</p>
                    <h3 className="text-3xl font-bold mt-2 text-primary">850</h3>
                    <p className="text-xs text-muted-foreground mt-1">Top 10% of donors</p>
                  </div>
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
                    <Award className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Allocation Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
                <CardDescription>Distribution across campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <DonutChart data={allocationData} />
                  <div className="flex-1 w-full space-y-4">
                    {allocationData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="font-medium text-sm">{item.name}</span>
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
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    {
                      action: 'Staked',
                      target: 'Save the Forests',
                      amount: '+$500.00',
                      date: '2 days ago',
                      icon: TrendingUp,
                      color: 'text-emerald-600',
                    },
                    {
                      action: 'Yield Claimed',
                      target: 'Protocol',
                      amount: '+$12.50',
                      date: '5 days ago',
                      icon: DollarSign,
                      color: 'text-amber-600',
                    },
                    {
                      action: 'Voted',
                      target: 'Clean Water',
                      amount: 'Checkpoint #2',
                      date: '1 week ago',
                      icon: Users,
                      color: 'text-blue-600',
                    },
                    {
                      action: 'Staked',
                      target: 'Education for All',
                      amount: '+$200.00',
                      date: '2 weeks ago',
                      icon: TrendingUp,
                      color: 'text-emerald-600',
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0"
                    >
                      <div
                        className={cn(
                          'p-2 rounded-full bg-muted',
                          item.color.replace('text-', 'bg-').replace('600', '100')
                        )}
                      >
                        <item.icon className={cn('h-4 w-4', item.color)} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-bold">{item.action}</p>
                          <span className={cn('text-sm font-medium', item.color)}>
                            {item.amount}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.target}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4 text-xs">
                  View All History
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* NGO DASHBOARD */}
        <TabsContent value="ngo" className="space-y-6 mt-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="card-default">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Raised</p>
                    <h3 className="text-3xl font-bold mt-2">$45,231.00</h3>
                    <p className="text-xs text-emerald-600 mt-1 flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +12% this week
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-default">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                    <h3 className="text-3xl font-bold mt-2">3</h3>
                    <p className="text-xs text-muted-foreground mt-1">1 pending review</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Target className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-default">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unique Donors</p>
                    <h3 className="text-3xl font-bold mt-2">1,204</h3>
                    <p className="text-xs text-emerald-600 mt-1 flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +54 new
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-default">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Donation</p>
                    <h3 className="text-3xl font-bold mt-2">$37.50</h3>
                    <p className="text-xs text-muted-foreground mt-1">Global avg: $32</p>
                  </div>
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Donation Inflow</CardTitle>
                <CardDescription>Daily donation volume (USD) over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4 flex items-end justify-between gap-2 px-2">
                  {MOCK_NGO_DONATIONS.map((d) => (
                    <div
                      key={d.day}
                      className="flex flex-col items-center gap-2 w-full group h-full justify-end"
                    >
                      <div
                        className="w-full bg-primary/80 rounded-t-lg group-hover:bg-primary transition-all relative min-h-[4px]"
                        style={{ height: `${Math.max((d.value / 4000) * 100, 5)}%` }}
                      >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs py-1.5 px-3 rounded-md opacity-0 group-hover:opacity-100 shadow-lg transition-opacity whitespace-nowrap z-10 border font-bold">
                          ${d.value.toLocaleString()}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{d.day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Donors</CardTitle>
                <CardDescription>Recent significant contributions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    {
                      user: '0x12...45A',
                      amount: '$5,000.00',
                      campaign: 'Save the Forests',
                      time: '2 hours ago',
                    },
                    {
                      user: '0x8B...9CC',
                      amount: '$2,500.00',
                      campaign: 'Clean Water',
                      time: '5 hours ago',
                    },
                    {
                      user: '0x4F...112',
                      amount: '$1,200.00',
                      campaign: 'Education',
                      time: '1 day ago',
                    },
                    {
                      user: '0x99...777',
                      amount: '$850.00',
                      campaign: 'Save the Forests',
                      time: '1 day ago',
                    },
                    {
                      user: '0x3D...22F',
                      amount: '$500.00',
                      campaign: 'Clean Water',
                      time: '2 days ago',
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between pb-3 border-b border-border/50 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-white text-xs font-bold">
                          {item.user.charAt(2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{item.user}</p>
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
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Yield generated vs Goal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <div key={campaign.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{campaign.name}</span>
                      <span className="text-muted-foreground">
                        {Math.round((campaign.raised / campaign.goal) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full', campaign.color)}
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

            <Card>
              <CardHeader>
                <CardTitle>Geographic Impact</CardTitle>
                <CardDescription>Top regions supporting campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {MOCK_REGIONS.map((region) => (
                  <div key={region.name} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{region.name}</span>
                      <span>{region.value}%</span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full', region.color)}
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

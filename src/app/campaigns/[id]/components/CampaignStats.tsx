import { Percent, Target, TrendingUp, Users } from 'lucide-react'

interface CampaignStatsProps {
  progressDisplay: number
  raisedDisplay: number
  isEthStrategy: boolean
  vaultTotalAssetsNum: number
  apy: number
  totalStakers: number
  isStakersLoading: boolean
}

export function CampaignStats({
  progressDisplay,
  raisedDisplay,
  isEthStrategy,
  vaultTotalAssetsNum,
  apy,
  totalStakers,
  isStakersLoading,
}: CampaignStatsProps) {
  return (
    <div className="p-6 space-y-4">
      {/* Row 1: Target % with Wave | TVL */}
      <div className="grid grid-cols-2 gap-3">
        {/* Target % with wave animation */}
        <div className="p-3 bg-muted/30 border border-border rounded-xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <Percent className="h-4 w-4 text-teal-600" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Target</span>
          </div>
          <p className="text-xl font-bold text-teal-600 relative z-10">
            {progressDisplay.toFixed(1)}%
          </p>
          {/* Wave animation background */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-teal-500/20 to-transparent transition-all duration-1000"
            style={{ height: `${Math.min(progressDisplay, 100)}%` }}
          >
            <svg
              className="absolute top-0 left-0 w-full"
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
              style={{ height: '8px', transform: 'translateY(-50%)' }}
            >
              <path
                d="M0,5 Q25,0 50,5 T100,5"
                fill="none"
                stroke="rgb(20 184 166 / 0.4)"
                strokeWidth="2"
                className="animate-pulse"
              />
            </svg>
          </div>
        </div>
        {/* TVL */}
        <div className="p-3 bg-muted/30 border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">TVL</span>
          </div>
          <p className="text-lg font-bold">
            ${raisedDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-muted-foreground">
            {isEthStrategy
              ? `${vaultTotalAssetsNum.toFixed(4)} ETH`
              : `${vaultTotalAssetsNum.toLocaleString()} USDC`}
          </p>
        </div>
      </div>

      {/* Row 2: APY with mini graph | Donations */}
      <div className="grid grid-cols-2 gap-3">
        {/* APY with mini line graph */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">APY</span>
            </div>
            {/* Mini line graph */}
            <svg width="40" height="16" className="text-emerald-500">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,12 8,8 16,10 24,4 32,6 40,2"
              />
            </svg>
          </div>
          <p className="text-xl font-bold text-emerald-600">{apy.toFixed(1)}%</p>
        </div>

        <div className="p-3 bg-muted/30 border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Stakers</span>
          </div>
          <p className="text-xl font-bold">{isStakersLoading ? '...' : (totalStakers ?? 0)}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
      </div>
    </div>
  )
}

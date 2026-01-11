import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, TrendingUp } from 'lucide-react'

interface FundingProgressCardProps {
  raisedUsd: number
  goal: number
  progressDisplay: number
  startTime: Date
  endTime: Date
  dailyYieldGeneration: number
  selectedAsset: 'USDC' | 'ETH'
  ethPriceStale: boolean
  isEthStrategy: boolean
  vaultTotalAssetsNum: number
}

export function FundingProgressCard({
  raisedUsd,
  goal,
  progressDisplay,
  startTime,
  endTime,
  dailyYieldGeneration,
  selectedAsset,
  ethPriceStale,
  isEthStrategy,
  vaultTotalAssetsNum,
}: FundingProgressCardProps) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-3xl font-bold">
                ${raisedUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground">
                of ${goal.toLocaleString()} goal
                {selectedAsset === 'ETH' && ethPriceStale && (
                  <span className="ml-2 text-amber-500">(price stale)</span>
                )}
                {isEthStrategy && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    (
                    {vaultTotalAssetsNum.toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })}{' '}
                    ETH)
                  </span>
                )}
              </p>
            </div>
            <p className="text-2xl font-bold text-teal-600">{progressDisplay.toFixed(1)}%</p>
          </div>
          <Progress
            value={progressDisplay}
            className="h-3 bg-teal-100"
            indicatorClassName="bg-teal-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Starts</p>
            <p className="font-medium text-sm">{startTime.toLocaleDateString()}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Ends</p>
            <p className="font-medium text-sm">{endTime.toLocaleDateString()}</p>
          </div>
        </div>

        {/* Daily Yield Generation */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Daily Yield Generation
              </span>
            </div>
            <p className="font-bold text-emerald-600">${dailyYieldGeneration.toFixed(4)}/day</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

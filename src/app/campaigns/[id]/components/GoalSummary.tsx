import { Progress } from '@/components/ui/progress'

interface GoalSummaryProps {
  raisedDisplay: number
  goal: number
  progressDisplay: number
  endTime: Date
  isEthStrategy: boolean
  vaultTotalAssetsNum: number
}

export function GoalSummary({
  raisedDisplay,
  goal,
  progressDisplay,
  endTime,
  isEthStrategy,
  vaultTotalAssetsNum,
}: GoalSummaryProps) {
  const daysLeft = Math.max(0, Math.ceil((endTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="p-6 border-t border-border space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-3xl font-bold text-primary">
            ${raisedDisplay.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">
            raised of ${goal.toLocaleString()} goal
            {isEthStrategy && (
              <span className="block text-xs mt-0.5">
                (
                {vaultTotalAssetsNum.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}{' '}
                ETH)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-teal-600">{progressDisplay.toFixed(1)}%</span>
          <span className="text-sm text-muted-foreground">{daysLeft} Days left</span>
        </div>
      </div>
      <Progress
        value={progressDisplay}
        className="h-3 bg-teal-100"
        indicatorClassName="bg-gradient-to-r from-teal-400 to-teal-600"
      />
    </div>
  )
}

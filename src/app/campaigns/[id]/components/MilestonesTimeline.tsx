import type { CampaignMetadata } from '@/lib/pinata'

interface MilestonesTimelineProps {
  milestones: CampaignMetadata['milestones'] | undefined
  raisedUsd: number
}

export function MilestonesTimeline({ milestones, raisedUsd }: MilestonesTimelineProps) {
  if (!milestones || milestones.length === 0) {
    return <p className="text-sm text-muted-foreground">No milestones defined</p>
  }

  return (
    <div className="space-y-4">
      {milestones.slice(0, 4).map((milestone, index) => {
        const milestoneTarget = parseFloat(milestone.targetAmount || '0')
        const isCompleted = raisedUsd >= milestoneTarget
        const previousTarget = parseFloat(milestones[index - 1]?.targetAmount || '0')
        const isCurrent = !isCompleted && (index === 0 || raisedUsd >= previousTarget)
        const progressPercent =
          milestoneTarget > 0 ? Math.min(100, (raisedUsd / milestoneTarget) * 100) : 0

        return (
          <div
            key={index}
            className={`p-4 rounded-xl border ${
              isCompleted
                ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
                : isCurrent
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-muted/30 border-border'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 ${
                  isCompleted
                    ? 'bg-teal-500 border-teal-500 text-white'
                    : isCurrent
                      ? 'bg-primary border-primary text-white'
                      : 'bg-background border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{milestone.title}</p>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      ${raisedUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} / $
                      {milestoneTarget.toLocaleString()}
                    </span>
                    <span
                      className={
                        isCompleted ? 'text-teal-600 font-medium' : 'text-muted-foreground'
                      }
                    >
                      {progressPercent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-teal-500' : 'bg-gradient-to-r from-primary/60 to-primary'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

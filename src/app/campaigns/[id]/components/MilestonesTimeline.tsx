import type { CampaignMetadata } from '@/lib/pinata'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'

interface MilestonesTimelineProps {
  milestones: CampaignMetadata['milestones'] | undefined
  raisedUsd: number
}

type TimeStatus = 'overdue' | 'approaching' | 'active' | 'upcoming' | 'no-deadline'

function getMilestoneTimeStatus(
  startDate?: string,
  endDate?: string
): { status: TimeStatus; label: string; daysRemaining: number } {
  if (!endDate) return { status: 'no-deadline', label: '', daysRemaining: 0 }

  const now = new Date()
  const end = new Date(endDate)
  const start = startDate ? new Date(startDate) : null
  const daysUntilEnd = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (now > end) {
    return {
      status: 'overdue',
      label: `Overdue by ${Math.abs(daysUntilEnd)} days`,
      daysRemaining: daysUntilEnd,
    }
  }
  if (daysUntilEnd <= 7) {
    return {
      status: 'approaching',
      label: `${daysUntilEnd} days left`,
      daysRemaining: daysUntilEnd,
    }
  }
  if (start && now < start) {
    return {
      status: 'upcoming',
      label: `Starts ${start.toLocaleDateString()}`,
      daysRemaining: daysUntilEnd,
    }
  }
  return { status: 'active', label: `${daysUntilEnd} days remaining`, daysRemaining: daysUntilEnd }
}

function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate && !endDate) return 'No deadline'
  if (!startDate && endDate) return `Due ${new Date(endDate).toLocaleDateString()}`
  if (startDate && !endDate) return `From ${new Date(startDate).toLocaleDateString()}`

  const start = new Date(startDate!)
  const end = new Date(endDate!)
  return `${start.toLocaleDateString()} — ${end.toLocaleDateString()}`
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

        const timeStatus = getMilestoneTimeStatus(milestone.startDate, milestone.endDate)
        const dateRange = formatDateRange(milestone.startDate, milestone.endDate)

        // Determine if overdue takes precedence over completion
        const isOverdue = timeStatus.status === 'overdue' && !isCompleted

        return (
          <div
            key={index}
            className={`p-4 rounded-xl border-2 transition-all ${
              isOverdue
                ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800'
                : isCompleted
                  ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
                  : isCurrent
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-muted/30 border-border'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 ${
                  isOverdue
                    ? 'bg-red-500 border-red-500 text-white'
                    : isCompleted
                      ? 'bg-teal-500 border-teal-500 text-white'
                      : isCurrent
                        ? 'bg-primary border-primary text-white'
                        : 'bg-background border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1">{milestone.title}</p>
                    {/* Date range */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span className={isCompleted ? 'line-through' : ''}>{dateRange}</span>
                    </div>
                  </div>
                  {/* Time status badge */}
                  {timeStatus.status !== 'no-deadline' && (
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${
                        timeStatus.status === 'overdue'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700'
                          : timeStatus.status === 'approaching'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                            : timeStatus.status === 'upcoming'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                      }`}
                    >
                      {timeStatus.label}
                    </Badge>
                  )}
                </div>

                {/* Deliverables */}
                {milestone.deliverables && (
                  <p className="text-xs text-muted-foreground italic">{milestone.deliverables}</p>
                )}

                {/* Fundraising progress */}
                <div>
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

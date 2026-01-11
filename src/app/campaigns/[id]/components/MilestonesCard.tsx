import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, ChevronDown, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Milestone {
  title: string
  description: string
}

interface MilestonesCardProps {
  milestones?: Milestone[]
  goal: number
  raisedUsd: number
  vaultTotalAssetsNum: number
  isEthStrategy: boolean
  isLoading: boolean
  checkpointCount: number
}

export function MilestonesCard({
  milestones = [],
  goal,
  raisedUsd,
  vaultTotalAssetsNum,
  isEthStrategy,
  isLoading,
  checkpointCount,
}: MilestonesCardProps) {
  const [expandedMilestones, setExpandedMilestones] = useState(false)

  const getMilestoneTarget = (index: number) => {
    const cumulative = [25, 60, 100]
    return (goal * (cumulative[index] || 100)) / 100
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Campaign Milestones
            </CardTitle>
            <CardDescription className="mt-1">
              {checkpointCount > 0
                ? `${checkpointCount} milestones to achieve campaign goals`
                : 'No milestones defined'}
            </CardDescription>
          </div>
          {checkpointCount > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedMilestones(!expandedMilestones)}
              className="text-muted-foreground"
            >
              {expandedMilestones ? 'Show Current' : 'Show All'}
              <ChevronDown
                className={cn(
                  'h-4 w-4 ml-1 transition-transform',
                  expandedMilestones && 'rotate-180'
                )}
              />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse flex gap-4">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            </div>
          </div>
        ) : checkpointCount === 0 ? (
          <p className="text-muted-foreground text-sm">No milestones defined</p>
        ) : (
          <div className="relative">
            {/* Vertical line - only show when expanded */}
            {expandedMilestones && (
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
            )}

            <div className="space-y-4">
              {milestones.map((milestone, index) => {
                const milestoneTarget = getMilestoneTarget(index)
                const isCompleted = raisedUsd >= milestoneTarget
                const isCurrent =
                  !isCompleted && (index === 0 || raisedUsd >= getMilestoneTarget(index - 1))

                // Only show current milestone unless expanded
                if (!expandedMilestones && !isCurrent) return null

                return (
                  <div key={index} className="relative flex gap-4">
                    {/* Step indicator */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10',
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                            ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                            : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="font-bold">{index + 1}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div
                      className={cn('flex-1 pb-2', isCurrent && 'bg-primary/5 -m-3 p-3 rounded-lg')}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold text-base">{milestone.title}</h4>
                          {isCurrent && (
                            <Badge
                              variant="outline"
                              className="text-xs mt-1 bg-primary/10 text-teal-900 dark:text-teal-100 border-primary/20"
                            >
                              Current Goal
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge
                              variant="outline"
                              className="text-xs mt-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            >
                              Completed
                            </Badge>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-lg">
                            {`$${milestoneTarget.toLocaleString()}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {((milestoneTarget / goal) * 100).toFixed(0)}% of TVL
                          </p>
                        </div>
                      </div>

                      {/* Progress for current milestone */}
                      {isCurrent && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>
                              {isEthStrategy
                                ? `${vaultTotalAssetsNum.toLocaleString()} ETH ($${raisedUsd.toLocaleString()})`
                                : `$${raisedUsd.toLocaleString()}`}{' '}
                              raised
                            </span>
                            <span>{((raisedUsd / milestoneTarget) * 100).toFixed(1)}%</span>
                          </div>
                          <Progress
                            value={(raisedUsd / milestoneTarget) * 100}
                            className="h-3 bg-teal-100"
                            indicatorClassName="bg-teal-500"
                          />
                        </div>
                      )}

                      <p className="text-sm text-muted-foreground mt-3 text-justify pr-4">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

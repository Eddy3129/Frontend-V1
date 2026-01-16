'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Vote, TrendingUp } from 'lucide-react'
import { formatUnits } from 'viem'

interface VotingPowerCardProps {
  votingPower: bigint
  votingPowerPercent: number
  onViewGovernance: () => void
}

export function VotingPowerCard({
  votingPower,
  votingPowerPercent,
  onViewGovernance,
}: VotingPowerCardProps) {
  if (votingPower === 0n) {
    return null // Don't show if user has no voting power
  }

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Vote className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium">Your Voting Power</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            Active
          </Badge>
        </div>

        {/* Voting Power Display */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {votingPowerPercent.toFixed(2)}%
            </p>
            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-xs text-muted-foreground">
            {parseFloat(formatUnits(votingPower, 18)).toFixed(4)} voting shares
          </p>
        </div>

        {/* Action */}
        <button
          onClick={onViewGovernance}
          className="w-full text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium"
        >
          View active proposals →
        </button>
      </CardContent>
    </Card>
  )
}

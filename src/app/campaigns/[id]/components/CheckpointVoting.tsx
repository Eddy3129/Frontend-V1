'use client'

import { useMemo } from 'react'
import { CheckpointVoteCard } from './CheckpointVoteCard'
import { Vote, Calendar } from 'lucide-react'

interface CheckpointVotingProps {
  campaignId: `0x${string}`
  milestones?: Array<{
    title: string
    description?: string
    targetAmount?: string
  }>
  chainId?: number
}

export function CheckpointVoting({ campaignId, milestones, chainId }: CheckpointVotingProps) {
  // For now, we'll display checkpoints based on milestones
  // In a real implementation, you'd fetch checkpoint count from the contract
  const checkpoints = useMemo(() => {
    if (!milestones || milestones.length === 0) return []

    // Map first 4 milestones to checkpoints
    return milestones.slice(0, 4).map((milestone, index) => ({
      index,
      title: milestone.title,
      description: milestone.description,
    }))
  }, [milestones])

  if (checkpoints.length === 0) {
    return (
      <div className="text-center py-12">
        <Vote className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Checkpoints Scheduled</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Checkpoints will be created for milestone verification. Stakers will be able to vote on
          campaign progress at each checkpoint.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">Governance Checkpoints</h4>
          <p className="text-xs text-muted-foreground">
            Vote on campaign progress at key milestones. Your voting power is determined by your
            stake amount. A quorum must be reached for checkpoints to pass.
          </p>
        </div>
      </div>

      {/* Checkpoint Cards */}
      <div className="space-y-4">
        {checkpoints.map((checkpoint) => (
          <CheckpointVoteCard
            key={checkpoint.index}
            campaignId={campaignId}
            checkpointIndex={checkpoint.index}
            title={checkpoint.title}
            description={checkpoint.description}
            chainId={chainId}
          />
        ))}
      </div>
    </div>
  )
}

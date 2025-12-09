'use client'

import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useCampaign, CheckpointStatus } from '@/hooks/useCampaign'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp, ThumbsDown, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatUnits } from 'viem'

interface VoteButtonsProps {
  campaignId: `0x${string}` | undefined
  checkpointIndex: number
}

const statusColors: Record<CheckpointStatus, string> = {
  [CheckpointStatus.Pending]: 'bg-gray-500',
  [CheckpointStatus.VotingActive]: 'bg-blue-500',
  [CheckpointStatus.Approved]: 'bg-green-500',
  [CheckpointStatus.Rejected]: 'bg-red-500',
}

const statusLabels: Record<CheckpointStatus, string> = {
  [CheckpointStatus.Pending]: 'Pending',
  [CheckpointStatus.VotingActive]: 'Voting Active',
  [CheckpointStatus.Approved]: 'Approved',
  [CheckpointStatus.Rejected]: 'Rejected',
}

export function VoteButtons({ campaignId, checkpointIndex }: VoteButtonsProps) {
  const { address } = useAccount()
  const {
    useGetCheckpoint,
    useGetStakeWeight,
    useHasVoted,
    voteOnCheckpoint,
    isVotePending,
    isVoteConfirming,
    isVoteConfirmed,
  } = useCampaign()

  const { data: checkpoint } = useGetCheckpoint(campaignId!, checkpointIndex)
  const { data: stakeWeight } = useGetStakeWeight(campaignId, address)
  const { data: hasVoted } = useHasVoted(campaignId!, checkpointIndex, address)

  const isLoading = isVotePending || isVoteConfirming

  useEffect(() => {
    if (isVoteConfirmed) {
      toast.success('Vote submitted successfully!')
    }
  }, [isVoteConfirmed])

  if (!campaignId || !checkpoint) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-32" />
      </Card>
    )
  }

  const checkpointData = checkpoint as {
    targetAmount: bigint
    description: string
    status: number
    votingStart: bigint
    votingEnd: bigint
    approvalVotes: bigint
    rejectionVotes: bigint
  }

  const status = checkpointData.status as CheckpointStatus
  const totalVotes = checkpointData.approvalVotes + checkpointData.rejectionVotes
  const approvalPercent =
    totalVotes > 0n ? Number((checkpointData.approvalVotes * 100n) / totalVotes) : 0

  const votingStart = new Date(Number(checkpointData.votingStart) * 1000)
  const votingEnd = new Date(Number(checkpointData.votingEnd) * 1000)
  const now = new Date()
  const isVotingPeriod = now >= votingStart && now <= votingEnd
  const hasStake = stakeWeight && (stakeWeight as bigint) > 0n
  const canVote =
    status === CheckpointStatus.VotingActive && isVotingPeriod && hasStake && !hasVoted

  const handleVote = (approve: boolean) => {
    voteOnCheckpoint(campaignId, checkpointIndex, approve)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Checkpoint {checkpointIndex + 1}</CardTitle>
          <Badge className={`${statusColors[status]} text-white`}>{statusLabels[status]}</Badge>
        </div>
        <CardDescription className="line-clamp-2">{checkpointData.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-sm">
          <span className="text-muted-foreground">Target: </span>
          <span className="font-medium">${formatUnits(checkpointData.targetAmount, 6)}</span>
        </div>

        {status !== CheckpointStatus.Pending && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <ThumbsUp className="h-3 w-3" />
                {formatUnits(checkpointData.approvalVotes, 6)}
              </span>
              <span className="flex items-center gap-1 text-red-600">
                {formatUnits(checkpointData.rejectionVotes, 6)}
                <ThumbsDown className="h-3 w-3" />
              </span>
            </div>
            <div className="relative h-2 bg-red-200 rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-green-500 transition-all"
                style={{ width: `${approvalPercent}%` }}
              />
            </div>
          </div>
        )}

        {status === CheckpointStatus.VotingActive && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Voting ends: {votingEnd.toLocaleString()}
          </div>
        )}

        {hasVoted ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            You have already voted
          </div>
        ) : !hasStake ? (
          <div className="text-sm text-muted-foreground">
            Stake tokens to vote on this checkpoint
          </div>
        ) : canVote ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-green-500 hover:bg-green-500/10 text-green-600"
              onClick={() => handleVote(true)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ThumbsUp className="mr-2 h-4 w-4" />
              )}
              Approve
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-500 hover:bg-red-500/10 text-red-600"
              onClick={() => handleVote(false)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ThumbsDown className="mr-2 h-4 w-4" />
              )}
              Reject
            </Button>
          </div>
        ) : status === CheckpointStatus.Approved ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Checkpoint approved
          </div>
        ) : status === CheckpointStatus.Rejected ? (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <XCircle className="h-4 w-4" />
            Checkpoint rejected
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Voting has not started yet</div>
        )}

        {hasStake ? (
          <div className="text-xs text-muted-foreground">
            Your voting power: {formatUnits(stakeWeight as bigint, 6)}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

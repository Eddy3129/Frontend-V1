'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useCheckpointVoting } from '@/hooks/useCheckpointVoting'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ThumbsUp, ThumbsDown, CheckCircle2, XCircle, Clock, Vote } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface CheckpointVoteCardProps {
  campaignId: `0x${string}`
  checkpointIndex: number
  title: string
  description?: string
  chainId?: number
}

const CHECKPOINT_STATUS = {
  0: { label: 'Pending', color: 'bg-muted text-muted-foreground', icon: Clock },
  1: { label: 'Active', color: 'bg-blue-500 text-white', icon: Vote },
  2: { label: 'Passed', color: 'bg-emerald-500 text-white', icon: CheckCircle2 },
  3: { label: 'Failed', color: 'bg-red-500 text-white', icon: XCircle },
}

export function CheckpointVoteCard({
  campaignId,
  checkpointIndex,
  title,
  description,
  chainId,
}: CheckpointVoteCardProps) {
  const { address } = useAccount()
  const [votesFor, setVotesFor] = useState(0n)
  const [votesAgainst, setVotesAgainst] = useState(0n)
  const [hasVoted, setHasVoted] = useState(false)
  const [userVote, setUserVote] = useState<boolean | null>(null)

  const {
    checkpoint,
    isCheckpointLoading,
    useGetUserVotingPower,
    voteOnCheckpoint,
    isVotePending,
    isVoteConfirming,
    isVoteConfirmed,
    voteError,
    calculateQuorumStatus,
    isVotingActive,
    timeRemaining,
  } = useCheckpointVoting(campaignId, checkpointIndex, chainId)

  const {
    votingPower,
    votingPowerPercent,
    isLoading: isPowerLoading,
  } = useGetUserVotingPower(address)

  // Handle vote confirmation
  useEffect(() => {
    if (isVoteConfirmed) {
      toast.success('Vote cast successfully!', { id: 'vote' })
      setHasVoted(true)
    }
  }, [isVoteConfirmed])

  useEffect(() => {
    if (voteError) {
      toast.error('Failed to cast vote', { id: 'vote' })
      console.error('Vote error:', voteError)
    }
  }, [voteError])

  const handleVote = (support: boolean) => {
    if (!address) {
      toast.error('Connect your wallet to vote', { id: 'vote' })
      return
    }

    if (votingPower === 0n) {
      toast.error('You need to stake to vote', { id: 'vote' })
      return
    }

    if (!isVotingActive) {
      toast.error('Voting is not active for this checkpoint', { id: 'vote' })
      return
    }

    try {
      toast.loading('Submitting vote...', { id: 'vote' })
      setUserVote(support)
      voteOnCheckpoint(support)
    } catch (error) {
      console.error('Vote submission error:', error)
      toast.error('Failed to submit vote', { id: 'vote' })
    }
  }

  if (isCheckpointLoading || !checkpoint) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const statusInfo =
    CHECKPOINT_STATUS[checkpoint.status as keyof typeof CHECKPOINT_STATUS] || CHECKPOINT_STATUS[0]
  const StatusIcon = statusInfo.icon

  const quorum = calculateQuorumStatus(votesFor)
  const totalVotes = votesFor + votesAgainst
  const votesForPercent = totalVotes > 0n ? (Number(votesFor) / Number(totalVotes)) * 100 : 0

  // Format deadline
  const deadlineDate = new Date(Number(checkpoint.windowEnd) * 1000)
  const isExpired = Date.now() > deadlineDate.getTime()
  const timeLeft = isExpired ? 'Ended' : formatDistanceToNow(deadlineDate, { addSuffix: true })

  return (
    <Card
      className={`border-2 transition-all ${
        isVotingActive ? 'border-blue-200 dark:border-blue-800 shadow-lg' : 'border-border'
      }`}
    >
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{title}</h4>
              <Badge className={statusInfo.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>

        {/* Voting Stats */}
        {isVotingActive && (
          <div className="space-y-3">
            {/* Deadline */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {isExpired ? 'Voting ended' : `Ends ${timeLeft}`}
              </span>
            </div>

            {/* Quorum Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Quorum Progress</span>
                <span className={quorum.reached ? 'text-emerald-600' : 'text-muted-foreground'}>
                  {quorum.percentOfQuorum.toFixed(1)}%{quorum.reached && ' ✓'}
                </span>
              </div>
              <Progress
                value={Math.min(quorum.percentOfQuorum, 100)}
                className="h-2"
                indicatorClassName={
                  quorum.reached ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-400 to-blue-600'
                }
              />
            </div>

            {/* Vote Distribution */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-1">
                  <ThumbsUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-muted-foreground">For</span>
                </div>
                <p className="text-lg font-bold text-emerald-600">{votesForPercent.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-1">
                  <ThumbsDown className="h-4 w-4 text-red-600" />
                  <span className="text-xs text-muted-foreground">Against</span>
                </div>
                <p className="text-lg font-bold text-red-600">
                  {(100 - votesForPercent).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Your Voting Power */}
        {address && votingPower > 0n && isVotingActive && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Your Voting Power</p>
            <p className="text-sm font-semibold text-primary">{votingPowerPercent.toFixed(2)}%</p>
          </div>
        )}

        {/* Vote Buttons or Status */}
        {isVotingActive && !isExpired && (
          <div className="space-y-2">
            {hasVoted || userVote !== null ? (
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                <p className="text-sm font-medium">You voted {userVote ? 'FOR' : 'AGAINST'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleVote(true)}
                  disabled={isVotePending || isVoteConfirming || votingPower === 0n}
                  variant="outline"
                  className="gap-2 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Vote For
                </Button>
                <Button
                  onClick={() => handleVote(false)}
                  disabled={isVotePending || isVoteConfirming || votingPower === 0n}
                  variant="outline"
                  className="gap-2 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-900/20"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Vote Against
                </Button>
              </div>
            )}
            {votingPower === 0n && (
              <p className="text-xs text-center text-muted-foreground">
                Stake to participate in voting
              </p>
            )}
          </div>
        )}

        {/* Final Results (for completed checkpoints) */}
        {!isVotingActive && checkpoint.status >= 2 && (
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <p className="text-sm font-medium mb-2">Final Result</p>
            <div className="flex justify-center gap-4">
              <div className="text-emerald-600">
                <ThumbsUp className="h-5 w-5 mx-auto mb-1" />
                <p className="text-xs">{votesForPercent.toFixed(1)}% For</p>
              </div>
              <div className="text-red-600">
                <ThumbsDown className="h-5 w-5 mx-auto mb-1" />
                <p className="text-xs">{(100 - votesForPercent).toFixed(1)}% Against</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

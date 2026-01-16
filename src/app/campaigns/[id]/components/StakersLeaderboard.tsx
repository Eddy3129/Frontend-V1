'use client'

import { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useStakers } from '@/hooks/useStakers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, ExternalLink, Crown, Medal, Award } from 'lucide-react'
import Link from 'next/link'
import { baseSepolia } from '@/config/chains'

interface StakersLeaderboardProps {
  campaignId: `0x${string}`
  maxStakers?: number
  showViewAll?: boolean
  chainId?: number
}

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function StakersLeaderboard({
  campaignId,
  maxStakers = 5,
  showViewAll = true,
  chainId,
}: StakersLeaderboardProps) {
  const { address: userAddress } = useAccount()
  const { topStakers, totalStakers, getUserRank, isLoading, error, totalStaked } = useStakers(
    campaignId,
    chainId
  )

  const displayStakers = useMemo(() => {
    return topStakers.slice(0, maxStakers)
  }, [topStakers, maxStakers])

  const userRank = getUserRank(userAddress)

  // Get block explorer URL
  const explorerUrl = useMemo(() => {
    const chain = chainId === baseSepolia.id ? baseSepolia : baseSepolia // Default to baseSepolia
    return chain.blockExplorers?.default.url || 'https://sepolia.basescan.org'
  }, [chainId])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">Failed to load stakers</div>
    )
  }

  if (displayStakers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No stakers yet</p>
        <p className="text-xs mt-1">Be the first to stake!</p>
      </div>
    )
  }

  const getRankIcon = (rank?: number) => {
    if (!rank) return null
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-3">
      {/* Total Stakers Count */}
      {totalStakers > 0 && (
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Total Stakers: {totalStakers}</span>
          {userRank && (
            <Badge variant="outline" className="text-xs">
              You're #{userRank}
            </Badge>
          )}
        </div>
      )}

      {/* Staker List */}
      {displayStakers.map((staker, index) => {
        const isCurrentUser =
          userAddress && staker.address.toLowerCase() === userAddress.toLowerCase()

        return (
          <div
            key={staker.address}
            className={`flex items-center gap-3 text-sm group transition-all ${
              isCurrentUser
                ? 'p-3 bg-primary/5 border border-primary/20 rounded-lg'
                : 'p-2 hover:bg-muted/30 rounded-lg'
            }`}
          >
            {/* Rank & Avatar */}
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCurrentUser
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {staker.rank && staker.rank <= 3 ? (
                  getRankIcon(staker.rank)
                ) : (
                  <span>#{staker.rank}</span>
                )}
              </div>
            </div>

            {/* Address & Percentage */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                  {truncateAddress(staker.address)}
                </p>
                {isCurrentUser && (
                  <Badge variant="secondary" className="text-xs">
                    You
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {staker.votingPowerPercent.toFixed(2)}% voting power
              </p>
            </div>

            {/* View on Explorer */}
            <Link
              href={`${explorerUrl}/address/${staker.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </Link>
          </div>
        )
      })}

      {/* View All Link */}
      {showViewAll && totalStakers > maxStakers && (
        <Link
          href={`${explorerUrl}/address/${campaignId}#events`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm text-primary hover:underline pt-2"
        >
          View all {totalStakers} stakers on explorer →
        </Link>
      )}
    </div>
  )
}

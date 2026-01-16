import { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useStakers } from '@/hooks/useStakers'
import { Badge } from '@/components/ui/badge'
import { Users, ExternalLink, Crown, Medal, Award, Wallet, PiggyBank } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { baseSepolia, ethereumSepolia } from '@/config/chains'
import { Button } from '@/components/ui/button'
import { CampaignStatus } from '@/hooks/useCampaign'
import { formatUnits } from 'viem'
import { ConnectButton } from '@/components/wallet/ConnectButton'

interface StakersLeaderboardProps {
  campaignId: `0x${string}`
  maxStakers?: number
  showViewAll?: boolean
  chainId?: number
  status: CampaignStatus
  onStake: () => void
}

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function StakersLeaderboard({
  campaignId,
  maxStakers = 5,
  showViewAll = true,
  chainId,
  status,
  onStake,
}: StakersLeaderboardProps) {
  const { address: userAddress } = useAccount()
  const { topStakers, totalStakers, getUserRank, stakers, isLoading, error, decimals, symbol } =
    useStakers(campaignId, chainId)

  const displayStakers = useMemo(() => {
    return topStakers.slice(0, maxStakers)
  }, [topStakers, maxStakers])

  const userStaker = useMemo(() => {
    if (!userAddress) return null
    return stakers.find((s) => s.address.toLowerCase() === userAddress.toLowerCase())
  }, [stakers, userAddress])

  const userRank = getUserRank(userAddress)

  // Get block explorer URL
  const explorerUrl = useMemo(() => {
    const chain = chainId === ethereumSepolia.id ? ethereumSepolia : baseSepolia
    return chain.blockExplorers?.default.url || 'https://sepolia.etherscan.io'
  }, [chainId])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-muted animate-pulse rounded-xl" />
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
    <div className="space-y-6">
      {/* Current User Stake Action */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <PiggyBank className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Active Stake
              </p>
              <h3 className="text-xl font-bold text-foreground">
                {userStaker ? userStaker.amountFormatted : '0.00'}
              </h3>
            </div>
          </div>
        </div>

        {userAddress ? (
          <Button
            onClick={onStake}
            className="w-full h-11 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            disabled={status !== CampaignStatus.Active && status !== CampaignStatus.Approved}
          >
            <Wallet className="h-4 w-4 mr-2" />
            {userStaker && userStaker.shares > 0n ? 'Modify' : 'Stake'}
          </Button>
        ) : (
          <ConnectButton className="w-full" label="Connect Wallet" />
        )}
      </div>

      <div className="space-y-3">
        {/* Total Stakers Count */}
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Leaderboard
          </h4>
          <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
            {totalStakers} total
          </span>
        </div>

        {/* Staker List */}
        {displayStakers.length > 0 ? (
          <div className="space-y-2">
            {displayStakers.map((staker) => {
              const isCurrentUser =
                userAddress && staker.address.toLowerCase() === userAddress.toLowerCase()

              return (
                <div
                  key={staker.address}
                  className={`flex items-center gap-3 text-sm group transition-all ${
                    isCurrentUser
                      ? 'p-2 bg-primary/10 rounded-xl border border-primary/20'
                      : 'p-2 hover:bg-muted/30 rounded-xl'
                  }`}
                >
                  {/* Rank & Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {staker.rank && staker.rank <= 3 ? (
                      getRankIcon(staker.rank)
                    ) : (
                      <span>#{staker.rank}</span>
                    )}
                  </div>

                  {/* Address & Percentage */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                        {truncateAddress(staker.address)}
                        {isCurrentUser && ' (You)'}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {staker.amountFormatted}
                    </p>
                  </div>

                  {/* View on Explorer */}
                  <Link
                    href={`${explorerUrl}/address/${staker.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded-md"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Be the first to stake!</p>
          </div>
        )}

        {/* View All Link */}
        {showViewAll && totalStakers > maxStakers && (
          <Link
            href={`${explorerUrl}/address/${campaignId}#events`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs text-primary hover:underline font-medium"
          >
            View all {totalStakers} stakers on explorer →
          </Link>
        )}
      </div>
    </div>
  )
}

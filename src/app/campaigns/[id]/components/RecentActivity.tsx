'use client'

import { useMemo } from 'react'
import { useCampaignActivity } from '@/hooks/useCampaignActivity'
import { useStakers } from '@/hooks/useStakers'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { baseSepolia, ethereumSepolia } from '@/config/chains'
import { formatDistanceToNow } from 'date-fns'
import {
  History,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react'
import { formatUnits } from 'viem'

interface RecentActivityProps {
  campaignId: `0x${string}`
  vaultAddress?: string
  chainId?: number
}

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function RecentActivity({ campaignId, vaultAddress, chainId }: RecentActivityProps) {
  const { data: activities, isLoading: isActivityLoading } = useCampaignActivity(
    campaignId,
    vaultAddress
  )
  const { decimals, symbol } = useStakers(campaignId, chainId)

  const explorerUrl = useMemo(() => {
    const chain = chainId === ethereumSepolia.id ? ethereumSepolia : baseSepolia
    return chain.blockExplorers?.default.url || 'https://sepolia.etherscan.io'
  }, [chainId])

  if (isActivityLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/10 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <History className="h-4 w-4" />
          Recent Activity
        </h4>
      </div>

      <div className="bg-muted/10 border border-border/50 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
        {activities && activities.length > 0 ? (
          <div className="divide-y divide-border/30 max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent flex-1">
            {activities.map((activity) => (
              <div key={activity.id} className="p-3 hover:bg-muted/20 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm',
                        activity.type === 'DEPOSIT' && 'bg-emerald-500/10 text-emerald-600',
                        activity.type === 'WITHDRAW' && 'bg-red-500/10 text-red-600',
                        activity.type === 'VOTE' && 'bg-blue-500/10 text-blue-600'
                      )}
                    >
                      {activity.type === 'DEPOSIT' && <ArrowDownCircle className="h-4 w-4" />}
                      {activity.type === 'WITHDRAW' && <ArrowUpCircle className="h-4 w-4" />}
                      {activity.type === 'VOTE' &&
                        (activity.support ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        ))}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-foreground capitalize">
                          {activity.type.toLowerCase()}
                        </span>
                        {activity.amount && (
                          <span className="text-[11px] font-black text-primary">
                            {Number(formatUnits(BigInt(activity.amount), decimals || 18)).toFixed(
                              symbol === 'ETH' ? 4 : 2
                            )}{' '}
                            {symbol || ''} {activity.type === 'VOTE' ? 'Power' : ''}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">by</span>
                        <span className="text-[10px] font-bold text-foreground">
                          {truncateAddress(activity.supporterId)}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(parseInt(activity.blockTimestamp) * 1000, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`${explorerUrl}/tx/${activity.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-muted/5">
            <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No recent activity found</p>
          </div>
        )}
      </div>
    </div>
  )
}

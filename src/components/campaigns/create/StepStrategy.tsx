'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { type CampaignFormData } from '@/types/campaign'
import { useAaveAPY, formatAPY, formatTVL } from '@/hooks/useAaveAPY'
import { cn } from '@/lib/utils'
import { Wallet, Target, TrendingUp, AlertCircle, Check, ExternalLink } from 'lucide-react'
import { isAddress } from 'viem'
import {
  UsdcCircleColorful,
  EthereumCircleColorful,
  BaseCircleColorful,
} from '@ant-design/web3-icons'

// Token icon component mapping
const TokenIcon = ({ asset }: { asset: string }) => {
  switch (asset) {
    case 'USDC':
      return <UsdcCircleColorful style={{ fontSize: 48 }} />
    case 'WETH':
      return <EthereumCircleColorful style={{ fontSize: 48 }} />
    default:
      return <span className="text-3xl">💰</span>
  }
}

// Network icon component mapping
const NetworkIcon = ({ network }: { network: string }) => {
  switch (network) {
    case 'base-sepolia':
      return <BaseCircleColorful style={{ fontSize: 16 }} />
    case 'eth-sepolia':
      return <EthereumCircleColorful style={{ fontSize: 16 }} />
    default:
      return null
  }
}

// Skeleton card for loading state
const StrategySkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="p-3">
      <div className="flex flex-col items-center mb-3">
        <div className="w-12 h-12 rounded-full bg-muted" />
        <div className="h-4 w-12 bg-muted rounded mt-2" />
        <div className="h-3 w-16 bg-muted rounded mt-1" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-14 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-8 bg-muted rounded" />
          <div className="h-3 w-12 bg-muted rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-8 bg-muted rounded" />
          <div className="h-3 w-14 bg-muted rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-8 bg-muted rounded" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>
    </CardContent>
  </Card>
)

interface StepStrategyProps {
  formData: CampaignFormData
  updateFormData: (updates: Partial<CampaignFormData>) => void
}

export function StepStrategy({ formData, updateFormData }: StepStrategyProps) {
  const { strategies, isLoading } = useAaveAPY()

  const toggleStrategy = (strategyId: string) => {
    // Single select: always replace the array with just the new ID
    updateFormData({ selectedStrategies: [strategyId] })
  }

  const isValidAddress = formData.beneficiaryAddress
    ? isAddress(formData.beneficiaryAddress)
    : false

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-500'
      case 'medium':
        return 'text-yellow-500'
      case 'high':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Beneficiary Address */}
      <div className="space-y-2">
        <Label htmlFor="beneficiary" className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Beneficiary Wallet Address <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          EVM-compatible address that will receive yield from donations
        </p>
        <div className="relative">
          <Input
            id="beneficiary"
            placeholder="0x..."
            value={formData.beneficiaryAddress}
            onChange={(e) =>
              updateFormData({ beneficiaryAddress: e.target.value as `0x${string}` | '' })
            }
            className={cn(
              'font-mono pr-10',
              formData.beneficiaryAddress &&
                (isValidAddress ? 'border-green-500/50' : 'border-red-500/50')
            )}
          />
          {formData.beneficiaryAddress && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValidAddress ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Yield Strategies */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Yield Strategies <span className="text-red-500">*</span>
        </Label>

        {/* 4-column grid for strategy cards */}
        <div className="grid grid-cols-4 gap-3">
          {isLoading ? (
            // Skeleton loading
            <>
              <StrategySkeleton />
              <StrategySkeleton />
              <StrategySkeleton />
              <StrategySkeleton />
            </>
          ) : (
            strategies.map((strategy) => {
              const isSelected = formData.selectedStrategies.includes(strategy.id)
              return (
                <Card
                  key={strategy.id}
                  onClick={() => toggleStrategy(strategy.id)}
                  className={cn(
                    'cursor-pointer transition-all duration-200 overflow-hidden',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'hover:scale-[1.02] hover:shadow-md hover:border-primary/50'
                  )}
                >
                  <CardContent className="p-3">
                    {/* Token Logo + Name centered at top */}
                    <div className="flex flex-col items-center mb-3">
                      <TokenIcon asset={strategy.asset} />
                      <p className="font-semibold text-sm mt-1">{strategy.asset}</p>
                      <p className="text-[10px] text-muted-foreground">{strategy.protocol}</p>
                    </div>

                    {/* 4 rows of info */}
                    <div className="space-y-1.5 text-xs">
                      {/* Network */}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Network</span>
                        <div className="flex items-center gap-1">
                          <NetworkIcon network={strategy.network} />
                          <span>{strategy.networkLabel}</span>
                        </div>
                      </div>

                      {/* Risk */}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Risk</span>
                        <span className={cn('font-medium capitalize', getRiskColor(strategy.risk))}>
                          {strategy.risk}
                        </span>
                      </div>

                      {/* APY */}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">APY</span>
                        <span className="font-bold text-green-500">{formatAPY(strategy.apy)}</span>
                      </div>

                      {/* TVL */}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">TVL</span>
                        <span className="font-medium">{formatTVL(strategy.tvl)}</span>
                      </div>
                    </div>

                    {/* View Vault link - minimal height */}
                    {strategy.vaultUrl && (
                      <a
                        href={strategy.vaultUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-primary mt-1.5 pt-1.5 border-t border-dashed leading-none"
                      >
                        View vault <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {!isLoading && formData.selectedStrategies.length === 0 && (
          <p className="text-xs text-yellow-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Select at least one yield strategy
          </p>
        )}
      </div>

      {/* Target TVL & Min Stake - Side by Side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="targetTVL" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Target TVL <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              $
            </span>
            <Input
              id="targetTVL"
              type="number"
              placeholder="10,000"
              value={formData.targetTVL}
              onChange={(e) => updateFormData({ targetTVL: e.target.value })}
              className="pl-7"
              min={0}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minStake">Min Stake (optional)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              $
            </span>
            <Input
              id="minStake"
              type="number"
              placeholder="100"
              value={formData.minStake || ''}
              onChange={(e) => updateFormData({ minStake: e.target.value })}
              className="pl-7"
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Estimated Yield Preview */}
      {formData.targetTVL && formData.selectedStrategies.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Est. Annual Yield</span>
              <span className="text-xl font-bold text-gradient-give">
                $
                {(
                  (parseFloat(formData.targetTVL) *
                    (strategies
                      .filter((s) => formData.selectedStrategies.includes(s.id))
                      .reduce((acc, s) => acc + (s.apy || 0), 0) /
                      formData.selectedStrategies.length)) /
                  100
                ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on current APY. Actual yields may vary.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { Separator } from '@/components/ui/separator'
import { PieChart, TrendingUp, Activity } from 'lucide-react'
import { UsdcCircleColorful, EthereumCircleColorful } from '@ant-design/web3-icons'
import { formatAPY } from '@/hooks/useAaveAPY'

interface AssetComposition {
  usdc: number
  usdcPercent: number
  eth: number
  ethPercent: number
}

interface AnalyticsTabProps {
  assetComposition: AssetComposition
  apy: number
  dailyYieldGeneration: number
  raisedUsd: number
  progressDisplay: number
  goal: number
  isEthStrategy: boolean
  vaultTotalAssetsNum: number
}

export function AnalyticsTab({
  assetComposition,
  apy,
  dailyYieldGeneration,
  raisedUsd,
  progressDisplay,
  goal,
  isEthStrategy,
  vaultTotalAssetsNum,
}: AnalyticsTabProps) {
  return (
    <div className="space-y-4">
      {/* Asset Composition */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <PieChart className="h-4 w-4" />
          Asset Composition
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <UsdcCircleColorful style={{ fontSize: 24 }} />
              <span className="font-medium">USDC</span>
            </div>
            <div className="text-right">
              <p className="font-bold">${assetComposition.usdc.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{assetComposition.usdcPercent}%</p>
            </div>
          </div>
          {assetComposition.eth > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <EthereumCircleColorful style={{ fontSize: 24 }} />
                <span className="font-medium">ETH</span>
              </div>
              <div className="text-right">
                <p className="font-bold">${assetComposition.eth.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{assetComposition.ethPercent}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Yield Stats */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Yield Statistics
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Current APY</span>
            <span className="font-bold text-emerald-600">{formatAPY(apy)}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Daily Yield</span>
            <span className="font-bold">${dailyYieldGeneration.toFixed(2)}/day</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Est. Monthly Yield</span>
            <span className="font-bold">${(dailyYieldGeneration * 30).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Campaign Stats */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Campaign Stats
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Total Value Locked (USD)</span>
            <span className="font-bold">
              ${raisedUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          {isEthStrategy && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Vault Assets</span>
              <span className="font-bold">
                {vaultTotalAssetsNum.toLocaleString(undefined, {
                  maximumFractionDigits: 6,
                })}{' '}
                ETH
              </span>
            </div>
          )}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Funding Progress</span>
            <span className="font-bold text-teal-600">{progressDisplay.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Target TVL</span>
            <span className="font-bold">${goal.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

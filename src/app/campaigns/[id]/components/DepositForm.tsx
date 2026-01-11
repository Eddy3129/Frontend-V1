import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { UsdcCircleColorful, EthereumCircleColorful } from '@ant-design/web3-icons'
import { cn } from '@/lib/utils'
import { formatAPY } from '@/hooks/useAaveAPY'

interface DepositFormProps {
  selectedAsset: 'USDC' | 'ETH'
  stakeAmount: string
  setStakeAmount: (amount: string) => void
  yieldAllocation: number
  setYieldAllocation: (allocation: number) => void
  displayBalance: number
  address?: string
  handleSetMax: () => void
  handleDeposit: () => void
  isActionLoading: boolean
  ethDepositsEnabled: boolean
  depositAmount: number
  apy: number
  toCampaign: number
  toUser: number
  totalReturn: number
  userVaultBalance: number
  myDailyYield: number
}

export function DepositForm({
  selectedAsset,
  stakeAmount,
  setStakeAmount,
  yieldAllocation,
  setYieldAllocation,
  displayBalance,
  address,
  handleSetMax,
  handleDeposit,
  isActionLoading,
  ethDepositsEnabled,
  depositAmount,
  apy,
  toCampaign,
  toUser,
  totalReturn,
  userVaultBalance,
  myDailyYield,
}: DepositFormProps) {
  return (
    <div className="space-y-4">
      {/* Asset Selection with Icons Only - Restricted based on strategy */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Asset</p>
        <div className="grid grid-cols-1 gap-3">
          {/* Only show the allowed asset */}
          <button
            className={cn(
              'flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all cursor-default border-primary bg-primary/5'
            )}
            disabled
          >
            {selectedAsset === 'USDC' ? (
              <UsdcCircleColorful style={{ fontSize: 28 }} />
            ) : (
              <EthereumCircleColorful style={{ fontSize: 28 }} />
            )}
            <span className="font-medium">{selectedAsset}</span>
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Amount</span>
          <span className="text-muted-foreground">
            Balance: {displayBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
          </span>
        </div>
        <div className="relative">
          <Input
            type="number"
            placeholder="0.00"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            className="pr-20 text-lg h-12"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-primary"
              onClick={handleSetMax}
              disabled={!address}
            >
              MAX
            </Button>
          </div>
        </div>
      </div>

      {/* Yield Allocation */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Yield Allocation to Campaign</p>
        <div className="grid grid-cols-3 gap-2">
          {[50, 75, 100].map((percent) => (
            <button
              key={percent}
              onClick={() => setYieldAllocation(percent)}
              className={cn(
                'py-2.5 rounded-lg border-2 text-sm font-semibold transition-all',
                yieldAllocation === percent
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              )}
            >
              {percent}%
            </button>
          ))}
        </div>
      </div>

      {/* Yield Estimation */}
      {depositAmount > 0 && (
        <div className="p-4 rounded-xl bg-muted/50 space-y-3">
          <h4 className="font-semibold text-sm">Yield Estimation (Annual)</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deposit</span>
              <span className="font-medium flex items-center gap-1">
                {depositAmount.toFixed(2)}
                {selectedAsset === 'USDC' ? (
                  <UsdcCircleColorful style={{ fontSize: 16 }} />
                ) : (
                  <EthereumCircleColorful style={{ fontSize: 16 }} />
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">APY</span>
              <span className="font-medium text-emerald-600">{formatAPY(apy)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-primary">
              <span>To Campaign ({yieldAllocation}%)</span>
              <span className="font-medium flex items-center gap-1">
                {toCampaign.toFixed(4)}
                {selectedAsset === 'USDC' ? (
                  <UsdcCircleColorful style={{ fontSize: 16 }} />
                ) : (
                  <EthereumCircleColorful style={{ fontSize: 16 }} />
                )}
              </span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>To You ({100 - yieldAllocation}%)</span>
              <span className="font-medium flex items-center gap-1">
                {toUser.toFixed(4)}
                {selectedAsset === 'USDC' ? (
                  <UsdcCircleColorful style={{ fontSize: 16 }} />
                ) : (
                  <EthereumCircleColorful style={{ fontSize: 16 }} />
                )}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>You Get Back</span>
              <span className="flex items-center gap-1">
                {totalReturn.toFixed(4)}
                {selectedAsset === 'USDC' ? (
                  <UsdcCircleColorful style={{ fontSize: 16 }} />
                ) : (
                  <EthereumCircleColorful style={{ fontSize: 16 }} />
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Your Balance Projections */}
      {userVaultBalance > 0 && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
          <h4 className="font-semibold text-sm">Your Balance ({selectedAsset})</h4>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Balance</span>
            <span className="font-semibold">
              {userVaultBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
              {selectedAsset}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Est. Daily Yield</span>
            <span className="font-semibold">
              {myDailyYield.toFixed(8)} {selectedAsset}
            </span>
          </div>
        </div>
      )}

      <Button
        className="w-full h-12 text-base font-semibold"
        disabled={
          !stakeAmount ||
          parseFloat(stakeAmount) <= 0 ||
          isActionLoading ||
          (selectedAsset === 'ETH' && !ethDepositsEnabled)
        }
        onClick={handleDeposit}
      >
        {isActionLoading ? 'Processing...' : 'Deposit Now'}
      </Button>
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { type Address } from 'viem'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsdcCircleColorful, EthereumCircleColorful } from '@ant-design/web3-icons'
import { Wallet, ArrowDownCircle, ArrowUpCircle, Info, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAPY } from '@/hooks/useAaveAPY'

interface StakeModalProps {
  isOpen: boolean
  onClose: () => void
  selectedAsset: 'USDC' | 'ETH'
  displayBalance: number // User's wallet balance
  userVaultBalance: number // User's already staked balance
  apy: number
  isActionLoading: boolean
  handleDeposit: (amount: string) => void
  handleWithdraw: (amount: string) => void
  isEthStrategy: boolean
}

export function StakeModal({
  isOpen,
  onClose,
  selectedAsset,
  displayBalance,
  userVaultBalance,
  apy,
  isActionLoading,
  handleDeposit,
  handleWithdraw,
  isEthStrategy,
}: StakeModalProps) {
  const [mode, setMode] = useState<'increase' | 'withdraw'>('increase')
  const [amount, setAmount] = useState('')
  const [yieldAllocation, setYieldAllocation] = useState(75)

  const amountNum = parseFloat(amount) || 0
  const maxAmount = mode === 'increase' ? displayBalance : userVaultBalance

  const handleSetMax = () => {
    if (maxAmount > 0) {
      setAmount(maxAmount.toString())
    }
  }

  // Yield projections for increase
  const annualYield = (amountNum * apy) / 100
  const toCampaign = (annualYield * yieldAllocation) / 100
  const toUser = annualYield - toCampaign
  const totalReturn = amountNum + toUser

  const handleSubmit = () => {
    if (mode === 'increase') {
      handleDeposit(amount)
    } else {
      handleWithdraw(amount)
    }
  }

  const assetIcon =
    selectedAsset === 'USDC' ? (
      <UsdcCircleColorful style={{ fontSize: 20 }} />
    ) : (
      <EthereumCircleColorful style={{ fontSize: 20 }} />
    )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-primary/5 p-6 pb-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Wallet className="h-5 w-5 text-primary" />
              Manage Stake
            </DialogTitle>
            <DialogDescription>Confirm your transaction details below</DialogDescription>
          </DialogHeader>

          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v as any)
              setAmount('')
            }}
            className="mt-4"
          >
            <TabsList className="grid w-full grid-cols-2 bg-background/50 p-1 rounded-xl">
              <TabsTrigger
                value="increase"
                className="rounded-lg gap-2 data-[state=active]:bg-background"
              >
                <ArrowUpCircle className="h-4 w-4" />
                Increase
              </TabsTrigger>
              <TabsTrigger
                value="withdraw"
                className="rounded-lg gap-2 data-[state=active]:bg-background text-destructive data-[state=active]:text-destructive"
              >
                <ArrowDownCircle className="h-4 w-4" />
                Withdraw
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-5 space-y-5">
          {/* Strategy Info & APY */}
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-[0.15em]">
              {isEthStrategy ? 'Ethereum' : 'USDC'} Aave Strategy
            </span>
            <div className="flex items-center gap-1.5 bg-emerald-500/5 text-emerald-600 px-2 py-1 rounded-full border border-emerald-500/20 shadow-sm">
              <TrendingUp className="h-3 w-3" />
              <span className="text-[10px] font-black tracking-tight">{apy.toFixed(2)}% APY</span>
            </div>
          </div>

          {/* Amount Input Section */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-end px-1">
              <label className="text-xs font-black text-foreground/40 uppercase tracking-widest">
                Amount
              </label>
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <span className="text-muted-foreground/60 uppercase tracking-tighter">
                  {mode === 'increase' ? 'Available' : 'Staked'}:
                </span>
                <span
                  className={cn(
                    'tracking-tight',
                    amountNum > maxAmount ? 'text-destructive' : 'text-primary/80'
                  )}
                >
                  {maxAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })}{' '}
                  {selectedAsset}
                </span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <div className="relative flex-1 group">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={cn(
                    'pr-16 text-lg h-12 bg-muted/20 border-border/50 focus-visible:ring-primary/10 rounded-xl font-bold transition-all',
                    amountNum > maxAmount &&
                      'border-destructive/30 focus-visible:ring-destructive/10'
                  )}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 text-[10px] font-black text-primary/60 hover:text-primary hover:bg-transparent"
                  onClick={handleSetMax}
                >
                  MAX
                </Button>
              </div>

              {/* Asset Display - Compact & Cohesive */}
              <div className="flex items-center gap-2 px-4 h-12 bg-muted/30 border border-border/30 rounded-xl shrink-0 min-w-[90px] justify-center">
                {assetIcon}
                <span className="font-bold text-xs text-foreground/80 tracking-tight">
                  {selectedAsset}
                </span>
              </div>
            </div>

            {/* Excess Balance Warning */}
            {amountNum > maxAmount && (
              <p className="text-[10px] text-destructive font-bold flex items-center gap-1.5 px-1 animate-in fade-in slide-in-from-left-2 transition-all">
                <Info className="h-3 w-3" />
                Insufficient {mode === 'increase' ? 'balance' : 'staked amount'}
              </p>
            )}
          </div>

          {mode === 'increase' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Yield Allocation */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 group">
                    <p className="text-xs font-black text-foreground/40 uppercase tracking-widest">
                      Yield to NGO
                    </p>
                    <div className="relative group/tooltip">
                      <Info className="h-3 w-3 text-muted-foreground/50 cursor-help hover:text-primary transition-colors" />
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-popover text-popover-foreground text-[10px] rounded-xl shadow-2xl border border-border opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none font-medium leading-relaxed">
                        <p className="font-black text-[11px] mb-1 uppercase tracking-tight text-primary">
                          How it works
                        </p>
                        Your principal stays yours. The percentage you choose determines how much of
                        the generated yield goes to the NGO.
                        <div className="absolute top-full left-4 border-8 border-transparent border-t-popover" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[50, 75, 100].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => setYieldAllocation(percent)}
                      className={cn(
                        'py-2 rounded-xl border transition-all text-[11px] font-bold',
                        yieldAllocation === percent
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-border/50 hover:border-primary/30 bg-muted/10 text-muted-foreground'
                      )}
                    >
                      {percent}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Box - More integrated */}
              {amountNum > 0 && amountNum <= maxAmount && (
                <div className="p-3.5 rounded-xl bg-primary/[0.02] border border-primary/10 space-y-2.5">
                  <div className="space-y-1.5 text-[10px] font-bold">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground/70 uppercase tracking-tight">
                        NGO Earnings
                      </span>
                      <span className="text-primary tracking-tight">
                        +{toCampaign.toFixed(4)} {selectedAsset}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground/70 uppercase tracking-tight">
                        Your Earnings
                      </span>
                      <span className="text-emerald-600 tracking-tight">
                        +{toUser.toFixed(4)} {selectedAsset}
                      </span>
                    </div>
                    <Separator className="bg-primary/5 my-1" />
                    <div className="flex justify-between items-center text-xs pt-0.5">
                      <span className="font-black text-foreground/40 uppercase tracking-wider">
                        Total Return
                      </span>
                      <span className="font-black text-foreground tracking-tight">
                        {totalReturn.toFixed(4)} {selectedAsset}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'withdraw' && amountNum > 0 && (
            <div className="p-3.5 rounded-xl bg-destructive/[0.02] border border-destructive/10 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3 text-destructive/80">
                <Info className="h-4 w-4 shrink-0" />
                <p className="text-[10px] font-bold leading-relaxed tracking-tight">
                  Withdrawing will reduce your active stake and voting power. Funds return to your
                  wallet immediately.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-1">
            <Button
              className={cn(
                'w-full h-12 text-sm font-black uppercase tracking-[0.1em] rounded-xl shadow-lg transition-all active:scale-[0.98]',
                mode === 'withdraw'
                  ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/10'
                  : 'bg-primary hover:bg-primary/90 shadow-primary/10 text-primary-foreground'
              )}
              disabled={!amount || amountNum <= 0 || amountNum > maxAmount || isActionLoading}
              onClick={handleSubmit}
            >
              {isActionLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : mode === 'increase' ? (
                'Confirm Deposit'
              ) : (
                'Confirm Withdrawal'
              )}
            </Button>

            <p className="text-[9px] text-center text-muted-foreground/60 px-6 font-medium leading-relaxed tracking-tight">
              By staking, you agree to protocol rules. Transactions might take a moment to confirm.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useConnection } from 'wagmi'
import { useVault } from '@/hooks/useVault'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  Wallet,
  Coins,
  PiggyBank,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'

export function VaultInteraction() {
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const { isConnected } = useConnection()

  const {
    formattedUserUsdc,
    formattedUserShares,
    formattedAllowance,
    formattedTotalAssets,
    hasAllowance,
    approve,
    approveMax,
    deposit,
    withdraw,
    isApprovePending,
    isApproveConfirming,
    isDepositPending,
    isDepositConfirming,
    isWithdrawPending,
    isWithdrawConfirming,
    isApproveConfirmed,
    isDepositConfirmed,
    isWithdrawConfirmed,
  } = useVault()

  // Handle approval
  const handleApprove = () => {
    if (!depositAmount) {
      toast.error('Enter an amount first')
      return
    }
    approve(depositAmount)
  }

  // Handle deposit
  const handleDeposit = () => {
    if (!depositAmount) {
      toast.error('Enter an amount to deposit')
      return
    }
    if (!hasAllowance(depositAmount)) {
      toast.error('Please approve first')
      return
    }
    deposit(depositAmount)
  }

  // Handle withdraw
  const handleWithdraw = () => {
    if (!withdrawAmount) {
      toast.error('Enter an amount to withdraw')
      return
    }
    withdraw(withdrawAmount)
  }

  // Show success toasts
  useEffect(() => {
    if (isApproveConfirmed) {
      toast.success('Approval successful!')
    }
  }, [isApproveConfirmed])

  useEffect(() => {
    if (isDepositConfirmed) {
      toast.success('Deposit successful!')
      setDepositAmount('')
    }
  }, [isDepositConfirmed])

  useEffect(() => {
    if (isWithdrawConfirmed) {
      toast.success('Withdrawal successful!')
      setWithdrawAmount('')
    }
  }, [isWithdrawConfirmed])

  const isApproveLoading = isApprovePending || isApproveConfirming
  const isDepositLoading = isDepositPending || isDepositConfirming
  const isWithdrawLoading = isWithdrawPending || isWithdrawConfirming

  if (!isConnected) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            Give Vault
          </CardTitle>
          <CardDescription>Connect your wallet to interact with the vault</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="h-8 w-8 rounded-lg gradient-give flex items-center justify-center">
            <PiggyBank className="h-4 w-4 text-white" />
          </div>
          Give Vault
        </CardTitle>
        <CardDescription>Deposit USDC to earn yield for NGOs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Your USDC</span>
            </div>
            <p className="text-lg font-bold">{formattedUserUsdc}</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Coins className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Your Shares</span>
            </div>
            <p className="text-lg font-bold">{formattedUserShares}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-linear-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Total Vault Assets</span>
          </div>
          <p className="text-xl font-bold text-gradient-give">{formattedTotalAssets} USDC</p>
        </div>

        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" className="gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              Withdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount" className="text-sm font-medium">
                Amount (USDC)
              </Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="h-12 text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Current Allowance: <span className="font-medium">{formattedAllowance} USDC</span>
              </p>
            </div>

            <div className="flex gap-2">
              {!hasAllowance(depositAmount || '0') ? (
                <>
                  <Button
                    onClick={handleApprove}
                    disabled={isApproveLoading || !depositAmount}
                    className="flex-1 h-11 gradient-give text-white"
                  >
                    {isApproveLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={approveMax}
                    disabled={isApproveLoading}
                    className="h-11"
                  >
                    Max
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleDeposit}
                  disabled={isDepositLoading || !depositAmount}
                  className="w-full h-11 gradient-give text-white glow-give"
                >
                  {isDepositLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Deposit
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount" className="text-sm font-medium">
                Amount (USDC)
              </Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="h-12 text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Available: <span className="font-medium">{formattedUserShares} shares</span>
              </p>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={isWithdrawLoading || !withdrawAmount}
              className="w-full h-11"
              variant="outline"
            >
              {isWithdrawLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Withdraw
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

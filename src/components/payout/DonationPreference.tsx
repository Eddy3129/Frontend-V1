'use client'

import { useState, useEffect } from 'react'
import { useConnection } from 'wagmi'
import { usePayout, VALID_ALLOCATIONS, type AllocationPercent } from '@/hooks/usePayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, Heart, Check, X, User } from 'lucide-react'
import { toast } from 'sonner'
import { type Address } from 'viem'

export function DonationPreference() {
  const [beneficiary, setBeneficiary] = useState('')
  const [allocation, setAllocation] = useState<AllocationPercent>(100)
  const { isConnected } = useConnection()

  const {
    useGetUserPreference,
    setVaultPreference,
    clearPreference,
    protocolFeePercent,
    isSetPreferencePending,
    isSetPreferenceConfirming,
    isSetPreferenceConfirmed,
    isClearPreferencePending,
    isClearPreferenceConfirming,
    isClearPreferenceConfirmed,
  } = usePayout()

  const { data: currentPreference } = useGetUserPreference()

  const isSetLoading = isSetPreferencePending || isSetPreferenceConfirming
  const isClearLoading = isClearPreferencePending || isClearPreferenceConfirming

  useEffect(() => {
    if (isSetPreferenceConfirmed) {
      toast.success('Donation preference updated!')
    }
  }, [isSetPreferenceConfirmed])

  useEffect(() => {
    if (isClearPreferenceConfirmed) {
      toast.success('Donation preference cleared!')
    }
  }, [isClearPreferenceConfirmed])

  const handleSetPreference = () => {
    if (!beneficiary) {
      toast.error('Enter a beneficiary address')
      return
    }
    if (!beneficiary.startsWith('0x') || beneficiary.length !== 42) {
      toast.error('Invalid address format')
      return
    }
    setVaultPreference(beneficiary as Address, allocation)
  }

  const handleClearPreference = () => {
    clearPreference()
  }

  if (!isConnected) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Donation Preference
          </CardTitle>
          <CardDescription>Connect your wallet to set donation preferences</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const preference = currentPreference as
    | {
        beneficiary: Address
        allocationPercent: number
        isActive: boolean
      }
    | undefined

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="h-8 w-8 rounded-lg gradient-give flex items-center justify-center">
            <Heart className="h-4 w-4 text-white" />
          </div>
          Donation Preference
        </CardTitle>
        <CardDescription>
          Choose where your yield goes • Protocol fee: {protocolFeePercent}%
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Preference */}
        {preference?.isActive && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Active Preference</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="truncate font-mono">{preference.beneficiary}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{preference.allocationPercent}%</span>{' '}
              of yield → NGO
            </p>
          </div>
        )}

        {/* Beneficiary Input */}
        <div className="space-y-2">
          <Label htmlFor="beneficiary" className="text-sm font-medium">
            Beneficiary Address (NGO)
          </Label>
          <Input
            id="beneficiary"
            placeholder="0x..."
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            className="h-11 font-mono text-sm"
          />
        </div>

        {/* Allocation Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Yield Allocation</Label>
          <div className="grid grid-cols-4 gap-2">
            {VALID_ALLOCATIONS.map((pct) => (
              <Button
                key={pct}
                variant={allocation === pct ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAllocation(pct)}
                className={allocation === pct ? 'gradient-give text-white border-0' : ''}
              >
                {pct}%
              </Button>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground p-3 rounded-lg bg-muted">
            <span>
              NGO receives: <span className="font-medium text-primary">{allocation}%</span>
            </span>
            <span>
              You keep: <span className="font-medium">{100 - allocation}%</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSetPreference}
            disabled={isSetLoading || !beneficiary}
            className="flex-1 h-11 gradient-give text-white glow-give"
          >
            {isSetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {preference?.isActive ? 'Update Preference' : 'Set Preference'}
          </Button>
          {preference?.isActive && (
            <Button
              variant="outline"
              onClick={handleClearPreference}
              disabled={isClearLoading}
              className="h-11"
            >
              {isClearLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

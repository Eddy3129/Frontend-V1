'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { parseUnits, formatEther } from 'viem'

import {
  type CampaignFormData,
  type CampaignIPFSMetadata,
  FORM_STEPS,
  initialFormData,
} from '@/types/campaign'
import { useCampaign } from '@/hooks/useCampaign'
import { STRATEGY_IDS } from '@/config/contracts'

// Form step components
import { StepBasicInfo } from '@/components/campaigns/create/StepBasicInfo'
import { StepOrganization } from '@/components/campaigns/create/StepOrganization'
import { StepStrategy } from '@/components/campaigns/create/StepStrategy'
import { StepMilestones } from '@/components/campaigns/create/StepMilestones'
import { StepImages } from '@/components/campaigns/create/StepImages'
import { StepReview } from '@/components/campaigns/create/StepReview'

export function CreateCampaignClient() {
  const router = useRouter()
  const { isConnected, address } = useAccount()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [metadataCID, setMetadataCID] = useState<string | null>(null)
  const [submitStep, setSubmitStep] = useState<'idle' | 'uploading' | 'submitting' | 'confirming'>(
    'idle'
  )

  const {
    submitCampaign,
    isSubmitPending,
    isSubmitConfirming,
    isSubmitConfirmed,
    submitError,
    submitHash,
    submitReceipt,
    minDeposit,
  } = useCampaign()

  // Handle transaction confirmation
  useEffect(() => {
    if (isSubmitConfirmed && submitHash && submitReceipt) {
      if (submitReceipt.status === 'reverted') {
        toast.error('Transaction reverted on-chain. Please check your inputs.', { id: 'submit' })
        setSubmitStep('idle')
        setIsSubmitting(false)
        return
      }

      toast.success('Campaign submitted on-chain successfully!', { id: 'submit' })
      setSubmitStep('idle')
      setIsSubmitting(false)
      // Redirect to campaigns page
      setTimeout(() => {
        router.push('/campaigns')
      }, 2000)
    }
  }, [isSubmitConfirmed, submitHash, submitReceipt, router])

  // Handle transaction error
  useEffect(() => {
    if (submitError) {
      console.error('Submit error:', submitError)
      toast.error(submitError.message || 'Failed to submit campaign on-chain', { id: 'submit' })
      setSubmitStep('idle')
      setIsSubmitting(false)
    }
  }, [submitError])

  // Update form data
  const updateFormData = useCallback((updates: Partial<CampaignFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  // Validate current step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.description && formData.purpose && formData.category)
      case 2:
        return !!(formData.selectedNgoAddress && formData.personInCharge)
      case 3:
        return !!(
          formData.beneficiaryAddress &&
          formData.selectedStrategies.length > 0 &&
          formData.targetTVL
        )
      case 4:
        return formData.milestones.length >= 1
      case 5:
        return true // Images are optional
      case 6:
        return !!(formData.startDate && formData.endDate)
      default:
        return true
    }
  }

  // Navigate between steps
  const goToStep = (step: number) => {
    if (step < currentStep || validateStep(currentStep)) {
      setCurrentStep(step)
    } else {
      toast.error('Please complete all required fields before proceeding')
    }
  }

  const nextStep = () => {
    if (currentStep < FORM_STEPS.length) {
      goToStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1)
    }
  }

  // Submit to Pinata
  const submitToPinata = async (): Promise<string | null> => {
    const metadata: CampaignIPFSMetadata = {
      name: formData.title,
      description: formData.description,
      ngoName: formData.organizationName,
      category: formData.category,
      currency: formData.selectedStrategies[0]?.includes('weth') ? 'ETH' : 'USDC', // derive currency
      images: [
        ...(formData.organizationLogo ? [formData.organizationLogo] : []),
        ...formData.additionalImages.filter(Boolean),
      ],
      coverImage: formData.coverImage || undefined,
      personInCharge: formData.personInCharge,
      contact: {
        email: formData.contactEmail,
        phone: formData.contactPhone,
        telegram: formData.contactTelegram,
      },
      email: formData.email,
      beneficiaryAddress: formData.beneficiaryAddress as string,
      targetTVL: formData.targetTVL,
      selectedStrategies: formData.selectedStrategies,
      milestones: formData.milestones.map((m) => ({
        title: m.title,
        description: m.description,
        targetAmount: `${m.targetPercentage}%`,
        deliverables: m.deliverables,
        startDate: m.startDate?.toISOString(),
        endDate: m.endDate?.toISOString(),
      })),
      socialLinks: {
        website: formData.website,
        ...formData.socialLinks,
      },
      startDate: formData.startDate?.toISOString() || '',
      endDate: formData.endDate?.toISOString() || '',
      createdAt: new Date().toISOString(),
      version: '1.0.0',
    }

    try {
      const response = await fetch('/api/upload/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload metadata')
      }

      const result = await response.json()
      return result.cid
    } catch (error) {
      console.error('Pinata upload error:', error)
      throw error
    }
  }

  // Handle final submission
  const handleSubmit = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!validateStep(6)) {
      toast.error('Please complete all required fields')
      return
    }

    if (!formData.beneficiaryAddress) {
      toast.error('Beneficiary address is required')
      return
    }

    // Ensure minDeposit is loaded
    if (minDeposit === undefined) {
      toast.error('Unable to fetch minimum deposit amount. Please check your connection.')
      return
    }

    setIsSubmitting(true)
    setSubmitStep('uploading')

    try {
      // Step 1: Upload metadata to IPFS
      toast.loading('Uploading campaign metadata to IPFS...', { id: 'submit' })
      const cid = await submitToPinata()

      if (!cid) {
        throw new Error('Failed to get metadata CID')
      }

      setMetadataCID(cid)
      toast.loading('Metadata uploaded! Submitting campaign on-chain...', { id: 'submit' })
      setSubmitStep('submitting')

      // Step 2: Submit campaign on-chain
      // Use start/end dates from form (which are derived from milestones in StepReview)
      const now = Math.floor(Date.now() / 1000)

      // Ensure we have valid dates
      if (!formData.startDate || !formData.endDate) {
        throw new Error('Campaign timeline is missing. Please review the timeline step.')
      }

      let startTimestamp = Math.floor(formData.startDate.getTime() / 1000)
      const endTimestamp = Math.floor(formData.endDate.getTime() / 1000)

      // If start date is in the past (e.g. selected "today" which defaults to 00:00),
      // set it to now + small buffer (5 mins) to avoid "start time in past" errors
      if (startTimestamp < now) {
        startTimestamp = now + 300 // 5 minutes buffer
      }

      // Validate timeline
      if (startTimestamp >= endTimestamp) {
        throw new Error('End date must be after start date (and current time)')
      }

      const fundraisingStart = BigInt(startTimestamp)
      const fundraisingEnd = BigInt(endTimestamp)

      const selectedStrategy = formData.selectedStrategies[0]
      let strategyId: `0x${string}`
      let decimals = 6 // Default to 6 for USDC

      if (selectedStrategy.includes('usdc')) {
        strategyId = STRATEGY_IDS.AAVE_USDC
        decimals = 6
      } else if (selectedStrategy.includes('weth')) {
        strategyId = STRATEGY_IDS.AAVE_ETH
        decimals = 18
      } else {
        console.warn('Unknown strategy selected, defaulting to USDC', selectedStrategy)
        strategyId = STRATEGY_IDS.AAVE_USDC
        decimals = 6
      }

      if (formData.selectedStrategies.length === 0) {
        throw new Error('Please select a yield strategy')
      }

      if (formData.targetTVL === '0') {
        throw new Error('Target TVL must be greater than 0')
      }

      console.log('Submitting campaign with params:', {
        payoutRecipient: formData.beneficiaryAddress,
        strategyId,
        metadataCID: cid,
        targetStake: parseUnits(formData.targetTVL || '1000', decimals), // Log computed values
        minStake: parseUnits(formData.minStake || '10', decimals),
        fundraisingStart,
        fundraisingEnd,
        deposit: minDeposit,
      })

      // Convert targetTVL/minStake using correct decimals
      const targetStake = parseUnits(formData.targetTVL || '1000', decimals)
      const minStakeAmount = parseUnits(formData.minStake || '10', decimals)

      await submitCampaign({
        payoutRecipient: formData.beneficiaryAddress as `0x${string}`,
        strategyId,
        metadataCID: cid,
        targetStake,
        minStake: minStakeAmount,
        fundraisingStart,
        fundraisingEnd,
      })

      setSubmitStep('confirming')
      toast.loading('Waiting for transaction confirmation...', { id: 'submit' })
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit campaign', {
        id: 'submit',
      })
      setSubmitStep('idle')
      setIsSubmitting(false)
    }
  }

  // Progress percentage
  const progressPercent = (currentStep / FORM_STEPS.length) * 100

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBasicInfo formData={formData} updateFormData={updateFormData} />
      case 2:
        return <StepOrganization formData={formData} updateFormData={updateFormData} />
      case 3:
        return <StepStrategy formData={formData} updateFormData={updateFormData} />
      case 4:
        return <StepMilestones formData={formData} updateFormData={updateFormData} />
      case 5:
        return <StepImages formData={formData} updateFormData={updateFormData} />
      case 6:
        return <StepReview formData={formData} updateFormData={updateFormData} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/campaigns">
          <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Create Campaign</h1>
          <p className="text-muted-foreground">Set up a new fundraising campaign</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-4">
        <Progress value={progressPercent} className="h-2" />

        {/* Step Indicators */}
        <div className="flex justify-between">
          {FORM_STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => goToStep(step.id)}
              className={`flex flex-col items-center gap-1.5 transition-all ${
                step.id === currentStep
                  ? 'scale-105'
                  : step.id < currentStep
                    ? 'opacity-70'
                    : 'opacity-40'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all ${
                  step.id < currentStep
                    ? 'bg-green-500/20 text-green-500'
                    : step.id === currentStep
                      ? 'gradient-give text-white glow-give'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.id < currentStep ? <Check className="h-4 w-4" /> : step.icon}
              </div>
              <p
                className={`text-xs font-medium hidden sm:block ${
                  step.id === currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <Card className="card-elevated">
        <CardContent className="p-5">{renderStep()}</CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-4">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="gap-2 h-9"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {currentStep < FORM_STEPS.length ? (
          <Button
            onClick={nextStep}
            disabled={!validateStep(currentStep)}
            className="btn-brand gap-2 h-9"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isSubmitPending || isSubmitConfirming || !isConnected}
            className="btn-brand gap-2 h-9"
          >
            {isSubmitting || isSubmitPending || isSubmitConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {submitStep === 'uploading' && 'Uploading...'}
                {submitStep === 'submitting' && 'Submitting...'}
                {submitStep === 'confirming' && 'Confirming...'}
                {submitStep === 'idle' && 'Processing...'}
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Submit Campaign
                {minDeposit && ` (${formatEther(minDeposit)} ETH)`}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Wallet Connection Warning */}
      {!isConnected && (
        <p className="text-center text-xs text-yellow-500 mt-3">⚠️ Connect wallet to submit</p>
      )}

      {/* Deposit Info */}
      {isConnected && currentStep === FORM_STEPS.length && minDeposit && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          💰 Submission requires a deposit of {formatEther(minDeposit)} ETH (refundable upon
          campaign approval)
        </p>
      )}

      {/* Transaction Hash */}
      {submitHash && (
        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <p className="text-xs text-blue-500">
            📝 Transaction:{' '}
            <a
              href={`https://sepolia.basescan.org/tx/${submitHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-400"
            >
              {submitHash.slice(0, 10)}...{submitHash.slice(-8)}
            </a>
          </p>
        </div>
      )}

      {/* Success Message with CID */}
      {metadataCID && (
        <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <p className="text-xs text-green-500">
            ✅ CID: <code className="bg-muted px-1.5 py-0.5 rounded">{metadataCID}</code>
          </p>
        </div>
      )}
    </div>
  )
}

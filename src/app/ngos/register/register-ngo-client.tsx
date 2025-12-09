'use client'

import { useState, useCallback, useEffect } from 'react'
import { useConnection, useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { isAddress } from 'viem'

import {
  type NGOFormData,
  type NGOIPFSMetadata,
  NGO_FORM_STEPS,
  initialNGOFormData,
} from '@/types/ngo'

// Form step components
import {
  StepBasicInfo,
  StepContact,
  StepRegistration,
  StepDocuments,
  StepReview,
} from '@/components/ngos/register'

export function RegisterNGOClient() {
  const router = useRouter()
  const { isConnected } = useConnection()
  const { address } = useAccount()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<NGOFormData>(initialNGOFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [metadataCID, setMetadataCID] = useState<string | null>(null)

  // Update wallet address when connected
  useEffect(() => {
    if (address && !formData.walletAddress) {
      setFormData((prev) => ({ ...prev, walletAddress: address }))
    }
  }, [address, formData.walletAddress])

  // Update form data
  const updateFormData = useCallback((updates: Partial<NGOFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  // Validate current step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.mission && formData.description && formData.category)
      case 2:
        return !!(formData.email && formData.email.includes('@'))
      case 3:
        return !!(
          formData.registrationNumber &&
          formData.country &&
          formData.city &&
          formData.address
        )
      case 4:
        return true // Documents are optional (will be verified by admin)
      case 5:
        return true // Review step
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
    if (currentStep < NGO_FORM_STEPS.length) {
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
    const walletAddr = formData.walletAddress || address

    if (!walletAddr || !isAddress(walletAddr)) {
      throw new Error('Valid wallet address is required')
    }

    const metadata: NGOIPFSMetadata = {
      name: formData.name,
      description: formData.description,
      mission: formData.mission,
      category: formData.category,
      contact: {
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
      },
      socialLinks: formData.socialLinks,
      organization: {
        registrationNumber: formData.registrationNumber,
        country: formData.country,
        city: formData.city,
        address: formData.address,
        foundedYear: formData.foundedYear,
      },
      documents: {
        logo: formData.logo || undefined,
        registrationDocument: formData.registrationDocument || undefined,
        taxDocument: formData.taxDocument || undefined,
        additionalDocuments: formData.additionalDocuments,
      },
      walletAddress: walletAddr,
      createdAt: new Date().toISOString(),
      version: '1.0.0',
    }

    try {
      const response = await fetch('/api/upload/ngo', {
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

    setIsSubmitting(true)

    try {
      // Upload metadata to IPFS
      toast.loading('Uploading NGO application to IPFS...', { id: 'upload' })
      const cid = await submitToPinata()

      if (!cid) {
        throw new Error('Failed to get metadata CID')
      }

      setMetadataCID(cid)
      toast.loading('Registering application for review...', { id: 'upload' })

      // Submit to pending applications API for admin review
      const walletAddr = formData.walletAddress || address
      const appResponse = await fetch('/api/ngo/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadataCID: cid,
          walletAddress: walletAddr,
          ngoName: formData.name,
        }),
      })

      if (!appResponse.ok) {
        console.warn('Failed to register application for review, but IPFS upload succeeded')
      }

      toast.success('Application submitted successfully!', { id: 'upload' })

      // Show success message - admin will verify and add to registry
      toast.success(
        'NGO application submitted! A protocol administrator will review and verify your organization.',
        { duration: 6000 }
      )

      // Redirect to NGOs page after short delay
      setTimeout(() => {
        router.push('/ngos')
      }, 2000)
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit application', {
        id: 'upload',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Progress percentage
  const progressPercent = (currentStep / NGO_FORM_STEPS.length) * 100

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBasicInfo formData={formData} updateFormData={updateFormData} />
      case 2:
        return <StepContact formData={formData} updateFormData={updateFormData} />
      case 3:
        return <StepRegistration formData={formData} updateFormData={updateFormData} />
      case 4:
        return <StepDocuments formData={formData} updateFormData={updateFormData} />
      case 5:
        return <StepReview formData={formData} updateFormData={updateFormData} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/ngos">
          <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Register Your NGO</h1>
          <p className="text-muted-foreground">Apply to join the Give Protocol network</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-4">
        <Progress value={progressPercent} className="h-2" />

        {/* Step Indicators */}
        <div className="flex justify-between">
          {NGO_FORM_STEPS.map((step) => (
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

        {currentStep < NGO_FORM_STEPS.length ? (
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
            disabled={isSubmitting || !isConnected}
            className="btn-brand gap-2 h-9"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Submit Application
              </>
            )}
          </Button>
        )}
      </div>

      {/* Wallet Connection Warning */}
      {!isConnected && (
        <p className="text-center text-xs text-yellow-500 mt-3">⚠️ Connect wallet to submit</p>
      )}

      {/* Success Message with CID */}
      {metadataCID && (
        <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <p className="text-xs text-green-500">
            ✅ Application CID:{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded">{metadataCID}</code>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Share this CID with the protocol admin for faster verification.
          </p>
        </div>
      )}
    </div>
  )
}

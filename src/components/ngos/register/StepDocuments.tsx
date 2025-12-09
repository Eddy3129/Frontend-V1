'use client'

import { useState, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { type NGOFormData } from '@/types/ngo'
import { cn } from '@/lib/utils'
import { getGatewayUrl } from '@/lib/pinata'
import {
  FileUp,
  Image as ImageIcon,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface StepDocumentsProps {
  formData: NGOFormData
  updateFormData: (updates: Partial<NGOFormData>) => void
}

interface DocumentUploadProps {
  value: string | null
  onChange: (cid: string | null) => void
  label: string
  description: string
  accept: string
  required?: boolean
  icon?: React.ReactNode
}

function DocumentUpload({
  value,
  onChange,
  label,
  description,
  accept,
  required,
  icon,
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      onChange(result.cid)
      toast.success(`${label} uploaded successfully!`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload')
    } finally {
      setIsUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      <Label className={cn(required && 'required', 'flex items-center gap-2')}>
        {icon}
        {label}
      </Label>
      <Card
        className={cn(
          'relative cursor-pointer transition-all hover:border-primary/50',
          value ? 'border-green-500/50 bg-green-500/5' : 'border-dashed'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">Uploading...</span>
            </div>
          ) : value ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  Document uploaded
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <FileUp className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">{description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function StepDocuments({ formData, updateFormData }: StepDocumentsProps) {
  const [isLogoUploading, setIsLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo too large. Maximum size is 5MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: JPEG, PNG, SVG, WebP')
      return
    }

    setIsLogoUploading(true)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formDataUpload,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      updateFormData({ logo: result.cid })
      toast.success('Logo uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo')
    } finally {
      setIsLogoUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Documents & Logo
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload verification documents and your organization&apos;s logo
        </p>
      </div>

      {/* Logo Upload */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Organization Logo (Optional)
        </Label>
        <div className="flex items-start gap-4">
          <Card
            className={cn(
              'relative w-24 h-24 cursor-pointer transition-all hover:border-primary/50 overflow-hidden',
              formData.logo ? 'border-green-500/50' : 'border-dashed'
            )}
            onClick={() => logoInputRef.current?.click()}
          >
            <CardContent className="p-0 h-full flex items-center justify-center">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/svg+xml,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleLogoUpload(file)
                }}
                className="hidden"
              />

              {isLogoUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : formData.logo ? (
                <Image
                  src={getGatewayUrl(formData.logo)}
                  alt="Logo"
                  fill
                  className="object-cover"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </CardContent>
          </Card>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Upload your organization&apos;s logo. Square format recommended.
            </p>
            <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, SVG, or WebP. Max 5MB.</p>
            {formData.logo && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-red-500 hover:text-red-600"
                onClick={() => updateFormData({ logo: null })}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Registration Document */}
      <DocumentUpload
        value={formData.registrationDocument}
        onChange={(cid) => updateFormData({ registrationDocument: cid })}
        label="Registration Certificate"
        description="Upload your official nonprofit registration certificate (PDF, JPG, PNG)"
        accept=".pdf,.jpg,.jpeg,.png"
        required
        icon={<FileText className="h-4 w-4" />}
      />

      {/* Tax Document */}
      <DocumentUpload
        value={formData.taxDocument}
        onChange={(cid) => updateFormData({ taxDocument: cid })}
        label="Tax Exemption Document"
        description="Upload proof of tax-exempt status (e.g., IRS determination letter)"
        accept=".pdf,.jpg,.jpeg,.png"
        icon={<FileText className="h-4 w-4" />}
      />

      {/* Info Box */}
      <Card className="bg-amber-500/5 border-amber-500/20">
        <CardContent className="p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-600 dark:text-amber-400">
            <strong>Document Security</strong>
            <p className="mt-1">
              Documents are uploaded to IPFS for verification purposes. Only authorized protocol
              administrators will review these documents. Sensitive information should be redacted
              if possible.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

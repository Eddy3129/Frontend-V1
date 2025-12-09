'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type NGOFormData, NGO_CATEGORIES } from '@/types/ngo'
import { getGatewayUrl } from '@/lib/pinata'
import {
  Building2,
  Mail,
  FileText,
  Wallet,
  CheckCircle2,
  Twitter,
  Linkedin,
  Facebook,
  ExternalLink,
} from 'lucide-react'
import Image from 'next/image'

interface StepReviewProps {
  formData: NGOFormData
  updateFormData: (updates: Partial<NGOFormData>) => void
}

export function StepReview({ formData }: StepReviewProps) {
  const category = NGO_CATEGORIES.find((c) => c.value === formData.category)

  const ReviewItem = ({
    label,
    value,
    href,
  }: {
    label: string
    value?: string | null
    href?: string
  }) => {
    if (!value) return null

    return (
      <div className="flex justify-between items-start text-sm">
        <span className="text-muted-foreground">{label}</span>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1 max-w-[60%] truncate"
          >
            {value}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : (
          <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Review Your Application
        </h2>
        <p className="text-sm text-muted-foreground">
          Please review your information before submitting
        </p>
      </div>

      {/* Logo and Name Header */}
      <Card className="card-highlight">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {formData.logo ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                <Image
                  src={getGatewayUrl(formData.logo)}
                  alt="Logo"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold truncate">{formData.name || 'Organization Name'}</h3>
              {category && (
                <Badge variant="secondary" className="mt-1">
                  {category.icon} {category.label}
                </Badge>
              )}
            </div>
          </div>
          {formData.mission && (
            <p className="mt-3 text-sm text-muted-foreground italic">
              &ldquo;{formData.mission}&rdquo;
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Contact Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ReviewItem label="Email" value={formData.email} href={`mailto:${formData.email}`} />
            <ReviewItem label="Phone" value={formData.phone} />
            <ReviewItem label="Website" value={formData.website} href={formData.website} />
            {(formData.socialLinks.twitter ||
              formData.socialLinks.linkedin ||
              formData.socialLinks.facebook) && (
              <div className="flex gap-2 pt-2">
                {formData.socialLinks.twitter && (
                  <a
                    href={`https://twitter.com/${formData.socialLinks.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                {formData.socialLinks.linkedin && (
                  <a
                    href={`https://linkedin.com/company/${formData.socialLinks.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {formData.socialLinks.facebook && (
                  <a
                    href={`https://facebook.com/${formData.socialLinks.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Registration Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ReviewItem label="Registration #" value={formData.registrationNumber} />
            <ReviewItem label="Country" value={formData.country} />
            <ReviewItem label="City" value={formData.city} />
            <ReviewItem label="Founded" value={formData.foundedYear} />
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Uploaded Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {formData.registrationDocument && (
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-600 border-green-500/30"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Registration Certificate
              </Badge>
            )}
            {formData.taxDocument && (
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-600 border-green-500/30"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Tax Document
              </Badge>
            )}
            {formData.logo && (
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-600 border-green-500/30"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Logo
              </Badge>
            )}
            {!formData.registrationDocument && !formData.taxDocument && !formData.logo && (
              <span className="text-sm text-muted-foreground">No documents uploaded</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Wallet Address */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Wallet Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.walletAddress ? (
            <code className="text-sm bg-muted px-2 py-1 rounded block truncate">
              {formData.walletAddress}
            </code>
          ) : (
            <p className="text-sm text-muted-foreground">Will use your connected wallet address</p>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {formData.description && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {formData.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* What Happens Next */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-2">What happens next?</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Your application will be uploaded to IPFS</li>
            <li>A protocol administrator will review your documents</li>
            <li>Once verified, your NGO will be added to the registry</li>
            <li>You&apos;ll be able to create fundraising campaigns</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

import { useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { type CampaignFormData, CAMPAIGN_CATEGORIES } from '@/types/campaign'
import { useAaveAPY, formatAPY, getStrategyById } from '@/hooks/useAaveAPY'
import { getGatewayUrl } from '@/lib/pinata'
import {
  Calendar,
  Building2,
  Wallet,
  Target,
  TrendingUp,
  Flag,
  AlertCircle,
  CheckCircle2,
  Image,
} from 'lucide-react'

interface StepReviewProps {
  formData: CampaignFormData
  updateFormData: (updates: Partial<CampaignFormData>) => void
}

export function StepReview({ formData, updateFormData }: StepReviewProps) {
  const { strategies } = useAaveAPY()

  const category = CAMPAIGN_CATEGORIES.find((c) => c.value === formData.category)
  const selectedStrategies = formData.selectedStrategies
    .map((id) => getStrategyById(strategies, id))
    .filter(Boolean)

  const totalMilestonePercentage = formData.milestones.reduce(
    (sum, m) => sum + m.targetPercentage,
    0
  )

  // Calculate timeline from milestones
  const sortedMilestones = [...formData.milestones].sort((a, b) => {
    if (!a.startDate || !b.startDate) return 0
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })

  const derivedStartDate = sortedMilestones.length > 0 ? sortedMilestones[0].startDate : null
  const derivedEndDate =
    sortedMilestones.length > 0 ? sortedMilestones[sortedMilestones.length - 1].endDate : null

  // Update form data with derived dates if not set
  useEffect(() => {
    if (derivedStartDate && !formData.startDate) {
      updateFormData({ startDate: derivedStartDate })
    }
    if (derivedEndDate && !formData.endDate) {
      updateFormData({ endDate: derivedEndDate })
    }
  }, [derivedStartDate, derivedEndDate, formData.startDate, formData.endDate, updateFormData])

  // Validation checks
  const checks = [
    { label: 'Title', valid: !!formData.title },
    { label: 'Description (50+ chars)', valid: formData.description.length >= 50 },
    { label: 'Category', valid: !!formData.category },
    { label: 'Organization', valid: !!formData.selectedNgoAddress },
    { label: 'Coordinator', valid: !!formData.personInCharge },
    { label: 'Beneficiary', valid: !!formData.beneficiaryAddress },
    { label: 'Strategy', valid: formData.selectedStrategies.length > 0 },
    { label: 'Target TVL', valid: !!formData.targetTVL && parseFloat(formData.targetTVL) > 0 },
    { label: 'Milestones', valid: formData.milestones.length > 0 },
    { label: 'Milestones = 100%', valid: totalMilestonePercentage === 100 },
    { label: 'Start date', valid: !!formData.startDate },
    { label: 'End date', valid: !!formData.endDate },
    {
      label: 'Timeline valid',
      valid:
        !!formData.startDate &&
        !!formData.endDate &&
        formData.startDate.getTime() < formData.endDate.getTime(),
    },
  ]

  const allValid = checks.every((c) => c.valid)

  return (
    <div className="space-y-5">
      {/* Campaign Timeline */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-sm">
          <Calendar className="h-3.5 w-3.5" />
          Campaign Timeline <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="startDate" className="text-xs text-muted-foreground">
              Start
            </Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate?.toISOString().split('T')[0] || ''}
              onChange={(e) =>
                updateFormData({ startDate: e.target.value ? new Date(e.target.value) : null })
              }
              min={new Date().toISOString().split('T')[0]}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endDate" className="text-xs text-muted-foreground">
              End
            </Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate?.toISOString().split('T')[0] || ''}
              onChange={(e) =>
                updateFormData({ endDate: e.target.value ? new Date(e.target.value) : null })
              }
              min={
                formData.startDate?.toISOString().split('T')[0] ||
                new Date().toISOString().split('T')[0]
              }
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Validation Checklist */}
      <div
        className={`p-3 rounded-lg border ${allValid ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}
      >
        <div className="flex items-center gap-2 mb-2">
          {allValid ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-sm font-medium">Checklist</span>
        </div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-1">
          {checks.map((check) => (
            <div key={check.label} className="flex items-center gap-1.5 text-xs">
              {check.valid ? (
                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
              ) : (
                <AlertCircle className="h-3 w-3 text-yellow-500 shrink-0" />
              )}
              <span className={check.valid ? 'text-muted-foreground' : ''}>{check.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Summary - Compact Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Basic Info */}
        <Card className="col-span-2">
          <CardContent className="p-3">
            <div className="flex gap-3">
              {formData.coverImage && (
                <div className="w-24 h-16 rounded overflow-hidden shrink-0">
                  <img
                    src={getGatewayUrl(formData.coverImage)}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{formData.title || '—'}</h3>
                {category && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {category.icon} {category.label}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {formData.description || 'No description'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Organization</span>
            </div>
            <div className="flex items-start gap-2">
              {formData.organizationLogo && (
                <div className="w-8 h-8 rounded overflow-hidden shrink-0">
                  <img
                    src={getGatewayUrl(formData.organizationLogo)}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="text-xs space-y-0.5 min-w-0">
                <p className="font-medium truncate">{formData.organizationName || '—'}</p>
                <p className="text-muted-foreground truncate">{formData.personInCharge || '—'}</p>
                <p className="text-muted-foreground truncate">{formData.email || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Strategy</span>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1">
                <Wallet className="h-3 w-3 text-muted-foreground" />
                <code className="bg-muted px-1 py-0.5 rounded text-[10px] truncate max-w-[140px]">
                  {formData.beneficiaryAddress || '—'}
                </code>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span>
                  $
                  {parseFloat(formData.targetTVL || '0').toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedStrategies.map((s) => (
                  <Badge key={s?.id} variant="outline" className="text-[10px] py-0">
                    {s?.asset} {formatAPY(s?.apy ?? null)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Milestones</span>
              </div>
              <span
                className={`text-xs font-medium ${totalMilestonePercentage === 100 ? 'text-green-500' : 'text-yellow-500'}`}
              >
                {totalMilestonePercentage}%
              </span>
            </div>
            <div className="space-y-1">
              {formData.milestones.slice(0, 3).map((m, i) => (
                <div key={m.id} className="flex items-center justify-between text-xs">
                  <span className="truncate">
                    {i + 1}. {m.title || `Milestone ${i + 1}`}
                  </span>
                  <span className="text-muted-foreground shrink-0">{m.targetPercentage}%</span>
                </div>
              ))}
              {formData.milestones.length > 3 && (
                <p className="text-[10px] text-muted-foreground">
                  +{formData.milestones.length - 3} more
                </p>
              )}
              {formData.milestones.length === 0 && (
                <p className="text-xs text-yellow-500">No milestones</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Image className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Images</span>
            </div>
            <div className="flex gap-1.5">
              {formData.coverImage && (
                <div className="w-10 h-10 rounded overflow-hidden border">
                  <img
                    src={getGatewayUrl(formData.coverImage)}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {formData.additionalImages.slice(0, 3).map(
                (cid, i) =>
                  cid && (
                    <div key={i} className="w-10 h-10 rounded overflow-hidden border">
                      <img
                        src={getGatewayUrl(cid)}
                        alt={`Image ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )
              )}
              {!formData.coverImage && formData.additionalImages.length === 0 && (
                <p className="text-xs text-muted-foreground">No images</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What's next */}
      <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        <strong>📋 Next:</strong> Metadata uploaded to IPFS → Admin review → Campaign goes live
      </div>
    </div>
  )
}

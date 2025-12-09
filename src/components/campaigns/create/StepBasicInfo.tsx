'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type CampaignFormData, CAMPAIGN_CATEGORIES } from '@/types/campaign'
import { cn } from '@/lib/utils'

interface StepBasicInfoProps {
  formData: CampaignFormData
  updateFormData: (updates: Partial<CampaignFormData>) => void
}

export function StepBasicInfo({ formData, updateFormData }: StepBasicInfoProps) {
  return (
    <div className="space-y-6">
      {/* Campaign Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Campaign Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Clean Water for Rural Communities"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground text-right">{formData.title.length}/100</p>
      </div>

      {/* Purpose */}
      <div className="space-y-2">
        <Label htmlFor="purpose">
          Purpose <span className="text-red-500">*</span>
        </Label>
        <Input
          id="purpose"
          placeholder="e.g., Provide clean drinking water to 500 families"
          value={formData.purpose}
          onChange={(e) => updateFormData({ purpose: e.target.value })}
          maxLength={150}
        />
        <p className="text-xs text-muted-foreground text-right">{formData.purpose.length}/150</p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describe your campaign's mission, goals, and how the funds will be used..."
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={4}
          className="resize-none"
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.description.length}/2000
        </p>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>
          Category <span className="text-red-500">*</span>
        </Label>
        <div className="flex flex-wrap gap-4">
          {CAMPAIGN_CATEGORIES.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => updateFormData({ category: category.value })}
              className={cn(
                'flex items-center gap-4 px-3 py-1.5 rounded-full border transition-all text-sm',
                formData.category === category.value
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-muted hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <span className="text-sm">{category.icon}</span>
              <span
                className={cn(
                  'font-medium',
                  formData.category === category.value ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {category.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

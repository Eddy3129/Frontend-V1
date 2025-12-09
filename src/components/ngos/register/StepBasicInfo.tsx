'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { type NGOFormData, NGO_CATEGORIES } from '@/types/ngo'
import { cn } from '@/lib/utils'
import { Building2, Tags } from 'lucide-react'

interface StepBasicInfoProps {
  formData: NGOFormData
  updateFormData: (updates: Partial<NGOFormData>) => void
}

export function StepBasicInfo({ formData, updateFormData }: StepBasicInfoProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Organization Details
        </h2>
        <p className="text-sm text-muted-foreground">Tell us about your organization</p>
      </div>

      {/* Organization Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="required">
          Organization Name
        </Label>
        <Input
          id="name"
          placeholder="e.g., Clean Water Foundation"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          Official registered name of your organization
        </p>
      </div>

      {/* Mission Statement */}
      <div className="space-y-2">
        <Label htmlFor="mission" className="required">
          Mission Statement
        </Label>
        <Textarea
          id="mission"
          placeholder="Our mission is to..."
          value={formData.mission}
          onChange={(e) => updateFormData({ mission: e.target.value })}
          rows={2}
          maxLength={300}
        />
        <p className="text-xs text-muted-foreground">
          {formData.mission.length}/300 characters - A brief statement of your organization&apos;s
          purpose
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="required">
          Description
        </Label>
        <Textarea
          id="description"
          placeholder="Describe your organization, its history, achievements, and impact..."
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={4}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground">
          {formData.description.length}/2000 characters
        </p>
      </div>

      {/* Category Selection */}
      <div className="space-y-3">
        <Label className="required flex items-center gap-2">
          <Tags className="h-4 w-4" />
          Category
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {NGO_CATEGORIES.map((category) => (
            <Card
              key={category.value}
              className={cn(
                'cursor-pointer transition-all hover:border-primary/50',
                formData.category === category.value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border'
              )}
              onClick={() => updateFormData({ category: category.value })}
            >
              <CardContent className="p-2 text-center">
                <span className="text-xl mb-1 block">{category.icon}</span>
                <p className="text-xs font-medium truncate">{category.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

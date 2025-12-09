'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { type CampaignFormData, type CampaignMilestone } from '@/types/campaign'
import { cn } from '@/lib/utils'
import {
  Plus,
  Trash2,
  AlertCircle,
  GripVertical,
  ChevronRight,
  Calendar,
  Target,
  CheckCircle2,
} from 'lucide-react'

interface StepMilestonesProps {
  formData: CampaignFormData
  updateFormData: (updates: Partial<CampaignFormData>) => void
}

export function StepMilestones({ formData, updateFormData }: StepMilestonesProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const addMilestone = () => {
    const remaining = 100 - totalPercentage
    const defaultPercentage = remaining > 0 ? Math.min(25, remaining) : 25
    const newMilestone: CampaignMilestone = {
      id: `milestone-${Date.now()}`,
      title: '',
      description: '',
      targetPercentage: defaultPercentage,
      deliverables: '',
      startDate: null,
      endDate: null,
    }
    updateFormData({ milestones: [...formData.milestones, newMilestone] })
    setExpandedId(newMilestone.id)
  }

  const updateMilestone = (id: string, updates: Partial<CampaignMilestone>) => {
    updateFormData({
      milestones: formData.milestones.map((m) => {
        if (m.id !== id) return m

        const updated = { ...m, ...updates }

        // Date validation logic
        if (updates.startDate || updates.endDate) {
          if (updated.startDate && updated.endDate && updated.endDate < updated.startDate) {
            // If end date is before start date, reset end date or adjust it
            // Here we'll just ensure end date is at least start date if both are set
            if (updates.endDate) {
              // User changed end date to be invalid -> reset it or warn?
              // Better to just set it to start date or null. Let's set to start date.
              updated.endDate = updated.startDate
            } else if (updates.startDate) {
              // User changed start date to be after end date -> clear end date
              updated.endDate = null
            }
          }
        }

        return updated
      }),
    })
  }

  const removeMilestone = (id: string) => {
    updateFormData({
      milestones: formData.milestones.filter((m) => m.id !== id),
    })
    if (expandedId === id) setExpandedId(null)
  }

  const totalPercentage = formData.milestones.reduce((sum, m) => sum + m.targetPercentage, 0)

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  const formatDateShort = (date: Date | null): string => {
    if (!date) return ''
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isMilestoneComplete = (m: CampaignMilestone) =>
    m.title && m.description && m.targetPercentage > 0

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Total allocation</span>
          <span
            className={cn(
              'font-semibold',
              totalPercentage === 100
                ? 'text-green-500'
                : totalPercentage > 100
                  ? 'text-red-500'
                  : 'text-yellow-500'
            )}
          >
            {totalPercentage}%
          </span>
        </div>
        <Progress
          value={Math.min(totalPercentage, 100)}
          className={cn(
            'h-2',
            totalPercentage === 100
              ? '[&>div]:bg-green-500'
              : totalPercentage > 100
                ? '[&>div]:bg-red-500'
                : '[&>div]:bg-yellow-500'
          )}
        />
        {totalPercentage !== 100 && (
          <p className="text-[10px] text-muted-foreground">
            {totalPercentage < 100
              ? `${100 - totalPercentage}% remaining to allocate`
              : `${totalPercentage - 100}% over allocation`}
          </p>
        )}
      </div>

      {/* Milestones List */}
      <div className="space-y-2">
        {formData.milestones.map((milestone, index) => {
          const isExpanded = expandedId === milestone.id
          const isComplete = isMilestoneComplete(milestone)

          return (
            <div
              key={milestone.id}
              className={cn(
                'rounded-lg border bg-card transition-all',
                isExpanded
                  ? 'ring-1 ring-primary/40 border-primary/40'
                  : 'hover:border-muted-foreground/30'
              )}
            >
              {/* Collapsed Row */}
              <div
                className="flex items-center gap-2 p-2.5 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : milestone.id)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />

                {/* Number Badge */}
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    isComplete ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'
                  )}
                >
                  {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                </div>

                {/* Title & Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium truncate',
                      !milestone.title && 'text-muted-foreground'
                    )}
                  >
                    {milestone.title || `Milestone ${index + 1}`}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {(milestone.startDate || milestone.endDate) && (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 gap-0.5">
                      <Calendar className="h-2.5 w-2.5" />
                      {milestone.startDate ? formatDateShort(milestone.startDate) : '?'}
                      {' - '}
                      {milestone.endDate ? formatDateShort(milestone.endDate) : '?'}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[10px] py-0 px-1.5 font-bold',
                      milestone.targetPercentage > 0 ? 'bg-primary/10 text-primary' : ''
                    )}
                  >
                    {milestone.targetPercentage}%
                  </Badge>
                </div>

                {/* Expand Arrow */}
                <ChevronRight
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform shrink-0',
                    isExpanded && 'rotate-90'
                  )}
                />

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeMilestone(milestone.id)
                  }}
                  className="p-1 text-muted-foreground hover:text-red-500 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-dashed">
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    {/* Title */}
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">
                        Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g., Initial Community Outreach"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(milestone.id, { title: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Description */}
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        placeholder="What will be accomplished in this phase?"
                        value={milestone.description}
                        onChange={(e) =>
                          updateMilestone(milestone.id, { description: e.target.value })
                        }
                        rows={2}
                        className="text-sm resize-none"
                      />
                    </div>

                    {/* Percentage */}
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        <Target className="h-3 w-3" />% of Target TVL{' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={milestone.targetPercentage}
                        onChange={(e) =>
                          updateMilestone(milestone.id, {
                            targetPercentage: Math.min(
                              100,
                              Math.max(1, parseInt(e.target.value) || 1)
                            ),
                          })
                        }
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Dates in one row */}
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Timeline
                      </Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="date"
                          value={formatDateForInput(milestone.startDate)}
                          onChange={(e) =>
                            updateMilestone(milestone.id, {
                              startDate: e.target.value ? new Date(e.target.value) : null,
                            })
                          }
                          className="h-8 text-xs flex-1"
                        />
                        <span className="text-muted-foreground text-xs">→</span>
                        <Input
                          type="date"
                          value={formatDateForInput(milestone.endDate)}
                          onChange={(e) =>
                            updateMilestone(milestone.id, {
                              endDate: e.target.value ? new Date(e.target.value) : null,
                            })
                          }
                          className="h-8 text-xs flex-1"
                        />
                      </div>
                    </div>

                    {/* Deliverables */}
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Success Criteria</Label>
                      <Textarea
                        placeholder="How will completion be verified? (helps stakers vote)"
                        value={milestone.deliverables}
                        onChange={(e) =>
                          updateMilestone(milestone.id, { deliverables: e.target.value })
                        }
                        rows={2}
                        className="text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Milestone Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addMilestone}
        className="w-full h-10 border-dashed hover:border-primary hover:bg-primary/5"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add Milestone
      </Button>

      {formData.milestones.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No milestones yet</p>
          <p className="text-xs">Add milestones to define how funds will be released</p>
        </div>
      )}

      {formData.milestones.length > 0 && totalPercentage !== 100 && (
        <p className="text-xs text-yellow-500 flex items-center gap-1 justify-center">
          <AlertCircle className="h-3 w-3" />
          Milestone percentages must total 100%
        </p>
      )}
    </div>
  )
}

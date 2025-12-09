'use client'

import { useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ImageUpload } from './ImageUpload'
import { type CampaignFormData } from '@/types/campaign'
import { X, Image, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { getGatewayUrl } from '@/lib/pinata'

interface StepImagesProps {
  formData: CampaignFormData
  updateFormData: (updates: Partial<CampaignFormData>) => void
}

export function StepImages({ formData, updateFormData }: StepImagesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleMultipleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const files = Array.from(e.target.files)
    const remainingSlots = 5 - formData.additionalImages.length

    if (files.length > remainingSlots) {
      toast.error(`You can only add ${remainingSlots} more images`)
      return
    }

    setIsUploading(true)
    const newCids: string[] = []

    try {
      for (const file of files) {
        // Validate file size
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`File ${file.name} too large. Max 20MB`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Upload failed')
        const result = await response.json()
        newCids.push(result.cid)
      }

      updateFormData({
        additionalImages: [...formData.additionalImages, ...newCids],
      })
      toast.success(`Uploaded ${newCids.length} images`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload some images')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeAdditionalImage = (index: number) => {
    const newImages = formData.additionalImages.filter((_, i) => i !== index)
    updateFormData({ additionalImages: newImages })
  }

  return (
    <div className="space-y-6">
      {/* Cover Image */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          Cover Image (Thumbnail)
        </Label>
        <p className="text-xs text-muted-foreground">
          Main image shown on campaign cards. Recommended: 1200×630 (16:9)
        </p>
        <ImageUpload
          value={formData.coverImage}
          onChange={(cid) => updateFormData({ coverImage: cid })}
          aspectRatio="wide"
        />
      </div>

      {/* Additional Images */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Additional Images (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Gallery images to showcase your campaign (Max 5)
            </p>
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept="image/*"
              onChange={handleMultipleUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={formData.additionalImages.length >= 5 || isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              Upload Images
            </Button>
          </div>
        </div>

        {formData.additionalImages.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {formData.additionalImages.map((cid, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
              >
                <img
                  src={getGatewayUrl(cid)}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeAdditionalImage(index)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {formData.additionalImages.length === 0 && (
          <div
            className="border border-dashed rounded-lg p-8 text-center text-muted-foreground text-sm cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <Image className="h-8 w-8 text-muted-foreground/50" />
              <p>Click to upload multiple images</p>
            </div>
          </div>
        )}

        {formData.additionalImages.length >= 5 && (
          <p className="text-xs text-muted-foreground">Maximum 5 additional images</p>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getGatewayUrl } from '@/lib/pinata'

interface ImageUploadProps {
  value: string | null
  onChange: (cid: string | null) => void
  label?: string
  description?: string
  aspectRatio?: 'square' | 'wide' | 'cover'
  maxSizeMB?: number
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  label: _label = 'Upload Image',
  description = 'PNG, JPG, GIF, WEBP, less than 20MB',
  aspectRatio = 'square',
  maxSizeMB = 20,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const aspectClasses = {
    square: 'aspect-square',
    wide: 'aspect-video',
    cover: 'aspect-[3/1]',
  }

  const handleFile = async (file: File) => {
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${maxSizeMB}MB`)
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG')
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
      toast.success('Image uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  const imageUrl = value ? getGatewayUrl(value) : null

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative cursor-pointer rounded-xl border-2 border-dashed transition-all overflow-hidden',
          aspectClasses[aspectRatio],
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : value
              ? 'border-transparent'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
          isUploading && 'pointer-events-none opacity-70'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        {imageUrl ? (
          // Image Preview
          <div className="absolute inset-0">
            <img src={imageUrl} alt="Uploaded image" className="w-full h-full object-cover" />
            {/* Remove button */}
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          // Upload Placeholder
          <div className="absolute inset-0 flex flex-col items-center justify-center h-24 w-24 gap-3 p-4">
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <div className="p-2 rounded-full bg-muted">
                  {isDragging ? (
                    <Upload className="h-6 w-6 text-primary" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground text-center leading-tight px-1">
                  {description}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

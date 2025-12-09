'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type NGOFormData } from '@/types/ngo'
import { Mail, Phone, Globe, Twitter, Linkedin, Facebook } from 'lucide-react'

interface StepContactProps {
  formData: NGOFormData
  updateFormData: (updates: Partial<NGOFormData>) => void
}

export function StepContact({ formData, updateFormData }: StepContactProps) {
  const updateSocialLink = (key: keyof typeof formData.socialLinks, value: string) => {
    updateFormData({
      socialLinks: {
        ...formData.socialLinks,
        [key]: value,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Contact Information
        </h2>
        <p className="text-sm text-muted-foreground">
          How can donors and the protocol team reach you?
        </p>
      </div>

      {/* Primary Contact */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="required flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="contact@organization.org"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number (Optional)
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.phone || ''}
            onChange={(e) => updateFormData({ phone: e.target.value })}
          />
        </div>
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor="website" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Website (Optional)
        </Label>
        <Input
          id="website"
          type="url"
          placeholder="https://www.organization.org"
          value={formData.website || ''}
          onChange={(e) => updateFormData({ website: e.target.value })}
        />
      </div>

      {/* Social Media Links */}
      <div className="space-y-4">
        <Label className="text-base">Social Media (Optional)</Label>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="twitter"
              className="text-xs text-muted-foreground flex items-center gap-1"
            >
              <Twitter className="h-3 w-3" />
              Twitter / X
            </Label>
            <Input
              id="twitter"
              placeholder="@organization"
              value={formData.socialLinks.twitter || ''}
              onChange={(e) => updateSocialLink('twitter', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="linkedin"
              className="text-xs text-muted-foreground flex items-center gap-1"
            >
              <Linkedin className="h-3 w-3" />
              LinkedIn
            </Label>
            <Input
              id="linkedin"
              placeholder="company/organization"
              value={formData.socialLinks.linkedin || ''}
              onChange={(e) => updateSocialLink('linkedin', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="facebook"
              className="text-xs text-muted-foreground flex items-center gap-1"
            >
              <Facebook className="h-3 w-3" />
              Facebook
            </Label>
            <Input
              id="facebook"
              placeholder="organization.page"
              value={formData.socialLinks.facebook || ''}
              onChange={(e) => updateSocialLink('facebook', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

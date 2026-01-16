import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface CampaignHeroProps {
  coverImageUrl: string | null
  logoUrl: string | null
  campaignName?: string
}

export function CampaignHero({ coverImageUrl, logoUrl, campaignName }: CampaignHeroProps) {
  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="h-72 w-full bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-2xl border-x border-t overflow-hidden">
        {coverImageUrl && (
          <Image
            src={coverImageUrl}
            alt={campaignName || 'Campaign cover'}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Logo positioned at bottom */}
      <div className="absolute -bottom-12 left-8">
        <Avatar className="h-24 w-24 border-4 border-background shadow-xl rounded-2xl">
          <AvatarImage src={logoUrl || undefined} alt={campaignName} className="object-cover" />
          <AvatarFallback className="text-2xl bg-primary/5 text-primary rounded-2xl">
            {campaignName?.slice(0, 2).toUpperCase() || 'CA'}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}

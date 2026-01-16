import { Progress } from '@/components/ui/progress'
import { TrendingUp, Users, Globe, Twitter, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getGatewayUrl, parseCID, type CampaignMetadata } from '@/lib/pinata'

interface GoalSummaryProps {
  raisedDisplay: number
  goal: number
  progressDisplay: number
  endTime: Date
  isEthStrategy: boolean
  vaultTotalAssetsNum: number
  apy: number
  totalStakers: number
  ngoName?: string
  ngoWebsite?: string
  metadata?: CampaignMetadata | null
}

export function GoalSummary({
  raisedDisplay,
  goal,
  progressDisplay,
  endTime,
  isEthStrategy,
  vaultTotalAssetsNum,
  apy,
  totalStakers,
  ngoName,
  ngoWebsite,
  metadata,
}: GoalSummaryProps) {
  const daysLeft = Math.max(0, Math.ceil((endTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  const logoUrl = metadata?.ngoLogo
    ? getGatewayUrl(parseCID(metadata.ngoLogo))
    : metadata?.images?.[0]
      ? getGatewayUrl(parseCID(metadata.images[0]))
      : null

  // Calculate circumference for circle (r=8, c=2*pi*8 ≈ 50.26)
  const radius = 6
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(progressDisplay, 100) / 100) * circumference

  return (
    <div className="px-6 py-5 border-t border-border space-y-5">
      {/* Top Row: Progress & Days Left */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{progressDisplay.toFixed(1)}%</span>
          <span className="text-muted-foreground">funded</span>
        </div>
        <div className="text-muted-foreground font-medium">{daysLeft} Days Left</div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <Progress
          value={progressDisplay}
          className="h-3 bg-muted"
          indicatorClassName="bg-gradient-to-r from-teal-500 to-emerald-500"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 pt-1 border-b border-border pb-5">
        {/* Raised */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">
              Raised
            </p>
            {/* Circular Percentage */}
            <div className="relative flex items-center justify-center">
              <svg className="w-4 h-4 transform -rotate-90">
                <circle
                  className="text-muted/20"
                  strokeWidth="2"
                  stroke="currentColor"
                  fill="transparent"
                  r={radius}
                  cx="8"
                  cy="8"
                />
                <circle
                  className="text-teal-500"
                  strokeWidth="2"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r={radius}
                  cx="8"
                  cy="8"
                />
              </svg>
            </div>
          </div>
          <p className="text-lg font-bold text-foreground">
            ${raisedDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-muted-foreground truncate">of ${goal.toLocaleString()}</p>
        </div>

        {/* APY */}
        <div className="relative group">
          <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1 flex items-center gap-1">
            APY <TrendingUp className="h-3 w-3 text-emerald-500" />
          </p>
          <p className="text-lg font-bold text-emerald-600">{apy.toFixed(1)}%</p>
        </div>

        {/* Stakers */}
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1 flex items-center gap-1">
            Stakers <Users className="h-3 w-3 text-blue-500" />
          </p>
          <p className="text-lg font-bold text-foreground">{totalStakers}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
      </div>

      {/* NGO Info */}
      {/* NGO Information */}
      <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={metadata?.ngoName || ngoName}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {(metadata?.ngoName || ngoName)?.slice(0, 1) || 'N'}
              </span>
            </div>
          )}
          <div>
            <p className="font-semibold flex items-center gap-2">
              {metadata?.ngoName || ngoName || 'Unknown NGO'}
              <Badge
                variant="outline"
                className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </p>
            <p className="text-xs text-muted-foreground">Verified Organization</p>
          </div>
        </div>
        <div className="flex gap-2">
          {metadata?.socialLinks?.website && (
            <a
              href={
                metadata.socialLinks.website.startsWith('http')
                  ? metadata.socialLinks.website
                  : `https://${metadata.socialLinks.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                <Globe className="h-4 w-4" />
                Website
              </Button>
            </a>
          )}
          {metadata?.socialLinks?.twitter && (
            <a
              href={
                metadata.socialLinks.twitter.startsWith('http')
                  ? metadata.socialLinks.twitter
                  : `https://${metadata.socialLinks.twitter}`
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                <Twitter className="h-4 w-4" />
              </Button>
            </a>
          )}
          {!metadata?.socialLinks?.website && ngoWebsite && (
            <a href={ngoWebsite} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                <Globe className="h-4 w-4" />
                Website
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

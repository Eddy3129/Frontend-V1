import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'
import { CampaignStatus } from '@/hooks/useCampaign'

interface StakeButtonProps {
  status: CampaignStatus
  onClick: () => void
}

export function StakeButton({ status, onClick }: StakeButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl"
      disabled={status !== CampaignStatus.Active}
    >
      <Wallet className="h-5 w-5 mr-2" />
      Stake Now
    </Button>
  )
}

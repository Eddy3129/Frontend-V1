import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UsdcCircleColorful } from '@ant-design/web3-icons'
import { formatUnits } from 'viem'

interface YourPositionCardProps {
  address?: string
  stakeWeight?: unknown
}

export function YourPositionCard({ address, stakeWeight }: YourPositionCardProps) {
  if (!address || !stakeWeight || BigInt(String(stakeWeight)) <= 0n) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Your Position</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <UsdcCircleColorful style={{ fontSize: 40 }} />
          <div>
            <p className="text-2xl font-bold">{formatUnits(BigInt(String(stakeWeight)), 6)}</p>
            <p className="text-sm text-muted-foreground">staked USDC</p>
          </div>
        </div>
        <Link href="/dashboard" className="mt-4 block">
          <Button variant="outline" className="w-full">
            Manage Position
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

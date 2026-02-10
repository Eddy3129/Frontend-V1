import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    )

    if (!res.ok) {
      throw new Error(`CoinGecko API returned ${res.status}`)
    }

    const data = await res.json()

    if (!data?.ethereum?.usd) {
      throw new Error('Invalid response from CoinGecko')
    }

    return NextResponse.json({ usd: data.ethereum.usd })
  } catch (error) {
    console.error('Failed to fetch ETH price:', error)
    return NextResponse.json({ error: 'Failed to fetch ETH price' }, { status: 500 })
  }
}

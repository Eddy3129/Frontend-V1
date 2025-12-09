import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, type Address } from 'viem'
import { baseSepolia, ethereumSepolia, supportedChains } from '@/config/chains'
import { NGO_REGISTRY_ABI } from '@/lib/abi'
import { CONTRACTS } from '@/config/contracts'

// Create public clients for all supported chains
const publicClients = {
  [baseSepolia.id]: createPublicClient({
    chain: baseSepolia,
    transport: http(baseSepolia.rpcUrls.default.http[0]),
  }),
  [ethereumSepolia.id]: createPublicClient({
    chain: ethereumSepolia,
    transport: http(ethereumSepolia.rpcUrls.default.http[0]),
  }),
}

// GET - Fetch NGO info by address (queries all chains)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const addressParam = searchParams.get('address')
    const chainIdParam = searchParams.get('chainId')

    if (!addressParam) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 })
    }

    const address = addressParam as Address

    // If chainId specified, only query that chain
    if (chainIdParam) {
      const chainId = parseInt(chainIdParam)
      const result = await fetchNGOInfoFromChain(address, chainId)
      if (result) {
        return NextResponse.json(result)
      }
      return NextResponse.json({ error: 'NGO not found on specified chain' }, { status: 404 })
    }

    // Query all chains in parallel and return the first valid result
    const results = await Promise.all(
      supportedChains.map((chain) => fetchNGOInfoFromChain(address, chain.id))
    )

    // Find the first chain with valid NGO data (has metadataCid)
    const validResult = results.find((r) => r && r.metadataCid && r.metadataCid !== '')
    if (validResult) {
      return NextResponse.json(validResult)
    }

    return NextResponse.json({ error: 'NGO not found on any chain' }, { status: 404 })
  } catch (error) {
    console.error('[NGO Info] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NGO info', details: String(error) },
      { status: 500 }
    )
  }
}

async function fetchNGOInfoFromChain(
  address: Address,
  chainId: number
): Promise<{
  success: boolean
  address: Address
  chainId: number
  chainName: string
  metadataCid: string
  kycHash: string
  attestor: Address
  createdAt: string
  updatedAt: string
  version: string
  totalReceived: string
  isActive: boolean
} | null> {
  try {
    const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS]
    const client = publicClients[chainId as keyof typeof publicClients]
    const chain = supportedChains.find((c) => c.id === chainId)

    if (!contracts?.ngoRegistry || !client || !chain) {
      return null
    }

    const ngoInfo = await client.readContract({
      address: contracts.ngoRegistry,
      abi: NGO_REGISTRY_ABI,
      functionName: 'ngoInfo',
      args: [address],
    })

    const [metadataCid, kycHash, attestor, createdAt, updatedAt, version, totalReceived, isActive] =
      ngoInfo as [string, `0x${string}`, Address, bigint, bigint, bigint, bigint, boolean]

    return {
      success: true,
      address,
      chainId,
      chainName: chain.name,
      metadataCid,
      kycHash,
      attestor,
      createdAt: createdAt.toString(),
      updatedAt: updatedAt.toString(),
      version: version.toString(),
      totalReceived: totalReceived.toString(),
      isActive,
    }
  } catch (error) {
    console.error(`[NGO Info] Error fetching from chain ${chainId}:`, error)
    return null
  }
}

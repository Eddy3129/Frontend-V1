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

interface ApprovedNGO {
  address: Address
  chainId: number
  chainName: string
}

// GET - Fetch all approved NGOs from all chains
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chainIdParam = searchParams.get('chainId')

    // If chainId specified, only query that chain
    if (chainIdParam) {
      const chainId = parseInt(chainIdParam)
      const ngos = await fetchApprovedNGOsFromChain(chainId)
      return NextResponse.json({
        success: true,
        ngos,
        total: ngos.length,
      })
    }

    // Query all chains in parallel
    const results = await Promise.all(
      supportedChains.map((chain) => fetchApprovedNGOsFromChain(chain.id))
    )

    // Flatten and deduplicate by address (an NGO might be approved on multiple chains)
    const allNGOs = results.flat()

    // Group by address to show which chains each NGO is on
    const ngoMap = new Map<string, ApprovedNGO[]>()
    for (const ngo of allNGOs) {
      const existing = ngoMap.get(ngo.address.toLowerCase()) || []
      existing.push(ngo)
      ngoMap.set(ngo.address.toLowerCase(), existing)
    }

    // Convert to array with chain info
    const uniqueNGOs = Array.from(ngoMap.entries()).map(([address, chains]) => ({
      address: address as Address,
      chains: chains.map((c) => ({ chainId: c.chainId, chainName: c.chainName })),
    }))

    return NextResponse.json({
      success: true,
      ngos: allNGOs,
      uniqueNGOs,
      total: uniqueNGOs.length,
    })
  } catch (error) {
    console.error('[Approved NGOs] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch approved NGOs', details: String(error) },
      { status: 500 }
    )
  }
}

async function fetchApprovedNGOsFromChain(chainId: number): Promise<ApprovedNGO[]> {
  try {
    const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS]
    const client = publicClients[chainId as keyof typeof publicClients]
    const chain = supportedChains.find((c) => c.id === chainId)

    if (!contracts?.ngoRegistry || !client || !chain) {
      console.log(`[Approved NGOs] No config for chain ${chainId}`)
      return []
    }

    const approvedNGOs = await client.readContract({
      address: contracts.ngoRegistry,
      abi: NGO_REGISTRY_ABI,
      functionName: 'approvedNGOs',
    })

    const addresses = approvedNGOs as Address[]
    console.log(`[Approved NGOs] Found ${addresses.length} NGOs on ${chain.name}`)

    return addresses.map((address) => ({
      address,
      chainId,
      chainName: chain.name,
    }))
  } catch (error) {
    console.error(`[Approved NGOs] Error fetching from chain ${chainId}:`, error)
    return []
  }
}

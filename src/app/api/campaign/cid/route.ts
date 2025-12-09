import { NextRequest, NextResponse } from 'next/server'
import { getPinataClient } from '@/lib/pinata'

// Store campaign ID -> CID mappings in Pinata as a JSON file
const CID_MAPPING_NAME = 'campaign-cid-mappings'

interface CIDMappings {
  [campaignId: string]: string // campaignId (bytes32) -> IPFS CID
}

// In-memory cache to avoid fetching from IPFS on every request
let cachedMappings: CIDMappings | null = null
let cacheTimestamp = 0
const CACHE_TTL = 30 * 1000 // 30 seconds cache

// GET: Retrieve CID for a campaign ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }

    // Try to get mappings
    const mappings = await getMappings()
    const cid = mappings[campaignId]

    if (!cid) {
      return NextResponse.json({ error: 'CID not found for campaign' }, { status: 404 })
    }

    return NextResponse.json({ cid })
  } catch (error) {
    console.error('Error fetching campaign CID:', error)
    return NextResponse.json({ error: 'Failed to fetch CID' }, { status: 500 })
  }
}

// POST: Store a campaign ID -> CID mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, cid } = body

    if (!campaignId || !cid) {
      return NextResponse.json({ error: 'campaignId and cid are required' }, { status: 400 })
    }

    // Get existing mappings
    const mappings = await getMappings()

    // Add new mapping
    mappings[campaignId] = cid

    // Save updated mappings
    await saveMappings(mappings)

    // Update cache immediately
    cachedMappings = mappings
    cacheTimestamp = Date.now()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error storing campaign CID:', error)
    return NextResponse.json({ error: 'Failed to store CID' }, { status: 500 })
  }
}

// Helper to get mappings - uses Pinata API to find the latest file
async function getMappings(): Promise<CIDMappings> {
  // Return cached if still valid
  if (cachedMappings && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedMappings
  }

  try {
    const pinata = getPinataClient()
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY

    // Find the latest mappings file via Pinata API by name
    const files = await pinata.files.public.list().name(CID_MAPPING_NAME).order('DESC').limit(1)

    if (files.files && files.files.length > 0 && gateway) {
      const latestCid = files.files[0].cid

      const response = await fetch(`https://${gateway}/ipfs/${latestCid}`)
      if (response.ok) {
        const mappings = await response.json()
        cachedMappings = mappings
        cacheTimestamp = Date.now()
        return mappings
      }
    }

    return cachedMappings || {}
  } catch (error) {
    console.error('Error getting mappings:', error)
    return cachedMappings || {}
  }
}

// Helper to save mappings to Pinata
async function saveMappings(mappings: CIDMappings): Promise<string> {
  const pinata = getPinataClient()

  // Upload the new mappings JSON to Pinata with the same name
  const result = await pinata.upload.public.json(mappings).name(CID_MAPPING_NAME)

  console.log(`Campaign mappings updated: ${result.cid}`)

  return result.cid
}

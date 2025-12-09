import { NextRequest, NextResponse } from 'next/server'
import { getPinataClient, toIPFSUri } from '@/lib/pinata'
import type { NGOIPFSMetadata } from '@/types/ngo'

export async function POST(request: NextRequest) {
  try {
    const metadata: NGOIPFSMetadata = await request.json()

    // Validate required fields
    if (!metadata.name || !metadata.description || !metadata.walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, walletAddress' },
        { status: 400 }
      )
    }

    // Add timestamp and version
    const fullMetadata: NGOIPFSMetadata = {
      ...metadata,
      createdAt: new Date().toISOString(),
      version: '1.0.0',
    }

    const pinata = getPinataClient()

    const result = await pinata.upload.public
      .json(fullMetadata)
      .name(`ngo-${metadata.name.slice(0, 50)}`)
      .keyvalues({
        type: 'ngo-metadata',
        name: metadata.name,
        category: metadata.category || 'general',
        country: metadata.organization?.country || 'unknown',
      })

    return NextResponse.json({
      success: true,
      cid: result.cid,
      uri: toIPFSUri(result.cid),
    })
  } catch (error) {
    console.error('Error uploading NGO metadata:', error)
    return NextResponse.json({ error: 'Failed to upload metadata to IPFS' }, { status: 500 })
  }
}

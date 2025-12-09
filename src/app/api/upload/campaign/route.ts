import { NextRequest, NextResponse } from 'next/server'
import { getPinataClient, toIPFSUri, type CampaignMetadata } from '@/lib/pinata'

export async function POST(request: NextRequest) {
  try {
    const metadata: CampaignMetadata = await request.json()

    // Validate required fields
    if (!metadata.name || !metadata.description || !metadata.ngoName) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, ngoName' },
        { status: 400 }
      )
    }

    // Add timestamp and version
    const fullMetadata: CampaignMetadata = {
      ...metadata,
      createdAt: new Date().toISOString(),
      version: '1.0.0',
    }

    const pinata = getPinataClient()

    const result = await pinata.upload.public
      .json(fullMetadata)
      .name(`campaign-${metadata.name.slice(0, 50)}`)
      .keyvalues({
        type: 'campaign-metadata',
        ngo: metadata.ngoName,
        category: metadata.category || 'general',
      })

    return NextResponse.json({
      success: true,
      cid: result.cid,
      uri: toIPFSUri(result.cid),
    })
  } catch (error) {
    console.error('Error uploading campaign metadata:', error)
    return NextResponse.json({ error: 'Failed to upload metadata to IPFS' }, { status: 500 })
  }
}

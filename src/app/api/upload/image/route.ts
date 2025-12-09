import { NextRequest, NextResponse } from 'next/server'
import { getPinataClient, toIPFSUri } from '@/lib/pinata'

// Max file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 20MB' }, { status: 400 })
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG' },
        { status: 400 }
      )
    }

    const pinata = getPinataClient()

    const result = await pinata.upload.public.file(file).name(file.name).keyvalues({
      type: 'image',
      mimeType: file.type,
      size: file.size.toString(),
    })

    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY
    const gatewayUrl = gateway
      ? `https://${gateway}/ipfs/${result.cid}`
      : `https://gateway.pinata.cloud/ipfs/${result.cid}`

    return NextResponse.json({
      success: true,
      cid: result.cid,
      uri: toIPFSUri(result.cid),
      url: gatewayUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ error: 'Failed to upload image to IPFS' }, { status: 500 })
  }
}

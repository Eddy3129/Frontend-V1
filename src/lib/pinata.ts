import { PinataSDK } from 'pinata'

// Server-side Pinata client (use in API routes only)
export function getPinataClient() {
  const jwt = process.env.PINATA_JWT
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY

  if (!jwt) {
    throw new Error('PINATA_JWT environment variable is required')
  }

  return new PinataSDK({
    pinataJwt: jwt,
    pinataGateway: gateway,
  })
}

// Campaign metadata schema
export interface CampaignMetadata {
  name: string
  description: string
  ngoName: string
  category: string
  images: string[] // IPFS CIDs
  coverImage?: string // Main cover image CID
  milestones: {
    title: string
    description: string
    targetAmount: string
  }[]
  socialLinks?: {
    website?: string
    twitter?: string
    discord?: string
    telegram?: string
  }
  createdAt: string
  version: string
}

// NGO metadata schema
export interface NGOMetadata {
  name: string
  description: string
  logo?: string // IPFS CID
  website?: string
  category: string
  country: string
  registrationNumber?: string
  socialLinks?: {
    twitter?: string
    linkedin?: string
    facebook?: string
  }
  createdAt: string
  version: string
}

// Checkpoint proof metadata
export interface CheckpointProof {
  campaignId: string
  checkpointIndex: number
  title: string
  description: string
  evidence: {
    type: 'image' | 'document' | 'link'
    cid?: string // For uploaded files
    url?: string // For external links
    description: string
  }[]
  submittedAt: string
  version: string
}

// Build gateway URL for an IPFS CID
export function getGatewayUrl(cid: string): string {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY
  if (!gateway) {
    // Fallback to public gateway
    return `https://gateway.pinata.cloud/ipfs/${cid}`
  }
  return `https://${gateway}/ipfs/${cid}`
}

// Parse IPFS URI to CID
export function parseCID(uri: string): string {
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', '')
  }
  return uri
}

// Create IPFS URI from CID
export function toIPFSUri(cid: string): string {
  return `ipfs://${cid}`
}

// Fetch campaign CID from Pinata mappings (server-side)
export async function getCampaignCID(campaignId: string): Promise<string | null> {
  const CID_MAPPING_NAME = 'campaign-cid-mappings'
  try {
    const pinata = getPinataClient()
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY

    // Find the latest mappings file via Pinata API by name
    const files = await pinata.files.public.list().name(CID_MAPPING_NAME).order('DESC').limit(1)

    if (files.files && files.files.length > 0 && gateway) {
      const latestCid = files.files[0].cid

      const response = await fetch(`https://${gateway}/ipfs/${latestCid}`, {
        next: { revalidate: 30 },
      })
      if (response.ok) {
        const mappings = await response.json()
        return mappings[campaignId] || null
      }
    }
    return null
  } catch (error) {
    console.error('Error getting mappings:', error)
    return null
  }
}

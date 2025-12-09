import { NextRequest, NextResponse } from 'next/server'
import { getPinataClient, getGatewayUrl } from '@/lib/pinata'

// The name used to identify the applications index file on Pinata
const APPLICATIONS_INDEX_NAME = 'ngo-applications-index'

export interface NGOApplicationRecord {
  id: string
  metadataCID: string
  walletAddress: string
  ngoName: string // NGO name for display in admin panel
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  txHash?: string // Transaction hash when approved on-chain
}

export interface ApplicationsIndex {
  version: string
  updatedAt: string
  applications: NGOApplicationRecord[]
}

// Fetch the current applications index from IPFS
async function fetchApplicationsIndex(): Promise<ApplicationsIndex> {
  try {
    const pinata = getPinataClient()

    // List files with the index name to find the latest version
    const files = await pinata.files.public.list().name(APPLICATIONS_INDEX_NAME)

    if (files.files && files.files.length > 0) {
      // Sort by created date to get the latest
      const sortedFiles = files.files.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const latestFile = sortedFiles[0]

      // Fetch the index content
      const response = await pinata.gateways.public.get(latestFile.cid)

      // Handle the response data
      if (response.data) {
        // If it's a Blob, read it as text
        if (response.data instanceof Blob) {
          const text = await response.data.text()
          return JSON.parse(text) as ApplicationsIndex
        }
        // If it's already an object (not a Blob), return it
        if (typeof response.data === 'object') {
          return response.data as unknown as ApplicationsIndex
        }
        // If it's a string, parse it
        if (typeof response.data === 'string') {
          return JSON.parse(response.data) as ApplicationsIndex
        }
      }
    }
  } catch (error) {
    console.error('[Applications] Error fetching index:', error)
  }

  // Return empty index if not found or error
  return {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    applications: [],
  }
}

// Save the applications index to IPFS
async function saveApplicationsIndex(index: ApplicationsIndex): Promise<string> {
  const pinata = getPinataClient()

  index.updatedAt = new Date().toISOString()

  const result = await pinata.upload.public.json(index).name(APPLICATIONS_INDEX_NAME)

  console.log(`[Applications] Saved index to IPFS: ${result.cid}`)
  return result.cid
}

// GET - List all applications or fetch metadata by CID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const cid = searchParams.get('cid')
    const status = searchParams.get('status') || 'all'

    // Fetch metadata from IPFS by CID (for reviewing application details)
    if (cid) {
      try {
        const pinata = getPinataClient()
        const response = await pinata.gateways.public.get(cid)

        if (response.data) {
          let metadata: unknown
          if (response.data instanceof Blob) {
            const text = await response.data.text()
            metadata = JSON.parse(text)
          } else if (typeof response.data === 'string') {
            metadata = JSON.parse(response.data)
          } else {
            metadata = response.data
          }
          return NextResponse.json({ success: true, metadata, cid })
        }
      } catch {
        // Fallback to gateway URL fetch
        const gatewayUrl = getGatewayUrl(cid)
        const response = await fetch(gatewayUrl)

        if (!response.ok) {
          return NextResponse.json({ error: 'Failed to fetch metadata from IPFS' }, { status: 404 })
        }

        const metadata = await response.json()
        return NextResponse.json({ success: true, metadata, cid })
      }
    }

    // Fetch the applications index from IPFS
    const index = await fetchApplicationsIndex()

    // Get single application by ID
    if (id) {
      const application = index.applications.find((app) => app.id === id)
      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        application,
      })
    }

    // Filter applications by status
    const filteredApplications = index.applications
      .filter((app) => status === 'all' || app.status === status)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

    return NextResponse.json({
      success: true,
      applications: filteredApplications,
      total: filteredApplications.length,
    })
  } catch (error) {
    console.error('[Applications] Error fetching:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

// POST - Submit a new pending application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { metadataCID, walletAddress, ngoName } = body

    if (!metadataCID || !walletAddress) {
      return NextResponse.json(
        { error: 'metadataCID and walletAddress are required' },
        { status: 400 }
      )
    }

    // Fetch current index
    const index = await fetchApplicationsIndex()

    // Check if this wallet already has a pending application
    const existingPending = index.applications.find(
      (app) =>
        app.walletAddress.toLowerCase() === walletAddress.toLowerCase() && app.status === 'pending'
    )
    if (existingPending) {
      return NextResponse.json(
        { error: 'You already have a pending application', existingId: existingPending.id },
        { status: 400 }
      )
    }

    // Generate unique ID
    const id = `ngo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    const application: NGOApplicationRecord = {
      id,
      metadataCID,
      walletAddress,
      ngoName: ngoName || 'Unknown NGO',
      submittedAt: new Date().toISOString(),
      status: 'pending',
    }

    // Add to index and save
    index.applications.push(application)
    const newCid = await saveApplicationsIndex(index)

    return NextResponse.json({
      success: true,
      application,
      indexCid: newCid,
      message: 'Application submitted successfully. Please wait for admin review.',
    })
  } catch (error) {
    console.error('[Applications] Error submitting:', error)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}

// PATCH - Update application status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, reviewedBy, rejectionReason, txHash } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
    }

    // Fetch current index
    const index = await fetchApplicationsIndex()

    // Find and update the application
    const appIndex = index.applications.findIndex((app) => app.id === id)
    if (appIndex === -1) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Update application
    index.applications[appIndex] = {
      ...index.applications[appIndex],
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy,
      rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      txHash: status === 'approved' ? txHash : undefined,
    }

    // Save updated index
    const newCid = await saveApplicationsIndex(index)

    return NextResponse.json({
      success: true,
      application: index.applications[appIndex],
      indexCid: newCid,
    })
  } catch (error) {
    console.error('[Applications] Error updating:', error)
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
}

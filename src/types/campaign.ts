import type { Address } from 'viem'

// Strategy options available for campaigns
export interface StrategyOption {
  id: string
  name: string
  symbol: string
  description: string
  asset: string // Underlying asset symbol (USDC, WETH)
  apy: number | null // Live APY from Aave, null if loading
  tvl: number | null // Total value locked in USD
  volume24h: number | null // 24h volume (not available from Aave API, placeholder)
  risk: 'low' | 'medium' | 'high'
  protocol: string
  icon?: string
  tokenLogo?: string // URL to token logo
  network: 'base-sepolia' | 'eth-sepolia'
  networkLabel: string
  networkLogo?: string // URL to network logo
  vaultUrl?: string // Link to vault on explorer
  vaultAddress?: string
}

// Milestone for campaign progress tracking
export interface CampaignMilestone {
  id: string
  title: string
  description: string
  targetPercentage: number // % of total TVL goal
  deliverables: string
  startDate: Date | null
  endDate: Date | null
}

// Campaign form data structure
export interface CampaignFormData {
  // Step 1: Basic Info
  title: string
  description: string
  purpose: string // Short purpose statement
  category: string

  // Step 2: Organization (selected from approved NGOs)
  selectedNgoAddress: Address | '' // Selected NGO's wallet address
  organizationName: string // Auto-populated from NGO metadata
  organizationLogo: string | null // Auto-populated from NGO metadata (IPFS CID)
  personInCharge: string // Campaign coordinator (can differ from NGO contact)
  contactEmail: string
  contactPhone: string
  contactTelegram: string
  email: string // Auto-populated from NGO metadata
  website?: string // Auto-populated from NGO metadata
  socialLinks: {
    twitter?: string
    discord?: string
    telegram?: string
  }

  // Step 3: Beneficiary & Strategy
  beneficiaryAddress: Address | ''
  selectedStrategies: string[] // Strategy IDs
  targetTVL: string // In USD value
  minStake?: string // Minimum stake amount

  // Step 4: Milestones
  milestones: CampaignMilestone[]

  // Step 5: Images
  coverImage: string | null // IPFS CID
  additionalImages: string[] // IPFS CIDs

  // Step 6: Timeline (moved to Review)
  startDate: Date | null
  endDate: Date | null
}

// Campaign categories
export const CAMPAIGN_CATEGORIES = [
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'environment', label: 'Environment', icon: '🌱' },
  { value: 'poverty', label: 'Poverty Alleviation', icon: '🏠' },
  { value: 'disaster', label: 'Disaster Relief', icon: '🆘' },
  { value: 'animal', label: 'Animal Welfare', icon: '🐾' },
  { value: 'community', label: 'Community Development', icon: '🤝' },
  { value: 'other', label: 'Other', icon: '💡' },
] as const

export type CampaignCategory = (typeof CAMPAIGN_CATEGORIES)[number]['value']

// Form step configuration
export interface FormStep {
  id: number
  title: string
  description: string
  icon: string
}

export const FORM_STEPS: FormStep[] = [
  { id: 1, title: 'Basic Info', description: 'Campaign details', icon: '📝' },
  { id: 2, title: 'Organization', description: 'Select your NGO', icon: '🏢' },
  { id: 3, title: 'Strategy & Target', description: 'Yield strategy', icon: '📈' },
  { id: 4, title: 'Milestones', description: 'Progress checkpoints', icon: '🎯' },
  { id: 5, title: 'Images', description: 'Campaign visuals', icon: '🖼️' },
  { id: 6, title: 'Review', description: 'Confirm & submit', icon: '✅' },
]

// Initial form state
export const initialFormData: CampaignFormData = {
  title: '',
  description: '',
  purpose: '',
  category: '',
  selectedNgoAddress: '',
  organizationName: '',
  organizationLogo: null,
  personInCharge: '',
  contactEmail: '',
  contactPhone: '',
  contactTelegram: '',
  email: '',
  website: '',
  socialLinks: {},
  beneficiaryAddress: '',
  selectedStrategies: [],
  targetTVL: '',
  minStake: '',
  milestones: [],
  coverImage: null,
  additionalImages: [],
  startDate: null,
  endDate: null,
}

// Metadata format for IPFS (matches pinata.ts CampaignMetadata)
export interface CampaignIPFSMetadata {
  name: string
  description: string
  ngoName: string
  category: string
  currency: 'USDC' | 'ETH' // Added currency field
  images: string[]
  coverImage?: string
  personInCharge: string
  contact?: {
    email: string
    phone: string
    telegram: string
  }
  email: string
  beneficiaryAddress: string
  targetTVL: string
  selectedStrategies: string[]
  milestones: {
    title: string
    description: string
    targetAmount: string
    deliverables: string
    startDate?: string
    endDate?: string
  }[]
  socialLinks?: {
    website?: string
    twitter?: string
    discord?: string
    telegram?: string
  }
  startDate: string
  endDate: string
  createdAt: string
  version: string
}

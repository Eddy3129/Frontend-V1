import type { Address } from 'viem'

// NGO status enum matching the contract
export enum NGOStatus {
  Pending = 0, // Application submitted, awaiting review
  Active = 1, // Verified and active
  Suspended = 2, // Temporarily suspended
  Removed = 3, // Permanently removed
}

// NGO form data structure for registration
export interface NGOFormData {
  // Step 1: Basic Info
  name: string
  description: string
  mission: string
  category: string

  // Step 2: Contact Info
  email: string
  phone?: string
  website?: string
  socialLinks: {
    twitter?: string
    linkedin?: string
    facebook?: string
  }

  // Step 3: Organization Details
  registrationNumber: string // Official registration/tax ID
  country: string
  city: string
  address: string
  foundedYear?: string

  // Step 4: Documents
  logo: string | null // IPFS CID
  registrationDocument: string | null // IPFS CID - Official registration certificate
  taxDocument: string | null // IPFS CID - Tax exemption document
  additionalDocuments: string[] // IPFS CIDs

  // Step 5: Wallet & Verification
  walletAddress: Address | ''
  kycCompleted: boolean
}

// NGO categories
export const NGO_CATEGORIES = [
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'environment', label: 'Environment', icon: '🌱' },
  { value: 'poverty', label: 'Poverty Alleviation', icon: '🏠' },
  { value: 'humanitarian', label: 'Humanitarian Aid', icon: '🆘' },
  { value: 'animal', label: 'Animal Welfare', icon: '🐾' },
  { value: 'community', label: 'Community Development', icon: '🤝' },
  { value: 'arts', label: 'Arts & Culture', icon: '🎨' },
  { value: 'research', label: 'Research & Science', icon: '🔬' },
  { value: 'other', label: 'Other', icon: '💡' },
] as const

export type NGOCategory = (typeof NGO_CATEGORIES)[number]['value']

// Full list of world countries (ISO 3166-1)
export const COUNTRIES = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo (Democratic Republic)',
  'Congo (Republic)',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Ivory Coast',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kosovo',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Palestine',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
] as const

export type Country = (typeof COUNTRIES)[number]

// Form step configuration
export interface NGOFormStep {
  id: number
  title: string
  description: string
  icon: string
}

export const NGO_FORM_STEPS: NGOFormStep[] = [
  { id: 1, title: 'Basic Info', description: 'Organization details', icon: '🏢' },
  { id: 2, title: 'Contact', description: 'Contact information', icon: '📧' },
  { id: 3, title: 'Registration', description: 'Legal details', icon: '📋' },
  { id: 4, title: 'Documents', description: 'Upload documents', icon: '📄' },
  { id: 5, title: 'Review', description: 'Confirm & submit', icon: '✅' },
]

// Initial form state
export const initialNGOFormData: NGOFormData = {
  name: '',
  description: '',
  mission: '',
  category: '',
  email: '',
  phone: '',
  website: '',
  socialLinks: {},
  registrationNumber: '',
  country: '',
  city: '',
  address: '',
  foundedYear: '',
  logo: null,
  registrationDocument: null,
  taxDocument: null,
  additionalDocuments: [],
  walletAddress: '',
  kycCompleted: false,
}

// Metadata format for IPFS
export interface NGOIPFSMetadata {
  name: string
  description: string
  mission: string
  category: string
  contact: {
    email: string
    phone?: string
    website?: string
  }
  socialLinks?: {
    twitter?: string
    linkedin?: string
    facebook?: string
    instagram?: string
  }
  organization: {
    registrationNumber: string
    country: string
    city: string
    address: string
    foundedYear?: string
  }
  documents: {
    logo?: string
    registrationDocument?: string
    taxDocument?: string
    additionalDocuments: string[]
  }
  walletAddress: string
  createdAt: string
  version: string
}

// NGO info from contract
export interface NGOInfo {
  metadataCid: string
  kycHash: `0x${string}`
  attestor: Address
  createdAt: bigint
  updatedAt: bigint
  version: bigint
  totalReceived: bigint
  isActive: boolean
}

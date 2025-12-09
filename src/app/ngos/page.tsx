import type { Metadata } from 'next'
import { NGOsClient } from './ngos-client'

export const metadata: Metadata = {
  title: 'Verified NGOs - Give Protocol',
  description: 'Browse registered and verified non-governmental organizations',
}

export default function NGOsPage() {
  return <NGOsClient />
}

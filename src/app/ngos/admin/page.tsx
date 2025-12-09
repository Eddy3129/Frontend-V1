import type { Metadata } from 'next'
import { NGOAdminClient } from './admin-client'

export const metadata: Metadata = {
  title: 'NGO Admin - Give Protocol',
  description: 'Admin panel to review and approve NGO applications',
}

export default function NGOAdminPage() {
  return <NGOAdminClient />
}

import { NGOProfileClient } from './ngo-profile-client'

export default function NGOProfilePage({ params }: { params: { address: string } }) {
  return <NGOProfileClient address={params.address} />
}

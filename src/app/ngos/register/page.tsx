import type { Metadata } from 'next'
import { RegisterNGOClient } from './register-ngo-client'

export const metadata: Metadata = {
  title: 'Register NGO - Give Protocol',
  description: 'Apply to register your non-governmental organization on Give Protocol',
}

export default function RegisterNGOPage() {
  return <RegisterNGOClient />
}

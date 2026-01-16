'use client'

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'

interface ConnectButtonProps {
  className?: string
  label?: string
}

export function ConnectButton({ className, label }: ConnectButtonProps) {
  return (
    <div className={className}>
      <RainbowConnectButton label={label} />
    </div>
  )
}

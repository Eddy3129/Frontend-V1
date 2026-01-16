'use client'

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'
import { cn } from '@/lib/utils'
import { Wallet } from 'lucide-react'

interface ConnectButtonProps {
  className?: string
  label?: string
}

export function ConnectButton({ className, label }: ConnectButtonProps) {
  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated')

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
            className={cn('w-fit', className)}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="w-full h-11 px-6 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Wallet className="h-4 w-4" />
                    {label || 'Connect Wallet'}
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="w-full h-11 px-6 text-sm font-bold bg-destructive text-destructive-foreground rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Wrong network
                  </button>
                )
              }

              return (
                <div className="flex flex-wrap items-center gap-2 w-full">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="h-11 px-4 text-xs font-bold bg-secondary/50 hover:bg-secondary text-foreground rounded-xl transition-all flex items-center gap-2 border border-border/50"
                  >
                    {chain.hasIcon && (
                      <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-background">
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    )}
                    <span className="hidden sm:inline">{chain.name}</span>
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="flex-1 h-11 px-4 text-sm font-bold bg-secondary/50 hover:bg-secondary text-foreground rounded-xl transition-all border border-border/50 flex items-center justify-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    {account.displayName}
                    {account.displayBalance && (
                      <span className="hidden md:inline text-muted-foreground ml-1">
                        ({account.displayBalance})
                      </span>
                    )}
                  </button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </RainbowConnectButton.Custom>
  )
}

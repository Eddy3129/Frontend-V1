'use client'

import {
  useConnection,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
  useConnectors,
  useChains,
} from 'wagmi'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, Check } from 'lucide-react'
import { toast } from 'sonner'

export function ConnectButton() {
  const { address, isConnected, isConnecting } = useConnection()
  const connect = useConnect()
  const connectors = useConnectors()
  const disconnect = useDisconnect()
  const chainId = useChainId()
  const switchChain = useSwitchChain()
  const chains = useChains()

  const currentChain = chains.find((c) => c.id === chainId)

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success('Address copied to clipboard')
    }
  }

  const openExplorer = () => {
    if (address && currentChain) {
      window.open(`${currentChain.blockExplorers.default.url}/address/${address}`, '_blank')
    }
  }

  if (!isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="gradient-give text-white glow-give hover:scale-105 transition-transform"
            disabled={isConnecting}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Select Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {connectors.map((connector) => (
            <DropdownMenuItem
              key={connector.uid}
              onClick={() => connect.mutate({ connector })}
              className="cursor-pointer"
            >
              {connector.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Chain Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={switchChain.isPending}
            className="hidden sm:flex"
          >
            <span className="w-2 h-2 rounded-full bg-primary mr-2" />
            {currentChain?.name ?? 'Unknown'}
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Switch Network</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {chains.map((chain) => (
            <DropdownMenuItem
              key={chain.id}
              onClick={() => switchChain.mutate({ chainId: chain.id })}
              className="cursor-pointer"
            >
              <span className="flex items-center gap-2 w-full">
                {chain.name}
                {chain.id === chainId && <Check className="h-4 w-4 ml-auto text-primary" />}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Account Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="font-mono">
            <div className="w-2 h-2 rounded-full gradient-give mr-2" />
            {truncateAddress(address!)}
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-mono text-xs text-muted-foreground">
            {truncateAddress(address!)}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openExplorer} className="cursor-pointer">
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Explorer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => disconnect.mutate()}
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

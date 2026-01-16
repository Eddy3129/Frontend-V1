'use client'

import { WagmiProvider, State } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, useTheme } from 'next-themes'
import { useState, useEffect, type ReactNode } from 'react'
import { wagmiConfig } from '@/config/wagmi'
import { RainbowKitProvider, lightTheme, darkTheme } from '@rainbow-me/rainbowkit'

interface ProvidersProps {
  children: ReactNode
  initialState?: State
}

function RainbowKitThemeWrapper({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const light = lightTheme({
    accentColor: '#3fa99b',
    accentColorForeground: 'white',
    borderRadius: 'medium',
  })

  const dark = darkTheme({
    accentColor: '#eec07b',
    accentColorForeground: '#2c3930',
    borderRadius: 'medium',
  })

  if (!mounted) {
    return <RainbowKitProvider theme={dark}>{children}</RainbowKitProvider>
  }

  return (
    <RainbowKitProvider theme={resolvedTheme === 'dark' ? dark : light}>
      {children}
    </RainbowKitProvider>
  )
}

export function Providers({ children, initialState }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 30 * 1000,
          },
        },
      })
  )

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <RainbowKitThemeWrapper>{children}</RainbowKitThemeWrapper>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

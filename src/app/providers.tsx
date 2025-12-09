'use client'

import { WagmiProvider, State } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState, type ReactNode } from 'react'
import { wagmiConfig } from '@/config/wagmi'

interface ProvidersProps {
  children: ReactNode
  initialState?: State
}

export function Providers({ children, initialState }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Don't refetch on window focus in development
            refetchOnWindowFocus: false,
            // Stale time of 30 seconds
            staleTime: 30 * 1000,
          },
        },
      })
  )

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-12 w-full min-w-0 rounded-xl border-2 border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground shadow-sm transition-all outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus:border-ring focus:ring-2 focus:ring-ring/20',
        'file:text-foreground file:inline-flex file:h-8 file:border-0 file:bg-secondary file:rounded-lg file:px-3 file:text-sm file:font-medium',
        className
      )}
      {...props}
    />
  )
}

export { Input }

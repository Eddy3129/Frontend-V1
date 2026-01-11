'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import { cn } from '@/lib/utils'
import { Heart, LayoutDashboard, Vote, Users, Menu, Github } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

const navItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campaigns', icon: Heart },
  { href: '/ngos', label: 'NGOs', icon: Users },
  { href: '/dashboard', label: 'Dashboard', icon: Vote },
]

export function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full py-4 px-6 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-300">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-brand-gradient rounded-lg flex items-center justify-center text-primary-foreground shadow-md transition-transform group-hover:scale-105">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <span className="text-foreground font-serif font-bold text-2xl tracking-tight">
            Give<span className="text-primary"> Protocol</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-bold transition-all',
                  isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Desktop Wallet */}
          <div className="hidden sm:block">
            <ConnectButton />
          </div>

          <Link
            href="https://github.com/GIVE-Labs/give-protocol-v1"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md border border-slate-400 hover:bg-slate-400 transition-colors duration-200"
          >
            <Github className="h-5 w-5 text-slate-400 hover:text-white" />
          </Link>
          <ThemeToggle />

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 pt-12 bg-background border-border">
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-bold transition-all',
                        isActive
                          ? 'bg-secondary text-secondary-foreground'
                          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                      )}
                    >
                      <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              {/* Mobile Wallet */}
              <div className="mt-6 pt-6 border-t border-border sm:hidden">
                <ConnectButton />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

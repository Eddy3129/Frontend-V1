'use client'

import Link from 'next/link'
import { Heart, Github, Twitter, MessageCircle, Mail, ExternalLink } from 'lucide-react'

const footerLinks = {
  protocol: [
    { label: 'Dashboard', href: '/' },
    { label: 'Campaigns', href: '/campaigns' },
    { label: 'Stake & Vote', href: '/dashboard' },
    { label: 'NGOs', href: '/ngos' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs', external: true },
    {
      label: 'Smart Contracts',
      href: 'https://github.com/give-protocol',
      external: true,
    },
    { label: 'Audit Reports', href: '/audits', external: true },
    { label: 'FAQ', href: '/faq' },
  ],
  community: [
    {
      label: 'Twitter',
      href: 'https://twitter.com/giveprotocol',
      icon: Twitter,
      external: true,
    },
    {
      label: 'Discord',
      href: 'https://discord.gg/giveprotocol',
      icon: MessageCircle,
      external: true,
    },
    {
      label: 'GitHub',
      href: 'https://github.com/give-protocol',
      icon: Github,
      external: true,
    },
  ],
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted text-foreground transition-colors duration-300 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <Heart className="h-8 w-8 icon-glow fill-current" />
                <div className="absolute inset-0 blur-sm bg-primary/30 dark:bg-[#4ade80]/30 rounded-full" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-foreground text-xl font-black tracking-tight">GIVE</span>
                <span className="text-muted-foreground font-medium text-xs tracking-widest">
                  PROTOCOL
                </span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              No-loss donations for a better world. Deposit stablecoins, earn yield through DeFi,
              and direct that yield to causes you care about.
            </p>
          </div>

          {/* Protocol Links */}
          <div className="space-y-6 mt-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-primary">
              Protocol
            </h3>
            <ul className="space-y-4">
              {footerLinks.protocol.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-6 mt-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-primary">
              Resources
            </h3>
            <ul className="space-y-4">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                    {...(link.external && {
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    })}
                  >
                    {link.label}
                    {link.external && <ExternalLink className="h-3 w-3" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div className="space-y-6 mt-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-primary">
              Community
            </h3>
            <ul className="space-y-4">
              {footerLinks.community.map((link) => {
                const Icon = link.icon
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2.5"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      {link.label}
                    </a>
                  </li>
                )
              })}
            </ul>

            {/* Newsletter */}
            <div className="pt-4 space-y-3">
              <h4 className="font-medium text-sm text-foreground">Stay Updated</h4>
              <a
                href="mailto:info@giveprotocol.xyz"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2.5"
              >
                <Mail className="h-4 w-4" />
                info@giveprotocol.xyz
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Give Protocol. All rights reserved.
          </p>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

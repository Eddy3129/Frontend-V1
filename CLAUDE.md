# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Give Protocol is a decentralized yield donation platform. Users deposit USDC into ERC4626 vaults, yield is generated via Aave V3, and distributed to verified NGO campaigns based on governance voting.

## Commands

```bash
pnpm dev          # Start dev server with Turbopack (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint on src/
pnpm lint:fix     # ESLint with auto-fix
pnpm format       # Prettier format all files
pnpm format:check # Check formatting without writing
```

Pre-commit hook runs `lint-staged` automatically (ESLint + Prettier on staged files).

<use_interesting_fonts>
Typography instantly signals quality. Avoid using boring, generic fonts.

Never use: Inter, Roboto, Open Sans, Lato, default system fonts

Here are some examples of good, impactful choices:

- Code aesthetic: JetBrains Mono, Fira Code, Space Grotesk
- Editorial: Playfair Display, Crimson Pro
- Technical: IBM Plex family, Source Sans 3
- Distinctive: Bricolage Grotesque, Newsreader

Pairing principle: High contrast = interesting. Display + monospace, serif + geometric sans, variable font across weights.

Use extremes: 100/200 weight vs 800/900, not 400 vs 600. Size jumps of 3x+, not 1.5x.

Pick one distinctive font, use it decisively. Load from Google Fonts.
</use_interesting_fonts>

<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design,this creates what users call the "AI slop" aesthetic. Avoid this: make creative,distinctive frontends that surprise and delight.

Focus on:

- Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.
- Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.
- Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.
- Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:

- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>

## Architecture

### Provider Stack (src/app/providers.tsx)

Wraps app in: `WagmiProvider` → `QueryClientProvider` → `ThemeProvider`

### Web3 Configuration

- **Chains**: Base Sepolia (84532), Ethereum Sepolia (11155111) - defined in `src/config/chains.ts`
- **Contract addresses**: `src/config/contracts.ts` - exports `getContracts(chainId)` helper
- **Wagmi config**: `src/config/wagmi.ts` - SSR-enabled with cookie storage

### Custom Hooks (src/hooks/)

Domain-specific hooks wrapping Wagmi's `useReadContract`/`useWriteContract`:

- `useVault` - ERC4626 vault deposit/withdraw
- `useCampaign` - Campaign registry interactions, checkpoint management
- `useNGO` - NGO registration and verification
- `usePayout` - Donation allocation preferences
- `useAaveAPY` - Fetches APY from Aave data provider

### API Routes (src/app/api/)

Server-side routes for Pinata IPFS uploads (campaign metadata, images, NGO docs). Pinata JWT is server-only.

### Contract ABIs

Located in `src/lib/abi/` as JSON files. Imported via `src/lib/abi/index.ts`.

## Key Patterns

### Path Alias

`@/*` maps to `./src/*` (e.g., `import { Button } from '@/components/ui/button'`)

### Page Structure

Each route uses server component (`page.tsx`) + client component (`*-client.tsx`) pattern for SSR hydration.

### Contract Address Lookup

```typescript
import { getContracts } from '@/config/contracts'
const contracts = getContracts(chainId)
// contracts.usdcVault, contracts.campaignRegistry, etc.
```

### Aave Integration

Uses `@bgd-labs/aave-address-book` for Aave V3 addresses. Strategy adapters deposit into Aave pools.

## UI Components

- Radix UI primitives in `src/components/ui/`
- Brand CSS utilities in `src/app/globals.css`: `.gradient-give`, `.glow-give`, `.btn-brand`, `.stat-card`
- Tailwind CSS 4 with PostCSS

## Multi-Chain Support

Contracts are deployed on both Base Sepolia and Ethereum Sepolia with different addresses. Always use `getContracts(chainId)` rather than hardcoding addresses.

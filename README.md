# Give Protocol V1 Frontend

A decentralized yield donation platform built on Next.js 16, enabling transparent charitable giving through DeFi yield strategies.

![Give Protocol](public/give-logo.svg)

## 🌟 Overview

Give Protocol allows donors to deposit stablecoins (USDC) into yield-generating vaults. The yield earned from DeFi strategies is then distributed to verified NGO campaigns based on community governance voting.

### Key Features

- **Yield-Based Donations**: Deposit USDC to earn yield, which gets donated to campaigns
- **Verified NGOs**: Only vetted organizations can create campaigns
- **Community Governance**: Token holders vote on campaign checkpoint milestones
- **Transparent Tracking**: All donations and payouts are verifiable on-chain
- **Multi-Chain Support**: Deployed on Base Sepolia and Ethereum Sepolia testnets

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  Wagmi v3 + Viem  │  React Query  │  Tailwind CSS 4  │  Pinata  │
├─────────────────────────────────────────────────────────────────┤
│                     Smart Contracts (Solidity)                   │
├───────────────┬───────────────┬───────────────┬─────────────────┤
│  GiveVault    │  Campaign     │  Payout       │  Strategy       │
│  (ERC4626)    │  Registry     │  Router       │  Manager        │
├───────────────┴───────────────┴───────────────┴─────────────────┤
│                     DeFi Integrations (Aave)                     │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Tech Stack

| Category      | Technology      | Version  |
| ------------- | --------------- | -------- |
| Framework     | Next.js         | 16.0.7   |
| Runtime       | React           | 19.2.1   |
| Web3          | Wagmi           | 3.1.0    |
| Web3          | Viem            | 2.41.2   |
| Styling       | Tailwind CSS    | 4.1.17   |
| State         | TanStack Query  | 5.90.11  |
| Storage       | Pinata IPFS     | 2.5.1    |
| UI Components | Radix UI        | Latest   |
| Forms         | React Hook Form | 7.68.0   |
| Build         | Turbopack       | Built-in |

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (Pinata uploads)
│   │   └── upload/
│   │       ├── campaign/  # Campaign metadata upload
│   │       └── image/     # Image upload
│   ├── campaigns/         # Campaign pages
│   │   └── [id]/         # Dynamic campaign detail
│   ├── ngos/             # NGO listing
│   ├── stake/            # Staking/Vault interface
│   ├── globals.css       # Global styles & CSS utilities
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Homepage
│   └── providers.tsx     # React Query + Wagmi providers
│
├── components/
│   ├── campaigns/        # Campaign-related components
│   ├── layout/           # Navigation, Footer
│   ├── payout/           # Donation preference
│   ├── ui/               # Radix-based UI primitives
│   ├── vault/            # Vault interaction
│   ├── voting/           # Checkpoint voting
│   └── wallet/           # Wallet connection
│
├── config/
│   ├── chains.ts         # Chain definitions (Base, Ethereum Sepolia)
│   ├── contracts.ts      # Contract addresses per chain
│   └── wagmi.ts          # Wagmi configuration
│
├── hooks/
│   ├── index.ts          # Hook exports
│   ├── useCampaign.ts    # Campaign interactions
│   ├── useNGO.ts         # NGO registry hooks
│   ├── usePayout.ts      # Payout router hooks
│   └── useVault.ts       # Vault deposit/withdraw
│
└── lib/
    ├── abi/              # Contract ABIs
    ├── pinata.ts         # IPFS utilities
    └── utils.ts          # Helper functions
```

## 🛠️ Installation

### Prerequisites

- Node.js 20+ (LTS recommended)
- pnpm 9+ (recommended) or npm/yarn
- Git

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/give-protocol-v1-frontend.git
   cd give-protocol-v1-frontend
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` with your values (see [Environment Variables](#-environment-variables))

4. **Run development server**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# ============================================
# RPC ENDPOINTS
# ============================================
# Base Sepolia RPC URL (required for Base network)
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org

# Ethereum Sepolia RPC URL (required for Ethereum testnet)
NEXT_PUBLIC_ETH_SEPOLIA_RPC=https://rpc.sepolia.org

# ============================================
# PINATA IPFS (required for metadata storage)
# ============================================
# Get your JWT from https://app.pinata.cloud/developers/api-keys
PINATA_JWT=your_pinata_jwt_here

# Your Pinata dedicated gateway (e.g., your-gateway.mypinata.cloud)
NEXT_PUBLIC_PINATA_GATEWAY=your-gateway.mypinata.cloud

# ============================================
# CONTRACT ADDRESSES - BASE SEPOLIA
# Deployed contract addresses
# ============================================
# Core Protocol
NEXT_PUBLIC_ACL_MANAGER_BASE=0xB4f6BD99006028fAC7d13648A1963CbFe3b492Ec
NEXT_PUBLIC_GIVE_PROTOCOL_CORE_BASE=0x046b1B8B379C6ED5b5Ca25c8dD76d1D4C844edad

# Registries
NEXT_PUBLIC_STRATEGY_REGISTRY_BASE=0x804Ef3Ac8bB498A17B704a0cC9049691a7c74218
NEXT_PUBLIC_CAMPAIGN_REGISTRY_BASE=0xFa0A22b22c76235002C42e4dFbDa7dce57c37b48
NEXT_PUBLIC_NGO_REGISTRY_BASE=0xFC00A79E62890C0a55de68B327DaF07416C453b0

# Vaults & Routing (Not deployed yet - update when available)
NEXT_PUBLIC_GIVE_VAULT_BASE=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_CAMPAIGN_VAULT_FACTORY_BASE=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_PAYOUT_ROUTER_BASE=0x2A51D4F29eFb43E3Fce8D9a0325cf78EA512DF7f

# Strategies (Not deployed yet - update when available)
NEXT_PUBLIC_STRATEGY_MANAGER_BASE=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_AAVE_ADAPTER_BASE=0x0000000000000000000000000000000000000000

# ============================================
# OPTIONAL: ANALYTICS & MONITORING
# ============================================
# NEXT_PUBLIC_GOOGLE_ANALYTICS=G-XXXXXXXXXX
# NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

### Getting API Keys

| Service        | How to Get                                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pinata JWT** | Sign up at [pinata.cloud](https://app.pinata.cloud), go to API Keys, create new key with `pinFileToIPFS` and `pinJSONToIPFS` permissions            |
| **RPC URLs**   | Use default public RPCs or get private ones from [Alchemy](https://alchemy.com), [Infura](https://infura.io), or [QuickNode](https://quicknode.com) |

## 📜 Available Scripts

| Command      | Description                             |
| ------------ | --------------------------------------- |
| `pnpm dev`   | Start development server with Turbopack |
| `pnpm build` | Create production build                 |
| `pnpm start` | Start production server                 |
| `pnpm lint`  | Run ESLint on source files              |

## 🔗 Smart Contract Addresses

### Base Sepolia (Chain ID: 84532)

#### Give Protocol Contracts

| Contract             | Address                                      | Status      |
| -------------------- | -------------------------------------------- | ----------- |
| ACLManager           | `0xB4f6BD99006028fAC7d13648A1963CbFe3b492Ec` | ✅ Deployed |
| GiveProtocolCore     | `0x046b1B8B379C6ED5b5Ca25c8dD76d1D4C844edad` | ✅ Deployed |
| CampaignRegistry     | `0xFa0A22b22c76235002C42e4dFbDa7dce57c37b48` | ✅ Deployed |
| NGORegistry          | `0xFC00A79E62890C0a55de68B327DaF07416C453b0` | ✅ Deployed |
| StrategyRegistry     | `0x804Ef3Ac8bB498A17B704a0cC9049691a7c74218` | ✅ Deployed |
| PayoutRouter         | `0x2A51D4F29eFb43E3Fce8D9a0325cf78EA512DF7f` | ✅ Deployed |
| USDCVault            | `0x05D65f4b7D95216238cc9635cBC7ce053b605f4c` | ✅ Deployed |
| CampaignVaultFactory | `0xF84dbccD95bA6DDc9c4a6054A948E4cd4915900D` | ✅ Deployed |
| USDCStrategyManager  | `0x6Ab841aa62525f68604697921c44feDfd2341459` | ✅ Deployed |
| AaveUSDCAdapter      | `0x943D2819E1C87C4023661487ecB2779A2cb3754e` | ✅ Deployed |

#### External Contracts (from Aave Address Book)

| Contract  | Address                                      |
| --------- | -------------------------------------------- |
| USDC      | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| WETH      | `0x4200000000000000000000000000000000000006` |
| Aave Pool | `0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b` |
| aUSDC     | `0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB` |

### Ethereum Sepolia (Chain ID: 11155111)

#### Give Protocol Contracts

| Contract             | Address                                                              | Status      |
| -------------------- | -------------------------------------------------------------------- | ----------- |
| ACLManager           | `0x9C56468651D1601a7Bebc901564E82444a251AfE`                         | ✅ Deployed |
| GiveProtocolCore     | `0x13182dE484BE4df0DaC262509fa1A55c3B258F64`                         | ✅ Deployed |
| CampaignRegistry     | `0xB4f6BD99006028fAC7d13648A1963CbFe3b492Ec`                         | ✅ Deployed |
| NGORegistry          | `0x046b1B8B379C6ED5b5Ca25c8dD76d1D4C844edad`                         | ✅ Deployed |
| StrategyRegistry     | `0xa63D4A491B495Dc80e163fCcec73E2c7c3e983d4`                         | ✅ Deployed |
| PayoutRouter         | `0x804Ef3Ac8bB498A17B704a0cC9049691a7c74218`                         | ✅ Deployed |
| USDCVault            | `0xEAB952557cC34cD2D4711EafAe3122BC6DB665B4`                         | ✅ Deployed |
| ETHVault             | `0x6460A5FE7dd7673Ab78273DBfeF564f909643309`                         | ✅ Deployed |
| CampaignVaultFactory | `0x36001dc36977852E5BD860F1fc5C9446ddbf2b4c`                         | ✅ Deployed |
| USDCStrategyManager  | `0xB501221e3c3766D850Fa13103C236E571ac1685B`                         | ✅ Deployed |
| ETHStrategyManager   | `0x5B20450Af03a5A348753e7B1f0828E0af6041540`                         | ✅ Deployed |
| AaveUSDCAdapter      | `0x2B0B7390B914133eb1e7c8126c61a8A506D7751e`                         | ✅ Deployed |
| AaveETHAdapter       | `0x097F34A0E411025B5798A291dd0d36F96adDA331`                         | ✅ Deployed |
| AaveETHStrategyId    | `0xf652ab2d7840bae82cb8fb1b886de339d4b690cf5f62560a68ec11d0ad4fd3e4` | ✅ Deployed |

#### External Contracts (from Aave Address Book)

| Contract  | Address                                      |
| --------- | -------------------------------------------- |
| USDC      | `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8` |
| WETH      | `0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c` |
| Aave Pool | `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951` |
| aUSDC     | `0x16dA4541aD1807f4443d92D26044C1147406EB80` |

## 🎨 Styling

This project uses **Tailwind CSS 4** with custom utility classes defined in `src/app/globals.css`:

### Brand Colors

- Primary: `#14b8a6` (Teal) → `#2dd4bf` (Cyan)
- Background: `#0d2318` (Dark Green)
- Card: `#122e1f` (Lighter Dark Green)

### Reusable CSS Classes

```css
/* Gradients */
.gradient-give        /* Primary gradient */
/* Primary gradient */
.text-gradient-give   /* Text with gradient */

/* Glow Effects */
.glow-give           /* Standard glow */
.glow-give-lg        /* Large glow */

/* Icon Boxes */
.icon-box-brand      /* Gradient icon container */
.icon-box-brand-xl   /* Extra large variant */

/* Cards */
.stat-card           /* Statistics card */
.card-highlight      /* Highlighted card */
.card-elevated       /* Elevated card with backdrop */

/* Layout */
.section-spacing     /* Section vertical spacing */
.page-header         /* Page header container */
.page-title          /* Page title text */
.btn-brand /* Primary CTA button */
```

## 🌐 Supported Networks

| Network          | Chain ID | Status | Explorer                                     |
| ---------------- | -------- | ------ | -------------------------------------------- |
| Base Sepolia     | 84532    | Active | [basescan.org](https://sepolia.basescan.org) |
| Ethereum Sepolia | 11155111 | Coming | [etherscan.io](https://sepolia.etherscan.io) |

## 🔒 Security

- **Wallet Connection**: Uses secure injected wallet connectors via Wagmi v3
- **Server-Side Secrets**: Pinata JWT is only exposed to server-side API routes
- **Input Validation**: All form inputs are validated using React Hook Form
- **Type Safety**: Full TypeScript coverage with strict mode enabled

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Give Protocol Website](https://giveprotocol.io)
- [Documentation](https://docs.giveprotocol.io)
- [Smart Contracts Repo](https://github.com/your-org/give-protocol-v1-contracts)

---

Built with ❤️ by the Give Protocol Team

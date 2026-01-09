# create-lightning-scaffold

CLI to scaffold projects with LazorKit SDK integration. Generate React Native (Expo) or Next.js projects with passkey authentication, gasless transactions, and biometric onboarding built-in.

## Quick Start

```bash
npx create-lightning-scaffold
```

## Features

- 🚀 **5 Presets**: Mobile App, Web App, Full-Stack Mobile, Full-Stack Web, Monorepo
- 🔐 **LazorKit SDK**: Passkey auth, gasless transactions, smart wallets
- 📱 **React Native + Expo**: Official `create-expo-app` under the hood
- 🌐 **Next.js**: Official `create-next-app` under the hood
- 🎨 **Styling**: TailwindCSS (web) / NativeWind (mobile)
- 📦 **State**: Zustand or Redux Toolkit
- 🗄️ **Backend**: Supabase or Firebase integration
- 📦 **Package Managers**: npm, pnpm, yarn, bun

## Included Examples

Every generated project includes 3 working LazorKit examples:

1. **Passkey Login** - WebAuthn-based authentication with smart wallet
2. **Gasless Transfer** - Send SOL without paying gas fees
3. **Biometric Onboarding** - Mobile-first onboarding with FaceID/TouchID

## Usage

```bash
# Interactive mode
npx create-lightning-scaffold

# You'll be prompted for:
# - Project name
# - Preset (Mobile, Web, Full-Stack, Monorepo)
# - Customization options (styling, state, components, backend)
# - Package manager
```

## Presets

| Preset | Description | Structure |
|--------|-------------|-----------|
| Mobile App | React Native + Expo | Flat |
| Web App | Next.js | Flat |
| Full-Stack Mobile | React Native + Backend | Monorepo |
| Full-Stack Web | Next.js + Backend | Monorepo |
| Monorepo | Mobile + Web + Backend | Monorepo |

## Configuration

After scaffolding, copy `.env.example` to `.env` and add your LazorKit API key:

```bash
cp .env.example .env
```

Get your API key from [portal.lazor.sh](https://portal.lazor.sh).

## License

MIT

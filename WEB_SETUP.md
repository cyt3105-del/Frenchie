# Running Frenchie as a Website

## Prerequisites

1. **Install Node.js** (if not already installed):
   ```bash
   # Using Homebrew (macOS)
   brew install node
   
   # Or download from https://nodejs.org
   ```

2. **Install pnpm** (recommended) or use npm:
   ```bash
   npm install -g pnpm
   ```

## Quick Start

### Option 1: Using the startup script
```bash
./start-web.sh
```

### Option 2: Manual steps

1. **Install dependencies:**
   ```bash
   pnpm install
   # or: npm install
   ```

2. **Start the development server:**
   ```bash
   pnpm dev
   # or: npm run dev
   ```

3. **Open in browser:**
   - The app will automatically open at `http://localhost:8081`
   - Or manually navigate to that URL

## What Gets Started

The `dev` command starts two servers:
- **Backend server** (tRPC): Runs on port 3000 (or PORT env var)
- **Metro bundler** (Expo web): Runs on port 8081 (or EXPO_PORT env var)

The web app will be available at `http://localhost:8081`

## Building for Production

To create a static website build:

```bash
npx expo export:web
```

The static files will be in the `web-build/` directory.

## Troubleshooting

- **Port already in use?** Set a different port:
  ```bash
  EXPO_PORT=3001 pnpm dev
  ```

- **Dependencies issues?** Clear and reinstall:
  ```bash
  rm -rf node_modules
  pnpm install
  ```







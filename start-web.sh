#!/bin/bash
# Startup script for Frenchie web app

echo "🚀 Starting Frenchie web app..."
echo ""

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo ""
    echo "Please install Node.js first:"
    echo "  - Visit https://nodejs.org to download"
    echo "  - Or use Homebrew: brew install node"
    echo ""
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    if command -v pnpm &> /dev/null; then
        pnpm install
    elif command -v yarn &> /dev/null; then
        yarn install
    else
        npm install
    fi
    echo ""
fi

echo "🌐 Starting development server..."
echo "The app will be available at http://localhost:8081"
echo ""

# Start the dev server
if command -v pnpm &> /dev/null; then
    pnpm dev
elif command -v yarn &> /dev/null; then
    yarn dev
else
    npm run dev
fi







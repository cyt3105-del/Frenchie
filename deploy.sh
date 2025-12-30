#!/bin/bash

echo "🚀 Deploying Frenchie App to Vercel..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not installed. Install with:"
    echo "npm install -g vercel"
    exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Run:"
    echo "vercel login"
    exit 1
fi

# Build the app
echo "📦 Building app..."
npm run build:web

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "✅ Build complete!"
echo ""

# Deploy
echo "🌐 Deploying to Vercel..."
vercel --prod --yes

echo ""
echo "✅ Deployment complete! Check your Vercel dashboard for the URL."
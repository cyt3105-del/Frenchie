#!/bin/bash

# Vercel Deployment Script for Frenchie App
# This script builds the web app and deploys it to Vercel

echo "🚀 Deploying Frenchie App to Vercel..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed"
    echo ""
    echo "Install it with:"
    echo "  npm install -g vercel"
    echo "  # or"
    echo "  pnpm add -g vercel"
    echo ""
    exit 1
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel"
    echo ""
    echo "Login with:"
    echo "  vercel login"
    echo ""
    exit 1
fi

# Build the web app
echo "📦 Building web app..."
if command -v pnpm &> /dev/null; then
    pnpm run build:web
elif command -v yarn &> /dev/null; then
    yarn build:web
else
    npm run build:web
fi

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "✅ Build completed"
echo ""

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
echo ""

# Check if this is the first deployment or an existing project
if [ -f ".vercel/project.json" ]; then
    echo "📤 Deploying to existing Vercel project..."
    vercel --prod
else
    echo "📤 Creating new Vercel project..."
    vercel --prod

    echo ""
    echo "🎯 To set up automatic deployments:"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Find your project"
    echo "3. Go to Settings → Git"
    echo "4. Connect your GitHub repository"
    echo "5. Enable automatic deployments"
    echo ""
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your app will be available at the URL shown above."
echo "Share this URL with your friends! 🎉"

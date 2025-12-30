# Deploying Frenchie App for Your Friends

Your app is now deployed to GitHub Pages! Here's how it works and how to update it:

## Current Deployment: GitHub Pages (Free & Automatic)

Your app is live at: **https://cyt3105-del.github.io/Frenchie**

### How It Works:
- The app automatically builds and deploys when you push changes to GitHub
- No server needed - it's a pure static client-side app
- Uses your vocabulary data stored directly in the code

### To Update the App:

1. **Make your changes** to the code locally

2. **Build for production:**
   ```bash
   npm run build:web
   ```

3. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```

4. **That's it!** GitHub Actions will automatically build and deploy your changes

## Other Sharing Options (If Needed)

## Option 1: Quick Share with ngrok (Temporary)

For quick testing/sharing without deployment:

1. **Install ngrok:**
   ```bash
   brew install ngrok
   # Or download from https://ngrok.com
   ```

2. **Start your dev server:**
   ```bash
   npm run dev
   ```

3. **Create a tunnel:**
   ```bash
   ngrok http 8081
   ```

4. **Share the ngrok URL** (e.g., `https://abc123.ngrok.io`)
   - Note: Free ngrok URLs change each time you restart

## Option 2: Local Network Sharing (Same WiFi)

If you're all on the same WiFi network:

1. **Find your local IP:**
   ```bash
   # macOS
   ipconfig getifaddr en0

   # Or check System Settings → Network
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Share the URL:** `http://YOUR_IP:8081`
   - Example: `http://192.168.1.100:8081`

## Option 5: Local Network Sharing (Same WiFi)

If you're all on the same WiFi network:

1. **Find your local IP:**
   ```bash
   # macOS
   ipconfig getifaddr en0
   
   # Or check System Settings → Network
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Share the URL:** `http://YOUR_IP:8081`
   - Example: `http://192.168.1.100:8081`

## Recommended: Vercel Deployment Script

I'll create a simple deployment script for you!






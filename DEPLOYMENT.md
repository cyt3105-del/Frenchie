# Deploying Frenchie App for Your Friends

There are several ways to share your app with friends. Here are the best options:

## Option 1: Deploy to Vercel (Recommended - Free & Easy)

Vercel is the easiest way to deploy and share your app. It's free and automatically updates when you push changes.

### Quick Deploy (Recommended):

Use the included deployment script:

```bash
# Install Vercel CLI (one time)
npm install -g vercel

# Login to Vercel (one time)
vercel login

# Deploy with automatic setup
./deploy-vercel.sh
```

### Manual Steps (Alternative):

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   ./deploy-vercel.sh
   ```

   Or manually:
   ```bash
   npm run build:web
   vercel --prod
   ```

4. **Share the URL:**
   - Vercel will give you a URL like: `https://frenchie-app.vercel.app`
   - Share this URL with your friends!

5. **For automatic updates:**
   - Connect your GitHub repo to Vercel in the dashboard
   - Every time you push changes, it auto-deploys

## Option 2: Deploy to Netlify (Also Free & Easy)

1. **Build the static website:**
   ```bash
   npx expo export:web
   ```

2. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

3. **Deploy:**
   ```bash
   cd dist
   netlify deploy --prod
   ```

4. **Share the URL** that Netlify provides

## Option 3: Quick Share with ngrok (Temporary)

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

## Option 4: GitHub Pages (Free Static Hosting)

1. **Build the static website:**
   ```bash
   npx expo export:web
   ```

2. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

3. **Enable GitHub Pages:**
   - Go to your repo → Settings → Pages
   - Source: Deploy from branch
   - Branch: main, folder: `/dist`
   - Save

4. **Share the URL:** `https://yourusername.github.io/frenchie-app`

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






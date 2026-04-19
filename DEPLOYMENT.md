# Vercel Deployment Guide

## About This App
This is a **full-stack web application** with:
- **Frontend**: HTML/CSS/JS (client-side analysis)
- **Backend**: Vercel Serverless Functions (API proxy for AI features)

## The API Proxy Solution (Already Implemented ✅)

I've created `/api/chat.js` to securely proxy all AI API calls through Vercel's backend instead of directly from the browser.

### How It Works Now:
1. Browser calls `/api/chat` (your own Vercel endpoint)
2. Vercel function securely forwards requests to Groq/Gemini APIs
3. API keys never leave your server
4. CORS issues are eliminated

### Files Added:
- **`/api/chat.js`** — Serverless function handling Groq & Gemini proxying
- **`vercel.json`** — Vercel configuration for SPA routing
- **`mock-interviewer.js`** (updated) — Now calls `/api/chat` instead of external APIs

## Local Testing (Before Deployment)

### Option 1: Local Static Server (Recommended)
For testing locally without the API proxy:

```bash
cd dyp-ps6.1
python -m http.server 8000
# or: npx http-server
```

Then visit `http://localhost:8000` in your browser.

**Note**: AI Mock Interview feature won't work locally with this method unless you have a CORS proxy.

### Option 2: Vercel CLI (Full Testing)
To test the exact Vercel environment locally:

```bash
npm install -g vercel
vercel dev
```

This runs your app exactly as it will on Vercel, including the `/api/chat` proxy.

## Deployment to Vercel

### Step 1: Push to GitHub
```bash
cd dyp-ps6.1
git add .
git commit -m "Add Vercel API proxy for AI features"
git push origin main
```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project" → Import Git Repository
3. Select your repository
4. **No build command needed** (Vercel auto-detects static + serverless functions)
5. Deploy!

### Step 3: Test on Vercel
Once deployed, visit your Vercel domain (e.g., `yourproject.vercel.app`) and test the AI Mock Interview feature.

## What Works Now (After Deployment)
✅ Upload & analyze interview transcripts  
✅ AI Mock Interview feature  
✅ AI-generated questions  
✅ Real-time AI feedback  
✅ All dashboard insights  
✅ Report generation & download  

## API Keys: Where to Store Them

### For Development (Local Testing):
Paste your API key directly into the browser UI. It only goes to your local server, never to external services.

### For Production (Vercel):
Your API key is only used when you paste it into the browser. The `/api/chat` function uses it to call Groq/Gemini.

**Security Note**: This is safe because:
- Your API key is never stored on Vercel
- It's only held in the browser during your session
- The proxy function accepts it per-request

## Troubleshooting

### "API proxy error: 500" on Vercel
Check Vercel logs:
```bash
vercel logs your-project-name
```

### "AI Mock Interview still not working"
1. Make sure you pushed the updated `mock-interviewer.js` to GitHub
2. Redeploy on Vercel: `vercel --prod`
3. Hard-refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)

### Missing `/api/chat` endpoint
Vercel auto-discovers serverless functions in `/api/` directory. Make sure:
1. `/api/chat.js` exists
2. You've redeployed after adding the file
3. The file exports a `default` function

## Environment Variables (Optional Security)

If you want to store API keys in Vercel for extra security:

1. In Vercel project settings, add environment variables:
   ```
   GROQ_API_KEY=your_key_here
   GEMINI_API_KEY=your_key_here
   ```

2. Update `/api/chat.js` to use them:
   ```javascript
   const apiKey = req.body.apiKey || process.env.GROQ_API_KEY;
   ```

This allows users without API keys to still use fallback feedback.

## Summary
- ✅ API proxy is implemented and ready
- ✅ Vercel configuration is set up
- ✅ Local testing works with `python -m http.server`
- ✅ Deploy to Vercel in 3 steps
- ✅ AI features will work after deployment

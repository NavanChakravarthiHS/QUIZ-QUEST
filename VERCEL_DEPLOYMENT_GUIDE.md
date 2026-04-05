# 🚀 Vercel Deployment Guide

## Overview

This project uses a **multi-service architecture** on Vercel:
- **Backend API**: Serverless functions (`api/index.js`)
- **Frontend**: Static site (React + Vite)

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

Add these to **Vercel Dashboard → Settings → Environment Variables**:

```env
MONGODB_URI=mongodb+srv://chakravarthi1307_db_user:$ncquiz%40307@cluster0.3wx7fia.mongodb.net/quiz-platform?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30

NODE_ENV=production
```

✅ Set for: **Production**, **Preview**, and **Development** environments

---

### 2. MongoDB Atlas Configuration

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click **"Network Access"** (left sidebar)
3. Ensure `0.0.0.0/0` is added (Allow from Anywhere)
4. Status should show **Active** (green checkmark)

---

### 3. Git Repository

Ensure your code is pushed to GitHub/GitLab/Bitbucket:

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push
```

---

## 🎯 Deploy to Vercel

### Option 1: Automatic Deployment (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Vercel will auto-detect the configuration from `vercel.json`
5. Add environment variables (see above)
6. Click **"Deploy"**

### Option 2: Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## 🔧 How It Works

### Build Process

```
1. Install Dependencies
   ├─ npm install (root)
   ├─ npm install --prefix backend
   └─ cd frontend && npm install

2. Build Frontend
   └─ cd frontend && npx vite build
      └─ Output: frontend/dist/

3. Deploy
   ├─ API: api/index.js → Serverless function
   └─ Frontend: frontend/dist/ → Static files
```

### Request Routing

```
User Request
    │
    ├─ /api/* → api/index.js (Backend API)
    │           ├─ /api/auth/login
    │           ├─ /api/quizzes
    │           └─ /api/admin/*
    │
    └─ /* → Frontend (React SPA)
            ├─ / → index.html
            ├─ /login → index.html
            └─ /dashboard → index.html
```

---

## 📊 vercel.json Configuration

### Builds Section

Defines what gets built:

```json
"builds": [
  {
    "src": "api/index.js",        // Backend API
    "use": "@vercel/node"          // Node.js runtime
  },
  {
    "src": "frontend/package.json", // Frontend
    "use": "@vercel/static-build",  // Static site builder
    "config": {
      "distDir": "dist"            // Build output directory
    }
  }
]
```

### Routes Section

Defines URL routing:

```json
"routes": [
  {
    "src": "/api/(.*)",           // All API requests
    "dest": "/api/index.js"       // → Backend function
  },
  {
    "src": "/assets/(.*)",        // Static assets
    "headers": { 
      "cache-control": "public, max-age=31536000, immutable" 
    },
    "continue": true              // Continue to next route
  },
  {
    "src": "/(.*)",               // All other routes
    "dest": "/index.html"         // → React SPA (client-side routing)
  }
]
```

### Functions Section

Configures serverless function settings:

```json
"functions": {
  "api/index.js": {
    "maxDuration": 10,    // Max execution time (seconds)
    "memory": 1024        // Memory allocation (MB)
  }
}
```

---

## ✅ Post-Deployment Testing

### 1. Test Health Endpoint

Visit: `https://your-domain.vercel.app/api/health`

Expected response:
```json
{
  "status": "OK",
  "message": "Quiz Platform Backend is running"
}
```

### 2. Test Login

1. Visit your deployed URL
2. Try logging in with existing credentials
3. Should redirect to dashboard without errors

### 3. Check Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click **"Deployments"** tab
3. Click latest deployment
4. Click **"Functions"** tab
5. View logs for `/api/index.js`

---

## 🐛 Troubleshooting

### Issue: 500 Error on API Calls

**Cause:** Missing environment variables

**Fix:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`
3. Redeploy (click three dots → Redeploy)

---

### Issue: Build Fails

**Cause:** Dependency installation error

**Fix:**
1. Check build logs in Vercel Dashboard
2. Ensure all dependencies are in `package.json` files
3. Verify `installCommand` in `vercel.json` is correct

---

### Issue: Frontend Can't Connect to API

**Cause:** Wrong API URL or routing issue

**Fix:**
1. Frontend uses relative paths (`/api/*`)
2. No need for `VITE_API_URL` environment variable
3. Vercel handles routing automatically via `vercel.json`

---

### Issue: MongoDB Connection Timeout

**Cause:** IP not whitelisted in MongoDB Atlas

**Fix:**
1. Add `0.0.0.0/0` to Network Access in MongoDB Atlas
2. Wait 1-2 minutes for activation
3. Redeploy application

---

## 🔄 Updating After Deployment

After making code changes:

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will automatically redeploy!

Or manually trigger redeploy:
1. Vercel Dashboard → Deployments
2. Click three dots (⋮) on latest deployment
3. Click **"Redeploy"**

---

## 📈 Performance Tips

### 1. Enable Edge Caching

Static assets are cached for 1 year:
```json
"headers": { 
  "cache-control": "public, max-age=31536000, immutable" 
}
```

### 2. Optimize Function Memory

Current: 1024 MB (adjust based on usage)
```json
"memory": 1024
```

### 3. Monitor Function Duration

Current: 10 seconds max
```json
"maxDuration": 10
```

Increase if you have long-running operations.

---

## 🎯 Summary

✅ **Multi-service deployment** configured  
✅ **API routes** → Serverless functions  
✅ **Frontend** → Static site with SPA routing  
✅ **Environment variables** → Set in Vercel dashboard  
✅ **MongoDB Atlas** → Whitelist 0.0.0.0/0  
✅ **Auto-deploy** → Push to Git triggers deployment  

---

**Your app is ready for production deployment!** 🚀

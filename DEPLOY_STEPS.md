# 🚀 Deploy to Vercel - Step by Step

## Quick Deployment Guide

### Step 1: Prepare Your Code

```bash
# Make sure everything is committed
git add .
git commit -m "Ready for Vercel deployment"
git push
```

---

### Step 2: Add Environment Variables

Go to **Vercel Dashboard** → Select your project → **Settings** → **Environment Variables**

Add these 3 variables:

#### Variable 1: MONGODB_URI
```
Name: MONGODB_URI
Value: mongodb+srv://chakravarthi1307_db_user:$ncquiz%40307@cluster0.3wx7fia.mongodb.net/quiz-platform?retryWrites=true&w=majority&appName=Cluster0
Environments: ✅ Production  ✅ Preview  ✅ Development
```

#### Variable 2: JWT_SECRET
```
Name: JWT_SECRET
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30
Environments: ✅ Production  ✅ Preview  ✅ Development
```

#### Variable 3: NODE_ENV
```
Name: NODE_ENV
Value: production
Environments: ✅ Production only
```

Click **"Save"** after adding each variable.

---

### Step 3: Configure MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click **"Network Access"** (left sidebar under Security)
3. Click **"+ ADD IP ADDRESS"**
4. Click **"ALLOW ACCESS FROM ANYWHERE"**
5. Click **"Confirm"**
6. Wait 1-2 minutes for status to show **Active** (green checkmark)

---

### Step 4: Deploy

#### Option A: Automatic (Recommended)

If you connected your Git repository to Vercel:
- Vercel will automatically deploy when you push to Git
- Just wait 2-3 minutes for deployment to complete

#### Option B: Manual Redeploy

If you already deployed but need to redeploy with new env vars:

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Find the latest deployment
3. Click the three dots menu (⋮) on the right
4. Click **"Redeploy"**
5. Wait for deployment to complete

#### Option C: First Time Deploy

If this is your first deployment:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub/GitLab/Bitbucket repository
4. Vercel will auto-detect `vercel.json` configuration
5. Click **"Deploy"**
6. Add environment variables (Step 2) if not done yet
7. Wait for deployment to complete

---

### Step 5: Verify Deployment

#### Test 1: Health Check

Visit in browser:
```
https://your-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Quiz Platform Backend is running"
}
```

#### Test 2: Login

1. Visit: `https://your-domain.vercel.app`
2. Try logging in with existing credentials
3. Should work without 500 errors

#### Test 3: Check Logs

1. Vercel Dashboard → Deployments → Latest deployment
2. Click **"Functions"** tab
3. View logs for `/api/index.js`
4. Should show no errors

---

## 🎯 That's It!

Your app is now live on Vercel with:
- ✅ Backend API (serverless functions)
- ✅ Frontend (static site)
- ✅ MongoDB Atlas connection
- ✅ All routes working

---

## 🔄 Future Updates

After making code changes:

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will automatically redeploy!

---

## 🐛 Common Issues

### Issue: 500 Error After Deployment

**Cause:** Environment variables not set or MongoDB IP not whitelisted

**Fix:**
1. Verify all 3 env vars are added in Vercel
2. Check MongoDB Atlas has `0.0.0.0/0` in Network Access
3. Redeploy after fixing

### Issue: Build Fails

**Cause:** Dependency installation error

**Fix:**
1. Check build logs in Vercel Dashboard
2. Ensure all dependencies are installed
3. Verify `installCommand` in `vercel.json`

### Issue: Can't Connect to Database

**Cause:** MongoDB Atlas blocking connection

**Fix:**
1. Add `0.0.0.0/0` to Network Access
2. Wait 1-2 minutes
3. Redeploy

---

**Your app is ready to go live!** 🚀

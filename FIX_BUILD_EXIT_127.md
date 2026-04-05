# 🔧 Fix: "npm run build --prefix frontend" Exit Code 127

## Problem
```
Command "npm run build --prefix frontend" exited with 127
```

Exit code 127 means **"command not found"** - Vite isn't available in the PATH.

---

## ✅ Solution Applied

### **Updated `vercel.json`**

**Changes:**

1. **Install Command:**
   ```json
   // Before
   "installCommand": "npm install && npm install --prefix backend && npm install --prefix frontend"
   
   // After
   "installCommand": "npm install && npm install --prefix backend && cd frontend && npm install"
   ```
   - Uses `cd frontend && npm install` to ensure we're in the right directory

2. **Build Command:**
   ```json
   // Before
   "buildCommand": "cd frontend && npm run build"
   
   // After
   "buildCommand": "cd frontend && npx vite build"
   ```
   - Uses `npx vite build` instead of `npm run build`
   - `npx` ensures Vite is found even if not in PATH

---

## 🎯 Why This Works

### **The Problem with `npm run build --prefix frontend`:**
- Runs from root directory
- Tries to execute `vite` command
- Vite is installed in `frontend/node_modules/.bin/`
- Not in the global PATH → **command not found (127)**

### **Why `npx vite build` Works:**
- `npx` looks for executables in `node_modules/.bin/`
- Automatically finds locally installed Vite
- No PATH issues
- More reliable than `npm run`

---

## 🧪 Test Locally

Before deploying, test the exact commands Vercel will run:

```bash
# Clean everything
rm -rf node_modules frontend/node_modules backend/node_modules

# Run the install command
npm install && npm install --prefix backend && cd frontend && npm install

# Run the build command
cd frontend && npx vite build
```

**Expected output:**
```
vite v4.4.9 building for production...
✓ XXX modules transformed.
dist/index.html                  X.XX kB
dist/assets/index-XXXXXX.js    XXX.XX kB
✓ built in X.XXs
```

---

## 🚀 Deploy to Vercel

After local test succeeds:

```bash
git add .
git commit -m "Fix build command - use npx vite build"
git push
```

Vercel will automatically redeploy with the new configuration.

---

## 📋 Alternative Solutions (If Still Failing)

### **Option 1: Simplify Build Configuration**

If the above doesn't work, try removing custom build commands entirely and let Vercel auto-detect:

```json
{
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "outputDirectory": "frontend/dist"
}
```

Remove `installCommand` and `buildCommand` completely. Vercel will:
- Auto-detect `frontend/package.json`
- Run `npm install` in frontend directory
- Run `npm run build` (which calls `vite build`)

---

### **Option 2: Use Root-Level Build Script**

Update root `package.json`:

```json
{
  "scripts": {
    "build": "cd frontend && npx vite build"
  }
}
```

Then in `vercel.json`:
```json
{
  "installCommand": "npm install && npm install --prefix backend && cd frontend && npm install",
  "buildCommand": "npm run build"
}
```

---

### **Option 3: Check Node Version**

Ensure Vercel is using Node 18+:

Add to `vercel.json`:
```json
{
  "functions": {
    "api/index.js": {
      "runtime": "nodejs18.x",
      "maxDuration": 10
    }
  }
}
```

---

## 🔍 Debugging Steps

If build still fails:

### **1. Check Vercel Build Logs**

Go to: Vercel Dashboard → Deployments → Click deployment → Build Logs

Look for:
- Installation errors
- Missing dependencies
- Permission issues

### **2. Verify Frontend Dependencies**

```bash
cd frontend
npm ls vite
# Should show: vite@4.4.9
```

### **3. Check package.json Scripts**

```bash
cat frontend/package.json | grep -A 3 "scripts"
```

Should show:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

### **4. Test with Fresh Install**

```bash
# Remove all node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Reinstall
npm install
npm install --prefix backend
cd frontend && npm install

# Build
cd frontend && npx vite build
```

---

## 📊 What Changed

| Aspect | Before | After | Why |
|--------|--------|-------|-----|
| Install | `npm install --prefix frontend` | `cd frontend && npm install` | Ensures correct directory context |
| Build | `npm run build` | `npx vite build` | Finds Vite reliably |
| Command | Runs from root | Runs from frontend dir | Matches where Vite is installed |

---

## ✅ Expected Vercel Build Output

```
Installing dependencies...
npm install && npm install --prefix backend && cd frontend && npm install
...
added XXX packages in XXs

Running "cd frontend && npx vite build"...
vite v4.4.9 building for production...
transforming (XXX) ...
✓ XXX modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  0.52 kB │ gzip:  0.32 kB
dist/assets/index-abc123.js    234.56 kB │ gzip: 78.90 kB
✓ built in 2.34s

Build completed successfully!
```

---

## 🆘 Common Errors & Solutions

### **Error: "vite: command not found"**
**Solution:** Using `npx vite build` fixes this ✅

### **Error: "Cannot find module 'vite'"**
**Solution:** Ensure `cd frontend && npm install` runs before build

### **Error: "Permission denied"**
**Solution:** Vercel handles permissions automatically, shouldn't occur

### **Error: "Build timeout"**
**Solution:** Increase timeout in vercel.json:
```json
"functions": {
  "api/index.js": {
    "maxDuration": 30
  }
}
```

---

## 🎯 Summary

**Problem:** `npm run build --prefix frontend` couldn't find Vite  
**Root Cause:** Vite not in PATH when running from root directory  
**Solution:** Use `cd frontend && npx vite build`  
**Result:** Build should succeed ✅

---

## 🚀 Next Steps

1. ✅ Commit the updated `vercel.json`
2. ✅ Push to Git
3. ✅ Wait for Vercel to redeploy
4. ✅ Check build logs for success
5. ✅ Test your deployed application

**The build error should be resolved now!** 🎉

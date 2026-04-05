# 🔧 Fix: Vite Build Error on Vercel

## Problem
```
sh: line 1: vite: command not found
Error: Command "npm run build --prefix frontend" exited with 127
```

## Root Cause
Vite wasn't being installed properly because:
1. ❌ Frontend dependencies weren't being installed in the install command
2. ❌ Build command wasn't running from the frontend directory
3. ❌ Circular dependency reference (`quiz-platform: file:..`) was causing issues

---

## ✅ Fixes Applied

### **Fix 1: Updated `vercel.json`**

**Before:**
```json
"installCommand": "npm install && npm install --prefix backend",
"buildCommand": "npm run build",
```

**After:**
```json
"installCommand": "npm install && npm install --prefix backend && npm install --prefix frontend",
"buildCommand": "cd frontend && npm run build",
```

**Why this fixes it:**
- ✅ Now installs frontend dependencies (including Vite)
- ✅ Runs build from the frontend directory where Vite is installed
- ✅ Ensures all devDependencies are available

---

### **Fix 2: Removed Circular Dependency**

**Removed from `frontend/package.json`:**
```json
"quiz-platform": "file:.."
```

**Why this fixes it:**
- ❌ This created a circular dependency
- ❌ Caused installation conflicts
- ✅ Frontend doesn't need to reference the root package

---

## 🧪 Test Locally

Before deploying to Vercel, test the build locally:

```bash
# Clean install
rm -rf node_modules frontend/node_modules backend/node_modules
npm install
npm install --prefix backend
npm install --prefix frontend

# Test build
cd frontend
npm run build

# Should complete successfully and create dist/ folder
```

**Expected output:**
```
✓ built in XXXms
dist/ folder created with optimized files
```

---

## 🚀 Deploy to Vercel

After testing locally:

### **Step 1: Commit Changes**
```bash
git add .
git commit -m "Fix Vite build error - update vercel.json and remove circular dependency"
git push
```

### **Step 2: Redeploy on Vercel**

Vercel will automatically detect the push and redeploy.

Or manually:
1. Go to Vercel Dashboard
2. Click your project
3. Click "Deployments"
4. Click "Redeploy" on latest deployment

---

## 📋 Verification Checklist

After deployment:

- [ ] Build completes without errors
- [ ] No "vite: command not found" error
- [ ] Deployment succeeds
- [ ] Visit your Vercel URL
- [ ] Test login functionality
- [ ] Check browser console for errors

---

## 🔍 If Build Still Fails

### **Check Vercel Build Logs**

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the failed deployment
3. Click "Build Logs" tab
4. Look for specific errors

### **Common Issues & Solutions**

#### **Issue 1: Still can't find Vite**
**Solution:** Ensure `npm install --prefix frontend` is in the install command

#### **Issue 2: Module not found errors**
**Solution:** 
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### **Issue 3: Build timeout**
**Solution:** Increase function timeout in `vercel.json`:
```json
"functions": {
  "api/index.js": {
    "maxDuration": 30
  }
}
```

#### **Issue 4: Out of memory**
**Solution:** Vercel has limited memory for builds. Try:
- Remove unused dependencies
- Optimize images
- Split large components

---

## 📊 What Changed

| File | Change | Impact |
|------|--------|--------|
| `vercel.json` | Added `npm install --prefix frontend` to installCommand | ✅ Installs Vite and frontend deps |
| `vercel.json` | Changed buildCommand to `cd frontend && npm run build` | ✅ Runs build from correct directory |
| `frontend/package.json` | Removed `"quiz-platform": "file:.."` | ✅ Eliminates circular dependency |

---

## ✅ Expected Behavior

**Local Build:**
```bash
$ cd frontend
$ npm run build

vite v4.4.9 building for production...
✓ 123 modules transformed.
dist/index.html                  0.52 kB
dist/assets/index-abc123.js    234.56 kB
✓ built in 2.34s
```

**Vercel Build:**
```
Installing dependencies...
npm install && npm install --prefix backend && npm install --prefix frontend
...
Running "cd frontend && npm run build"...
vite v4.4.9 building for production...
✓ built successfully
Output directory: frontend/dist
Deployment complete!
```

---

## 🎯 Summary

**Problem:** Vite not found during Vercel build  
**Cause:** Frontend dependencies not installed  
**Fix:** Updated install and build commands in vercel.json  
**Result:** Build should now succeed ✅

---

## 🆘 Still Having Issues?

If the build still fails after these changes:

1. **Check Node Version**
   - Vercel uses Node 18+ by default
   - Your `package.json` specifies `"node": ">=18.0.0"` ✅

2. **Verify Dependencies**
   ```bash
   cd frontend
   npm ls vite
   # Should show vite@4.4.9
   ```

3. **Test with Fresh Install**
   ```bash
   rm -rf node_modules frontend/node_modules backend/node_modules
   npm install && npm install --prefix backend && npm install --prefix frontend
   cd frontend && npm run build
   ```

4. **Check Vercel Cache**
   - Sometimes Vercel caches old builds
   - Try redeploying with cache cleared:
     - Go to Settings → Git → Ignored Build Step
     - Add a temporary change to force rebuild

---

**The build error should be fixed now!** 🚀

Commit the changes and redeploy to Vercel.

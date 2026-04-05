# 🔧 Troubleshooting 500 Error on Login

## Problem
```
Failed to load resource: the server responded with a status of 500 ()
API Error: Pe
Login error: Pe
api/auth/login:1 Failed to load resource: the server responded with a status of 500 ()
```

## Root Cause

The 500 error indicates a **server-side error** during login. This is typically caused by:

1. ❌ **MongoDB connection failure** (most common)
2. ❌ **Missing environment variables** in Vercel
3. ❌ **Database authentication error**
4. ❌ **Network/connectivity issues**

---

## ✅ Solution Steps

### Step 1: Check Vercel Environment Variables

Go to your Vercel Dashboard → Project Settings → Environment Variables

**Required Variables:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quiz-platform?retryWrites=true&w=majority
JWT_SECRET=<minimum-32-character-random-string>
NODE_ENV=production
```

**Common Mistakes:**
- ❌ Forgot to add environment variables
- ❌ Typo in variable names (case-sensitive!)
- ❌ Incorrect MongoDB connection string
- ❌ JWT_SECRET too short (must be 32+ characters)

**How to Verify:**
1. Go to Vercel Dashboard
2. Select your project
3. Click "Settings" → "Environment Variables"
4. Ensure all 3 variables are present
5. Redeploy after adding/changing variables

---

### Step 2: Verify MongoDB Atlas Configuration

#### 2.1 Check Connection String

Your `MONGODB_URI` should look like:
```
mongodb+srv://myuser:MyPassword123@cluster0.abc123.mongodb.net/quiz-platform?retryWrites=true&w=majority
```

**Checklist:**
- [ ] Username is correct
- [ ] Password is correct (URL-encoded if contains special chars)
- [ ] Cluster address is correct
- [ ] Database name is `quiz-platform`
- [ ] Query parameters included (`?retryWrites=true&w=majority`)

#### 2.2 Check Network Access

1. Go to MongoDB Atlas Dashboard
2. Click "Network Access" in left sidebar
3. Ensure you have an entry for `0.0.0.0/0` (Allow from Anywhere)
4. If not, click "Add IP Address" → "Allow Access From Anywhere"

**Why?** Vercel uses dynamic IPs, so you must allow all IPs.

#### 2.3 Check Database User

1. Go to "Database Access" in MongoDB Atlas
2. Verify your user exists
3. Check permissions: Should have "Read and write to any database"
4. Try resetting password if unsure

---

### Step 3: Test Database Connection Locally

Create a test file to verify your connection string works:

```javascript
// test-connection.js
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI:', process.env.MONGODB_URI?.substring(0, 30) + '...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ Connection successful!');
    console.log('Database:', mongoose.connection.name);
    
    // Test query
    const User = require('./backend/models/User');
    const count = await User.countDocuments();
    console.log('Users in database:', count);
    
    await mongoose.disconnect();
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
```

Run it:
```bash
node test-connection.js
```

If this fails, your connection string or network access is wrong.

---

### Step 4: Check Vercel Function Logs

1. Go to Vercel Dashboard
2. Click on your deployment
3. Click "Functions" tab
4. Look for errors in the logs

**What to look for:**
```
MongoDB connection error: ...
Error: MONGODB_URI is required for production deployment
Error: JWT_SECRET must be set and at least 32 characters
```

**Common Log Errors:**

| Error Message | Solution |
|--------------|----------|
| `MONGODB_URI is required` | Add MONGODB_URI to Vercel env vars |
| `JWT_SECRET must be set` | Add JWT_SECRET (32+ chars) to Vercel |
| `Authentication failed` | Check MongoDB username/password |
| `connect ECONNREFUSED` | Check Network Access (0.0.0.0/0) |
| `getaddrinfo ENOTFOUND` | Check cluster address in URI |

---

### Step 5: Generate Strong JWT_SECRET

If JWT_SECRET is missing or too short:

```bash
# Generate a secure 64-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add it to Vercel environment variables as `JWT_SECRET`.

---

### Step 6: Redeploy

After fixing environment variables:

1. Go to Vercel Dashboard
2. Click "Deployments"
3. Click "Redeploy" on the latest deployment
4. Wait for deployment to complete
5. Test login again

---

## 🧪 Quick Diagnostic Checklist

Run through this checklist:

### Environment Variables
- [ ] `MONGODB_URI` is set in Vercel
- [ ] `JWT_SECRET` is set (32+ characters)
- [ ] `NODE_ENV` is set to `production`
- [ ] No typos in variable names

### MongoDB Atlas
- [ ] Cluster is running (green status)
- [ ] Database user exists
- [ ] Password is correct
- [ ] Network Access includes `0.0.0.0/0`
- [ ] Connection string tested locally

### Vercel Deployment
- [ ] Latest deployment succeeded
- [ ] Environment variables applied
- [ ] Function logs show no errors
- [ ] Health endpoint works: `/api/health`

---

## 🔍 Debug Mode: Enhanced Error Logging

If you still can't find the issue, temporarily add more logging:

**In `api/index.js`, update the error handler:**

```javascript
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    return next();
  } catch (err) {
    console.error('=== MONGODB CONNECTION ERROR ===');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Code:', err.code);
    console.error('Full Error:', err);
    console.error('MONGODB_URI Set:', !!process.env.MONGODB_URI);
    console.error('NODE_ENV:', process.env.NODE_ENV);
    console.error('==================================');
    
    return res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
```

**In `backend/routes/auth.js`, update login error handling:**

```javascript
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // ... rest of login logic
    
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('==================');
    
    res.status(500).json({ 
      message: 'Error logging in', 
      error: error.message 
    });
  }
});
```

Then check Vercel function logs for detailed error messages.

---

## 📞 Most Common Solutions

### Issue 1: "MONGODB_URI is required"
**Fix:** Add `MONGODB_URI` to Vercel environment variables and redeploy.

### Issue 2: "Authentication failed"
**Fix:** 
1. Check MongoDB Atlas username/password
2. URL-encode special characters in password
3. Reset password in MongoDB Atlas if needed

### Issue 3: "connect ECONNREFUSED" or timeout
**Fix:** 
1. Add `0.0.0.0/0` to MongoDB Atlas Network Access
2. Verify cluster is running
3. Check firewall settings

### Issue 4: "JWT_SECRET must be set"
**Fix:** Generate and add JWT_SECRET (32+ chars) to Vercel environment variables.

---

## ✅ Verification After Fix

Test these endpoints:

1. **Health Check:**
   ```
   GET https://your-domain.vercel.app/api/health
   Expected: {"status":"OK","message":"Quiz Platform Backend is running"}
   ```

2. **Login:**
   ```
   POST https://your-domain.vercel.app/api/auth/login
   Body: {"email":"test@example.com","password":"password123"}
   Expected: 200 OK with token
   ```

3. **Register (if needed):**
   ```
   POST https://your-domain.vercel.app/api/auth/register
   Body: {"name":"Test User","email":"test@example.com","password":"Test@1234","role":"student"}
   Expected: 201 Created with token
   ```

---

## 🎯 Quick Fix Summary

**90% of 500 errors are fixed by:**

1. ✅ Adding correct `MONGODB_URI` to Vercel environment variables
2. ✅ Adding `0.0.0.0/0` to MongoDB Atlas Network Access
3. ✅ Generating and adding strong `JWT_SECRET`
4. ✅ Redeploying after adding environment variables

**Do these 4 steps first!**

---

## 📚 Additional Resources

- [Vercel Environment Variables Guide](https://vercel.com/docs/environment-variables)
- [MongoDB Atlas Connection Guide](https://www.mongodb.com/docs/atlas/driver-connection/)
- [MONGODB_CONFIG.md](./MONGODB_CONFIG.md) - Complete setup guide

---

**Still having issues?** Check the Vercel function logs for the exact error message and share it for more specific help.

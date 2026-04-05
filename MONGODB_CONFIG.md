# 🔧 MongoDB Configuration Guide

This guide explains how to configure MongoDB for both local development and production deployment (Vercel).

---

## 📋 Overview

All MongoDB connection URIs are now configured through environment variables. The application will:
- ✅ Use `MONGODB_URI` from `.env` file or environment variables
- ✅ Fall back to `mongodb://localhost:27017/quiz-platform` only if not set
- ✅ Work seamlessly with MongoDB Atlas for production

---

## 🖥️ Local Development

### Option 1: Using Local MongoDB

**Step 1:** Install MongoDB locally
```bash
# Windows: Download from https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: Follow distro-specific instructions
```

**Step 2:** Start MongoDB service
```bash
# Windows: mongod --dbpath C:\data\db
# Mac/Linux: sudo systemctl start mongod
```

**Step 3:** Create `.env` file in `backend/` directory
```env
MONGODB_URI=mongodb://localhost:27017/quiz-platform
JWT_SECRET=your-local-secret-key
PORT=5005
```

**Step 4:** Start the application
```bash
npm run dev
```

---

### Option 2: Using MongoDB Atlas (Recommended)

**Step 1:** Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)

**Step 2:** Create a cluster (M0 Free Tier)
- Click "Build a Database"
- Choose "FREE" tier (M0)
- Select your region
- Click "Create Cluster"

**Step 3:** Create database user
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username and strong password
5. Set permissions: "Read and write to any database"
6. Click "Add User"

**Step 4:** Configure network access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access From Anywhere" (adds `0.0.0.0/0`)
4. Click "Confirm"

**Step 5:** Get connection string
1. Go to "Database" → Click "Connect"
2. Choose "Connect your application"
3. Copy the connection string (looks like):
   ```
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Add database name: `/quiz-platform`

**Step 6:** Create `.env` file in `backend/` directory
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/quiz-platform?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key
PORT=5005
```

**Step 7:** Start the application
```bash
npm run dev
```

---

## ☁️ Production Deployment (Vercel)

### Step 1: Prepare MongoDB Atlas

Follow **Option 2** above to create MongoDB Atlas cluster.

**Important:** Ensure Network Access includes `0.0.0.0/0` (Allow from Anywhere)

### Step 2: Set Environment Variables in Vercel

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Strong random string (32+ characters) |
| `NODE_ENV` | `production` |

**Example MONGODB_URI:**
```
mongodb+srv://myuser:MySecurePass123@cluster0.abc123.mongodb.net/quiz-platform?retryWrites=true&w=majority
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Deploy

Push your code and Vercel will automatically use the environment variables.

---

## 📝 Files Updated

The following files now properly use `process.env.MONGODB_URI`:

### Backend Scripts
- ✅ `backend/server.js` - Main server
- ✅ `backend/app.js` - Express app (used by Vercel)
- ✅ `backend/checkQuizStatus.js` - Quiz status checker
- ✅ `backend/createAdmin.js` - Admin account creator
- ✅ `backend/testAutoSchedule.js` - Auto-schedule tester
- ✅ `backend/testAccessKeys.js` - Access key tester
- ✅ `backend/testStudentAccess.js` - Student access tester
- ✅ `backend/generateAccessKeys.js` - Access key generator
- ✅ `backend/getQuizAccessKeys.js` - Access key retriever
- ✅ `backend/update-quiz-dates.js` - Date updater
- ✅ `backend/sample-data.js` - Sample data generator

### API Entry Point
- ✅ `api/index.js` - Vercel serverless function entry

All scripts now:
1. Load environment variables using `dotenv.config()`
2. Use `process.env.MONGODB_URI` 
3. Fall back to localhost only if env var is not set

---

## 🔍 Verification

### Test Local Connection

```bash
# Navigate to backend
cd backend

# Run a test script
node checkQuizStatus.js
```

Expected output:
```
Connected to MongoDB
Test quiz found:
...
```

### Test Production Connection (After Deploy)

Visit: `https://your-domain.vercel.app/api/health`

Expected response:
```json
{
  "status": "OK",
  "message": "Quiz Platform Backend is running"
}
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "MongoDB connection error"

**Cause:** Wrong connection string or MongoDB not running

**Solution:**
- Verify `MONGODB_URI` is correct
- For local: Ensure MongoDB service is running
- For Atlas: Check username, password, and cluster status

### Issue 2: "Authentication failed"

**Cause:** Wrong password in connection string

**Solution:**
- Double-check password in `MONGODB_URI`
- Special characters must be URL-encoded
- Example: `p@ssw0rd!` becomes `p%40ssw0rd%21`

### Issue 3: "IP not whitelisted"

**Cause:** MongoDB Atlas blocking your IP

**Solution:**
- Go to Network Access in Atlas
- Add `0.0.0.0/0` to allow all IPs (for Vercel)
- Or add your specific IP address

### Issue 4: Works locally but fails on Vercel

**Cause:** Environment variables not set in Vercel

**Solution:**
- Go to Vercel Dashboard → Project Settings → Environment Variables
- Add `MONGODB_URI`, `JWT_SECRET`, and `NODE_ENV`
- Redeploy after adding variables

---

## 🔒 Security Best Practices

### For Local Development
- ✅ Use `.env` file (already in `.gitignore`)
- ✅ Never commit `.env` to Git
- ✅ Use different `JWT_SECRET` than production

### For Production
- ✅ Use Vercel's encrypted environment variables
- ✅ Generate strong `JWT_SECRET` (32+ characters)
- ✅ Use MongoDB Atlas with proper authentication
- ✅ Enable MongoDB Atlas encryption at rest
- ✅ Regularly rotate secrets

### Password Encoding
If your MongoDB password contains special characters, URL-encode them:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `:` | `%3A` |
| `/` | `%2F` |
| `#` | `%23` |
| `?` | `%3F` |
| `&` | `%26` |
| `=` | `%3D` |
| `+` | `%2B` |
| `$` | `%24` |
| `,` | `%2C` |
| `!` | `%21` |

Example:
```
Password: MyP@ss#w0rd!
Encoded: MyP%40ss%23w0rd%21
```

---

## 📊 Database Name

All configurations use the database name: **`quiz-platform`**

Collections created automatically:
- `users` - User accounts
- `quizzes` - Quiz data
- `attempts` - Quiz attempts
- `questionbanks` - Question bank items

---

## 🔄 Switching Between Local and Production

### To use Local MongoDB:
```env
# backend/.env
MONGODB_URI=mongodb://localhost:27017/quiz-platform
```

### To use MongoDB Atlas (Production):
```env
# backend/.env (local testing)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/quiz-platform?retryWrites=true&w=majority

# OR in Vercel Dashboard (production)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/quiz-platform?retryWrites=true&w=majority
```

---

## ✅ Checklist

Before deploying to production:

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with read/write access
- [ ] Network access configured (`0.0.0.0/0` for Vercel)
- [ ] Connection string tested locally
- [ ] `MONGODB_URI` added to Vercel environment variables
- [ ] `JWT_SECRET` generated and added to Vercel
- [ ] `NODE_ENV=production` set in Vercel
- [ ] Health endpoint tested: `/api/health`
- [ ] Database operations verified

---

## 🆘 Need Help?

- **MongoDB Atlas Docs**: https://www.mongodb.com/docs/atlas/
- **Vercel Environment Variables**: https://vercel.com/docs/environment-variables
- **Project Troubleshooting**: See `TROUBLESHOOTING.md`

---

**All MongoDB connections now properly use environment variables!** 🎉

Your application is ready for both local development and Vercel deployment with MongoDB Atlas.

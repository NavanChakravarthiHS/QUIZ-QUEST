# 🔍 MongoDB URI Format Check

## Your URI:
```
mongodb+srv://ch_db_user:dbpass@cluster0.3wx7fia.mongodb.net/quiz-platform?retryWrites=true&w=majority&appName=Cluster0
```

## ✅ Format Analysis

### **Status: VALID FORMAT** ✅

Your MongoDB URI is **correctly formatted**. Let me break it down:

| Component | Value | Status |
|-----------|-------|--------|
| Protocol | `mongodb+srv://` | ✅ Correct (SRV record) |
| Username | `ch_db_user` | ✅ Valid |
| Password | `dbpass` | ⚠️ Simple but valid |
| Host | `cluster0.3wx7fia.mongodb.net` | ✅ Valid cluster address |
| Database | `quiz-platform` | ✅ Correct |
| Parameters | `retryWrites=true&w=majority&appName=Cluster0` | ✅ Valid |

---

## ⚠️ Potential Issues to Check

### 1. **Password Contains Special Characters?**

If your actual password contains special characters like `@`, `#`, `$`, etc., you need to **URL-encode** them.

**Example:**
```
Password: my@pass#word!
Encoded: my%40pass%23word%21
```

**Common URL Encodings:**
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
| `*` | `%2A` |

**Your password `dbpass` has no special characters, so it's fine.** ✅

---

### 2. **Test the Connection String**

Run this command to verify it works:

```bash
node test-mongodb-connection.js
```

Or create a quick test file:

```javascript
// test-uri.js
const mongoose = require('mongoose');

const uri = 'mongodb+srv://ch_db_user:dbpass@cluster0.3wx7fia.mongodb.net/quiz-platform?retryWrites=true&w=majority&appName=Cluster0';

async function test() {
  try {
    console.log('Testing connection...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connection successful!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

test();
```

---

### 3. **Check MongoDB Atlas Settings**

Even with a correct URI, connection can fail if:

#### ✅ Network Access
- Go to MongoDB Atlas → **Network Access**
- Ensure `0.0.0.0/0` (Allow from Anywhere) is added
- **Required for Vercel** (dynamic IPs)

#### ✅ Database User
- Go to MongoDB Atlas → **Database Access**
- Verify user `ch_db_user` exists
- Check permissions: Should have "Read and write to any database"
- Verify password is `dbpass`

#### ✅ Cluster Status
- Check cluster is running (green status indicator)
- Cluster name matches: `Cluster0`

---

## 🧪 Quick Validation Checklist

- [x] URI format is correct
- [x] No special characters in password (or they're encoded)
- [ ] MongoDB Atlas user `ch_db_user` exists
- [ ] Password is correct (`dbpass`)
- [ ] Network Access includes `0.0.0.0/0`
- [ ] Cluster is running
- [ ] Database name is `quiz-platform`

---

## 🔧 For Vercel Deployment

When adding to Vercel environment variables:

**Variable Name:** `MONGODB_URI`  
**Value:** 
```
mongodb+srv://ch_db_user:dbpass@cluster0.3wx7fia.mongodb.net/quiz-platform?retryWrites=true&w=majority&appName=Cluster0
```

**Important:**
- Copy the **entire** string exactly as shown
- Don't add extra spaces
- Don't add quotes around it
- Vercel will handle the encoding

---

## 🎯 Verdict

**Your URI format is CORRECT** ✅

If you're still getting connection errors, the issue is likely:

1. ❌ Wrong password
2. ❌ User doesn't exist in MongoDB Atlas
3. ❌ Network Access not configured (missing 0.0.0.0/0)
4. ❌ Cluster is paused or not running

---

## 📞 Next Steps

1. **Test locally first:**
   ```bash
   # Add to backend/.env
   MONGODB_URI=mongodb+srv://ch_db_user:dbpass@cluster0.3wx7fia.mongodb.net/quiz-platform?retryWrites=true&w=majority&appName=Cluster0
   
   # Run diagnostic
   node test-mongodb-connection.js
   ```

2. **If it works locally**, add the same URI to Vercel environment variables

3. **If it fails locally**, check:
   - MongoDB Atlas credentials
   - Network Access settings
   - Cluster status

---

**The URI format is perfect. The issue is likely with credentials or network access!** 🔍

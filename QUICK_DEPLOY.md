# 🚀 Quick Deploy Card - QUIZ-QUEST to Vercel

## ⚡ 5-Minute Deployment

### Step 1: Prepare MongoDB Atlas (3 min)
```
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Create free cluster (M0)
3. Database Access → Add New User
4. Network Access → Add IP Address → 0.0.0.0/0 (Allow All)
5. Connect → Drivers → Copy connection string
6. Replace <password> with your user password
7. Replace <dbname> with: quiz-platform
```

### Step 2: Push Code to Git (1 min)
```bash
git init
git add .
git commit -m "Ready for Vercel"
# Push to GitHub/GitLab/Bitbucket
```

### Step 3: Deploy to Vercel (1 min)
```
1. Go to: https://vercel.com/new
2. Import your Git repository
3. Configure Project:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: frontend/dist
   - Install Command: npm install && npm install --prefix backend
4. Environment Variables:
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/quiz-platform?retryWrites=true&w=majority
   JWT_SECRET=super-secret-key-min-32-characters-recommended
   NODE_ENV=production
5. Click Deploy!
```

## ✅ Done!

Your app will be live at: `https://your-project.vercel.app`

---

## 🔧 Local Setup Script (Optional)

Run before deploying to ensure everything is ready:

**Windows:**
```powershell
.\setup-vercel.ps1
```

**Mac/Linux:**
```bash
chmod +x setup-vercel.sh
./setup-vercel.sh
```

---

## 📝 Important Notes

✅ **API Routes**: Available at `/api/*`
- Login: `https://your-domain.vercel.app/api/auth/login`
- Quizzes: `https://your-domain.vercel.app/api/quiz/all`

✅ **Frontend**: Served from root
- Home: `https://your-domain.vercel.app`

✅ **Database**: Must use MongoDB Atlas (not local MongoDB)

✅ **Serverless**: Functions timeout after 10 seconds

---

## 🆘 Troubleshooting

**Build Fails:**
- Check Node version (must be 14+)
- Run `npm install` locally first
- Review build logs in Vercel dashboard

**Database Connection Error:**
- Verify MongoDB Atlas connection string
- Ensure IP whitelist includes 0.0.0.0/0
- Check MongoDB cluster is running

**API Not Working:**
- Confirm environment variables are set
- Check function logs in Vercel dashboard
- Test health endpoint: `/api/health`

---

## 📚 Full Documentation

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed instructions.

## 🔗 Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- MongoDB Atlas: https://cloud.mongodb.com
- Vercel Docs: https://vercel.com/docs
- Serverless Functions: https://vercel.com/docs/functions

---

**Need Help?** Check the full deployment guide or review Vercel logs in the dashboard.

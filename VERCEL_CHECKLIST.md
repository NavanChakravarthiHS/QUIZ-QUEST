# ✅ Vercel Deployment Checklist for QUIZ-QUEST

Use this checklist to ensure a smooth deployment to Vercel.

## Pre-Deployment Checklist

### Environment Setup
- [ ] MongoDB Atlas account created
- [ ] MongoDB cluster created (M0 free tier)
- [ ] Database user created with read/write permissions
- [ ] Network access configured (0.0.0.0/0 whitelist)
- [ ] Connection string copied and tested
- [ ] JWT_SECRET generated (32+ characters recommended)

### Code Preparation
- [ ] All dependencies installed locally (`npm install` in root, backend, frontend)
- [ ] Frontend builds successfully (`npm run build --prefix frontend`)
- [ ] No console errors in browser during local testing
- [ ] All features tested locally
- [ ] `.env` files NOT committed to Git (check .gitignore)

### Git Repository
- [ ] Git repository initialized
- [ ] All changes committed
- [ ] Repository pushed to GitHub/GitLab/Bitbucket
- [ ] Repository is public or Vercel has access

### Vercel Configuration
- [ ] Vercel account created/signed in
- [ ] New project created
- [ ] Git repository imported
- [ ] Build settings configured:
  - [ ] Framework Preset: Other
  - [ ] Root Directory: `./`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `frontend/dist`
  - [ ] Install Command: `npm install`

### Environment Variables in Vercel
- [ ] `MONGODB_URI` set (MongoDB Atlas connection string)
- [ ] `JWT_SECRET` set (strong random string)
- [ ] `NODE_ENV` set to `production`

## Deployment

### Initial Deploy
- [ ] Click "Deploy" button
- [ ] Monitor build logs for errors
- [ ] Wait for deployment to complete (~2-5 minutes)
- [ ] Note the deployment URL

### Post-Deployment Testing

#### Basic Tests
- [ ] Homepage loads successfully
- [ ] No console errors on homepage
- [ ] CSS/styling renders correctly
- [ ] Images and assets load properly

#### Authentication Tests
- [ ] Teacher signup works
- [ ] Teacher login works
- [ ] Student signup works
- [ ] Student login works
- [ ] Admin login works
- [ ] Logout functionality works
- [ ] Session persists on refresh

#### Quiz Creation Tests
- [ ] Create new quiz (teacher dashboard)
- [ ] Add questions to quiz
- [ ] Edit existing quiz
- [ ] Delete quiz
- [ ] Set scheduled date/time
- [ ] Activate/deactivate quiz

#### Quiz Taking Tests
- [ ] Student can see available quizzes
- [ ] Access key validation works
- [ ] Quiz loads correctly
- [ ] Timer functions properly
- [ ] Submit answers works
- [ ] Results display correctly
- [ ] Tab-switch detection works (if implemented)

#### API Tests
- [ ] `/api/health` returns OK status
- [ ] `/api/auth/login` works
- [ ] `/api/auth/register` works
- [ ] `/api/quiz/all` returns quiz list
- [ ] All CRUD operations work

### Database Verification
- [ ] MongoDB Atlas shows active connections
- [ ] Data is being saved to database
- [ ] Users collection has test users
- [ ] Quizzes collection has test quizzes
- [ ] Attempts collection records quiz attempts

### Performance Checks
- [ ] Page load time < 3 seconds
- [ ] API responses < 2 seconds
- [ ] No timeout errors (functions must complete in <10s)
- [ ] Static assets cached properly

## Troubleshooting (If Issues Found)

### Build Failures
- [ ] Check Node.js version compatibility
- [ ] Review build logs in Vercel dashboard
- [ ] Verify all dependencies in package.json
- [ ] Test build locally: `npm run build`

### Runtime Errors
- [ ] Check Vercel function logs
- [ ] Verify environment variables are set correctly
- [ ] Test MongoDB connection from Vercel
- [ ] Check CORS configuration

### Database Connection Issues
- [ ] Verify MongoDB Atlas connection string
- [ ] Confirm IP whitelist includes 0.0.0.0/0
- [ ] Check MongoDB cluster is running
- [ ] Test connection string locally

### API Issues
- [ ] Verify routes are prefixed with `/api`
- [ ] Check `api/index.js` exports Express app
- [ ] Review Vercel routing configuration in `vercel.json`
- [ ] Test health endpoint: `/api/health`

## Optimization (Optional)

### Performance
- [ ] Enable Vercel Analytics
- [ ] Configure caching headers
- [ ] Optimize images
- [ ] Minimize bundle size
- [ ] Review function execution times

### Security
- [ ] Use strong JWT_SECRET
- [ ] Enable Vercel secure environment variables
- [ ] Implement rate limiting (if needed)
- [ ] Review CORS settings
- [ ] Set up monitoring/alerts

### Monitoring
- [ ] Set up Vercel Analytics
- [ ] Enable MongoDB Atlas monitoring
- [ ] Configure error tracking (optional)
- [ ] Set up uptime monitoring (optional)

## Final Steps

### Documentation
- [ ] Update README with deployment URL
- [ ] Document any custom configurations
- [ ] Share deployment URL with team/users

### Communication
- [ ] Notify team of deployment
- [ ] Share access instructions
- [ ] Provide support contact information

### Backup Plan
- [ ] Export database schema
- [ ] Document rollback procedure
- [ ] Keep local copy of environment variables (securely)

## Success Criteria

Your deployment is successful when:
- ✅ Homepage loads without errors
- ✅ All authentication flows work
- ✅ Quiz creation and management functional
- ✅ Students can take quizzes
- ✅ Results are saved and displayed
- ✅ No errors in Vercel logs
- ✅ MongoDB shows active connections
- ✅ Performance is acceptable (<3s page load)

## Useful Commands

```bash
# Local testing
npm run dev                    # Run both frontend and backend
npm run build                  # Build frontend
npm run install:all            # Install all dependencies

# Vercel CLI (if installed)
vercel                         # Deploy to preview
vercel --prod                 # Deploy to production
vercel ls                     # List deployments
vercel logs                   # View deployment logs

# Git commands
git status                    # Check git status
git add .                     # Stage all changes
git commit -m "message"       # Commit changes
git push                      # Push to remote
```

## Support Resources

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Documentation**: https://vercel.com/docs
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Project Docs**: See VERCEL_DEPLOYMENT.md and QUICK_DEPLOY.md

---

**Last Updated**: Check your deployment date
**Deployment URL**: Your Vercel app URL
**MongoDB Cluster**: Your cluster name

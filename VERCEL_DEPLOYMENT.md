# 🚀 Vercel Deployment Guide for QUIZ-QUEST

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Create a free MongoDB Atlas account at [mongodb.net](https://www.mongodb.com/cloud/atlas)
3. **Vercel CLI** (optional): Install with `npm i -g vercel`

## Step-by-Step Deployment

### 1. Prepare MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with read/write permissions
4. Get your connection string (should look like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/quiz-platform?retryWrites=true&w=majority
   ```
5. Whitelist all IP addresses (0.0.0.0/0) for serverless access

### 2. Set Environment Variables in Vercel

After connecting your project to Vercel, add these environment variables in Vercel dashboard:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quiz-platform?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-use-a-strong-random-string-here
NODE_ENV=production
```

**Important**: Use a strong random string for JWT_SECRET (at least 32 characters)

### 3. Deploy via Vercel Dashboard (Recommended)

#### Option A: Import from Git Repository

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your Git repository
5. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install && npm install --prefix backend`
6. Add environment variables (see step 2)
7. Click "Deploy"

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 4. Post-Deployment Configuration

#### Update Frontend API URL

After deployment, Vercel will provide you with a domain (e.g., `https://your-project.vercel.app`)

The API routes are automatically available at:
- `https://your-domain.vercel.app/api/auth/login`
- `https://your-domain.vercel.app/api/quiz/all`
- etc.

No need to update frontend `.env` - the app uses relative paths.

### 5. Test Your Deployment

1. Visit your Vercel URL
2. Test admin login
3. Create a quiz
4. Test student access
5. Check MongoDB Atlas for data

## Troubleshooting

### Build Fails

**Error: Node version incompatibility**
- Ensure your local Node version matches Vercel's (check `package.json` engines field)
- Vercel uses Node.js 14.x by default

**Error: Module not found**
- Run `npm install` locally first
- Ensure all dependencies are in `package.json`
- Check for typos in import statements

### Runtime Errors

**Database Connection Failed**
- Verify MONGODB_URI is correct in Vercel environment variables
- Ensure MongoDB Atlas allows connections from all IPs (0.0.0.0/0)
- Check MongoDB Atlas cluster is running

**API Routes Not Working**
- Check that `/api/*` routes are handled by Vercel functions
- Verify `api/index.js` exports the Express app correctly
- Check Vercel function logs in dashboard

### CORS Issues

If you face CORS errors:
- The backend already has CORS enabled
- Ensure you're calling APIs from the same Vercel domain
- For external frontend, update CORS settings in `backend/app.js`

## Local Testing Before Deployment

Test the production build locally:

```bash
# Install dependencies
npm run install:all

# Build frontend
npm run build

# Test with Vercel CLI
vercel dev
```

## Important Notes

### Serverless Limitations

1. **Function Duration**: Max 10 seconds per request (configured in `vercel.json`)
2. **Cold Starts**: First request after inactivity may be slower
3. **File System**: Cannot write to disk (use MongoDB for persistence)
4. **Cron Jobs**: The quiz scheduler (`quizScheduler.js`) won't work in serverless
   - Consider using Vercel Cron Jobs or external scheduling service

### Database

- MongoDB Atlas is required (local MongoDB won't work)
- Use connection string with `retryWrites=true`
- Consider enabling MongoDB Atlas Insights for monitoring

### Security

- Never commit `.env` files
- Use strong JWT_SECRET
- Enable Vercel's secure environment variables
- Regularly rotate secrets

## Monitoring

### Vercel Dashboard

- View deployment logs
- Monitor function execution times
- Check error rates
- Set up alerts

### MongoDB Atlas

- Monitor database queries
- Check connection counts
- Review slow query logs

## Updating Deployment

After initial deployment:

```bash
# Make changes to code
git add .
git commit -m "Your changes"
git push

# Vercel will auto-deploy if connected to Git
# Or manually deploy:
vercel --prod
```

## Custom Domain (Optional)

1. Go to Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. SSL certificate is automatically provisioned

## Performance Optimization

1. **Enable Caching**: Static assets are cached automatically
2. **Optimize Images**: Use optimized images for faster loading
3. **Minimize Bundle Size**: Remove unused dependencies
4. **Use Edge Config**: For frequently accessed configuration

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Functions](https://vercel.com/docs/functions)
- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [Express on Vercel](https://vercel.com/guides/deploying-express-with-vercel)

## Quick Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Environment variables set in Vercel
- [ ] All dependencies installed
- [ ] Build passes locally
- [ ] Tested with `vercel dev`
- [ ] Deployed to Vercel
- [ ] All features tested
- [ ] Monitoring set up

---

**Need Help?** Check the troubleshooting section or review Vercel logs in the dashboard.

# Deployment Guide for QuizQuest

This guide explains how to deploy the QuizQuest application to various platforms.

## Vercel Deployment

### Prerequisites

1. A Vercel account (free at [vercel.com](https://vercel.com))
2. A MongoDB database (you can use MongoDB Atlas for a free tier)
3. Node.js installed locally (for local testing)

### Deployment Steps

1. **Push your code to GitHub**
   - Make sure all your code is committed and pushed to a GitHub repository

2. **Import project to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Build Settings**
   - Framework Preset: `Other`
   - Build Command: `npm run build --prefix frontend`
   - Output Directory: `frontend/dist`
   - Install Command: `npm install`

4. **Set Environment Variables**
   - Refer to `VERCEL_ENV_SETUP.md` for detailed instructions on setting up environment variables

5. **Deploy**
   - Click "Deploy" and wait for the build to complete

### Configuration Files

The following files have been added to support Vercel deployment:

- `vercel.json` - Vercel configuration file
- `backend/api/index.js` - Serverless entry point for the backend
- `VERCEL_ENV_SETUP.md` - Instructions for setting up environment variables

## Local Development

To run the application locally:

```bash
npm run dev
```

This will start both the frontend (on port 3001) and backend (on port 5004) simultaneously.

## Other Deployment Options

### Traditional Hosting

For traditional hosting providers:

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the contents of `frontend/dist` to your web server

3. Deploy the backend to a Node.js hosting provider (like Heroku, Render, etc.)

4. Make sure to set the appropriate environment variables on your hosting platform

### Docker Deployment

Docker support can be added by creating Dockerfiles for both frontend and backend services.

## Troubleshooting

### Common Issues

1. **API calls failing**
   - Check that `VITE_API_URL` is correctly set in your environment variables
   - Ensure your backend is accessible and running

2. **MongoDB connection errors**
   - Verify your `MONGODB_URI` is correct
   - Check that your MongoDB instance is accessible from your hosting platform

3. **Build failures**
   - Ensure all dependencies are correctly listed in package.json files
   - Check that the build commands in vercel.json are correct

### Getting Help

If you encounter issues:
1. Check the deployment logs in your Vercel dashboard
2. Verify all environment variables are set correctly
3. Test the application locally to ensure it works before deploying
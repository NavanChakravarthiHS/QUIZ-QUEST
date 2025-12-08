# Vercel Environment Variables Setup

For the QuizQuest application to work properly on Vercel, you need to set up the following environment variables in your Vercel project settings:

## Frontend Environment Variables

Set these in your Vercel project settings under "Environment Variables":

1. `VITE_API_URL` - Set this to your Vercel deployment URL + `/api`
   Example: `https://your-project.vercel.app/api`

## Backend Environment Variables

1. `MONGODB_URI` - Your MongoDB connection string
   Example: `mongodb+srv://username:password@cluster.mongodb.net/quiz-platform`

2. `JWT_SECRET` - A strong secret key for JWT token generation
   Example: `your-super-secret-jwt-key-change-this`

3. `PORT` - Set this to `3000` (Vercel's default port)
   Value: `3000`

## How to Set Up in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the sidebar
4. Add each variable with the appropriate values as shown above
5. Redeploy your application for the changes to take effect

## Notes

- The frontend will automatically use the Vercel deployment URL for API calls when deployed
- Make sure your MongoDB database is accessible from Vercel (publicly accessible or with proper IP whitelisting)
- For local development, keep using your existing .env files
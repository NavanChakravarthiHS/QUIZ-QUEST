# 🚀 Quick Setup Guide

## 1. Create `.env` File

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/quiz-platform?retryWrites=true&w=majority
JWT_SECRET=generate-a-random-string-at-least-32-characters-long
NODE_ENV=development
PORT=5005
```

## 2. Install Dependencies

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

## 3. Run Application

```bash
npm run dev
```

Visit: http://localhost:5173

## 4. Deploy to Vercel

1. Add environment variables in Vercel Dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`

2. Configure MongoDB Atlas:
   - Add `0.0.0.0/0` to Network Access

3. Push to Git and deploy!

---

That's it! 🎉

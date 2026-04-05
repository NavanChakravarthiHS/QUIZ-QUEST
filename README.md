# QUIZ-QUEST 🎓

A modern quiz platform built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- 👨‍🏫 **Teacher Dashboard**: Create and manage quizzes
- 👨‍🎓 **Student Portal**: Take quizzes and view results
- 🔐 **Authentication**: JWT-based login system
- 📊 **Analytics**: Track quiz performance
- ⏱️ **Timer**: Real-time countdown during quizzes
- 📱 **Responsive**: Works on all devices

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Deployment**: Vercel

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd QUIZ-QUEST
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 2. Setup Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values
# - Get MongoDB URI from MongoDB Atlas
# - Generate JWT_SECRET (min 32 chars)
```

### 3. Run Locally

```bash
npm run dev
```

Visit: `http://localhost:5173`

## Deployment to Vercel

### 1. Add Environment Variables

Go to **Vercel Dashboard → Settings → Environment Variables** and add:

- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Your JWT secret key (min 32 characters)
- `NODE_ENV`: Set to `production`

### 2. Configure MongoDB Atlas

Add `0.0.0.0/0` to Network Access (Allow from Anywhere)

### 3. Deploy

Push to Git or deploy manually through Vercel dashboard.

For detailed deployment instructions, see [DEPLOY_STEPS.md](DEPLOY_STEPS.md) or [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md).

## Project Structure

```
QUIZ-QUEST/
├── api/              # Vercel serverless functions
├── backend/          # Express backend
│   ├── models/       # Mongoose models
│   ├── routes/       # API routes
│   ├── middleware/   # Auth middleware
│   └── utils/        # Utility functions
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── dist/         # Production build
├── .env.example      # Environment template
└── vercel.json       # Vercel configuration
```

## Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend

# Backend only
npm run server           # Start backend server

# Frontend only
npm run client           # Start frontend dev server

# Build for production
npm run build            # Build frontend
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ Yes |
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | ✅ Yes |
| `NODE_ENV` | Environment (development/production) | ✅ Yes |
| `PORT` | Server port (local only) | Optional |

## License

MIT

---

Built with ❤️ using React, Node.js, and MongoDB

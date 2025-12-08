const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectToDatabase } = require('../utils/db');

// Load environment variables
dotenv.config();

const app = express();

// Import routes
const authRoutes = require('../routes/auth');
const quizRoutes = require('../routes/quiz');
const questionBankRoutes = require('../routes/questionBank');
const adminRoutes = require('../routes/admin');

// Shared promise so we only trigger a connection once per cold start
let connectionReadyPromise;
const ensureDatabaseConnection = async () => {
  if (!connectionReadyPromise) {
    connectionReadyPromise = connectToDatabase().catch((err) => {
      // Reset so a subsequent request can retry
      connectionReadyPromise = undefined;
      throw err;
    });
  }
  return connectionReadyPromise;
};

// Middleware order: CORS -> JSON body parser -> DB connection -> routes
app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    return next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/question-bank', questionBankRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Quiz Platform Backend is running' });
});

// Export the app for Vercel
module.exports = app;
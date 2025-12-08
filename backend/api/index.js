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

// Ensure a MongoDB connection before handling any request (important for serverless)
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    return next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// Middleware
app.use(cors());
app.use(express.json());

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
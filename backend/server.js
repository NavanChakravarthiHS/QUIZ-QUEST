const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const questionBankRoutes = require('./routes/questionBank');
const adminRoutes = require('./routes/admin');

// Import scheduler
const { startQuizScheduler } = require('./jobs/quizScheduler');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/question-bank', questionBankRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Quiz Platform Backend is running' });
});

const PORT = process.env.PORT || 5004;

// Function to start server with port fallback
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    
    // Start the quiz scheduler
    startQuizScheduler();
  });
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      // Check if the next port is still valid (less than 65536)
      if (nextPort < 65536) {
        console.log(`Port ${port} is already in use, trying ${nextPort}...`);
        startServer(nextPort);
      } else {
        console.error('No available ports found');
      }
    } else {
      console.error('Server error:', err);
    }
  });
  
  return server;
};

const server = startServer(PORT);

module.exports = server;
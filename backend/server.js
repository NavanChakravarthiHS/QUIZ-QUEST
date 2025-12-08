const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');
const { startQuizScheduler } = require('./jobs/quizScheduler');

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-platform';

// Function to start server with port fallback
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    startQuizScheduler();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
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

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    startServer(PORT);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
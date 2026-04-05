// Script to check quiz status
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Quiz = require('./models/Quiz');

// Load environment variables
dotenv.config();

// Connect to MongoDB using environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-platform';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  // Find our test quiz
  const testQuiz = await Quiz.findOne({ title: 'Auto-Scheduled Test Quiz' });
  
  if (testQuiz) {
    console.log('Test quiz found:');
    console.log('ID:', testQuiz._id);
    console.log('Title:', testQuiz.title);
    console.log('Is Active:', testQuiz.isActive);
    console.log('Scheduled Date:', testQuiz.scheduledDate);
    console.log('Scheduled Time:', testQuiz.scheduledTime);
  } else {
    console.log('Test quiz not found');
  }
  
  // Close connection
  mongoose.connection.close();
});
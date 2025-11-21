// Script to check quiz status
const mongoose = require('mongoose');
const Quiz = require('./models/Quiz');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/quiz-platform', {
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
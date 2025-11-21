// Test script to verify automatic quiz scheduling
const mongoose = require('mongoose');
const Quiz = require('./models/Quiz');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/quiz-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  // Create a test quiz that should activate now
  const now = new Date();
  const scheduledDate = now.toISOString().split('T')[0]; // Today's date
  const scheduledTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`; // Current time
  
  console.log('Creating test quiz with schedule:');
  console.log('Date:', scheduledDate);
  console.log('Time:', scheduledTime);
  
  const testQuiz = new Quiz({
    title: 'Auto-Scheduled Test Quiz',
    description: 'This quiz should automatically activate',
    createdBy: '666f6f2d6261722d7175697a', // Dummy user ID
    questions: [
      {
        question: 'What is 2+2?',
        type: 'single',
        options: [
          { text: '3', isCorrect: false },
          { text: '4', isCorrect: true },
          { text: '5', isCorrect: false }
        ],
        points: 1
      }
    ],
    timingMode: 'total',
    totalDuration: 600, // 10 minutes
    isActive: false, // Should be activated automatically
    showResults: false,
    scheduledDate: scheduledDate,
    scheduledTime: scheduledTime,
    accessKey: 'TEST1234'
  });
  
  try {
    await testQuiz.save();
    console.log('Test quiz created successfully:', testQuiz._id);
  } catch (error) {
    console.error('Error creating test quiz:', error);
  }
  
  // Close connection
  mongoose.connection.close();
});
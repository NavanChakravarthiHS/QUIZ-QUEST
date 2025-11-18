const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const Quiz = require('./models/Quiz');

// Test function to check access keys
async function testAccessKeys() {
  try {
    // Find all quizzes
    const quizzes = await Quiz.find({}).select('title accessKey');
    
    console.log('Quizzes and their access keys:');
    quizzes.forEach(quiz => {
      console.log(`- ${quiz.title}: ${quiz.accessKey || 'NULL'}`);
    });
    
    // Check if any quizzes don't have access keys
    const quizzesWithoutKeys = quizzes.filter(quiz => !quiz.accessKey);
    console.log(`\nQuizzes without access keys: ${quizzesWithoutKeys.length}`);
    
    if (quizzesWithoutKeys.length > 0) {
      console.log('Quizzes missing access keys:');
      quizzesWithoutKeys.forEach(quiz => {
        console.log(`- ${quiz.title}`);
      });
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

// Run the test
testAccessKeys();
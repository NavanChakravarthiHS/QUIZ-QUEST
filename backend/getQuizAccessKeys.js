const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Quiz = require('./models/Quiz');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Fetch all quizzes with their access keys
    const quizzes = await Quiz.find({}, 'title accessKey');
    
    console.log('\n=== Quiz Access Keys ===');
    console.log('Total quizzes found:', quizzes.length);
    console.log('');
    
    if (quizzes.length === 0) {
      console.log('No quizzes found in the database.');
    } else {
      quizzes.forEach((quiz, index) => {
        console.log(`${index + 1}. ${quiz.title}`);
        console.log(`   Access Key: ${quiz.accessKey || 'NOT SET'}`);
        console.log('');
      });
    }
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    mongoose.connection.close();
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});
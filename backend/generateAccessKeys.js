const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Quiz = require('./models/Quiz');
const { generateAccessKey } = require('./utils/accessKeyGenerator');

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
    // Fetch all quizzes
    const quizzes = await Quiz.find({});
    
    console.log('\n=== Quiz Access Keys ===');
    console.log('Total quizzes found:', quizzes.length);
    console.log('');
    
    if (quizzes.length === 0) {
      console.log('No quizzes found in the database.');
    } else {
      for (const quiz of quizzes) {
        console.log(`Quiz: ${quiz.title}`);
        
        // If quiz doesn't have an access key, generate one
        if (!quiz.accessKey) {
          const newAccessKey = generateAccessKey();
          quiz.accessKey = newAccessKey;
          await quiz.save();
          console.log(`  Generated new access key: ${newAccessKey}`);
        } else {
          console.log(`  Existing access key: ${quiz.accessKey}`);
        }
        console.log('');
      }
    }
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error processing quizzes:', error);
    mongoose.connection.close();
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});
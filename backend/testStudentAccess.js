const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
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
    // Test: Find a student by USN and check their name
    const student = await User.findOne({ usn: '4HG23CS043', role: 'student' });
    
    if (student) {
      console.log('Student found:');
      console.log('  USN:', student.usn);
      console.log('  Name:', student.name);
      console.log('  Email:', student.email);
    } else {
      console.log('No student found with USN: 4HG23CS043');
    }
    
    // Test: Find a quiz and check its access key
    const quiz = await Quiz.findOne({});
    
    if (quiz) {
      console.log('\nQuiz found:');
      console.log('  Title:', quiz.title);
      console.log('  Access Key:', quiz.accessKey);
    } else {
      console.log('No quizzes found');
    }
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});
/**
 * Sample Data Generator for Testing
 * 
 * To use this, run: node backend/sample-data.js
 * Make sure MongoDB is running
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const Quiz = require('./models/Quiz');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-platform');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const createSampleData = async () => {
  try {
    // Create a teacher user
    const teacher = await User.findOne({ email: 'teacher@quiz.com' });
    let teacherId = teacher?._id;

    if (!teacher) {
      const newTeacher = new User({
        name: 'John Teacher',
        email: 'teacher@quiz.com',
        passwordHash: 'password123', // Will be hashed by pre-save hook
        role: 'teacher'
      });
      await newTeacher.save();
      teacherId = newTeacher._id;
      console.log('✓ Created teacher user: teacher@quiz.com / password123');
    } else {
      console.log('✓ Teacher user already exists');
    }

    // Create a student user
    const student = await User.findOne({ email: 'student@quiz.com' });
    if (!student) {
      const newStudent = new User({
        name: 'Jane Student',
        email: 'student@quiz.com',
        passwordHash: 'password123', // Will be hashed by pre-save hook
        role: 'student',
        branch: 'CSE',
        usn: '4HG23CS001'
      });
      await newStudent.save();
      console.log('✓ Created student user: student@quiz.com / password123');
    } else {
      console.log('✓ Student user already exists');
    }

    // Create sample quizzes
    const sampleQuizzes = [
      {
        title: 'Basic Math Quiz',
        description: 'Test your basic math skills',
        createdBy: teacherId,
        questions: [
          {
            question: 'What is 2 + 2?',
            type: 'single',
            options: [
              { text: '3', isCorrect: false },
              { text: '4', isCorrect: true },
              { text: '5', isCorrect: false },
              { text: '6', isCorrect: false }
            ],
            points: 5
          },
          {
            question: 'What is 10 × 5?',
            type: 'single',
            options: [
              { text: '40', isCorrect: false },
              { text: '50', isCorrect: true },
              { text: '60', isCorrect: false },
              { text: '70', isCorrect: false }
            ],
            points: 5
          },
          {
            question: 'What is 100 ÷ 10?',
            type: 'single',
            options: [
              { text: '5', isCorrect: false },
              { text: '10', isCorrect: true },
              { text: '15', isCorrect: false },
              { text: '20', isCorrect: false }
            ],
            points: 5
          }
        ],
        timingMode: 'total',
        totalDuration: 300, // 5 minutes
        isActive: true,
        scheduledDate: new Date(), // Add scheduled date
        scheduledTime: '10:00' // Add scheduled time
      },
      {
        title: 'Programming Languages Quiz',
        description: 'Identify correct programming languages',
        createdBy: teacherId,
        questions: [
          {
            question: 'Which are programming languages?',
            type: 'multiple',
            options: [
              { text: 'JavaScript', isCorrect: true },
              { text: 'HTML', isCorrect: false },
              { text: 'Python', isCorrect: true },
              { text: 'CSS', isCorrect: false },
              { text: 'Java', isCorrect: true }
            ],
            points: 10
          },
          {
            question: 'Which statement is true about React?',
            type: 'single',
            options: [
              { text: 'It is a backend framework', isCorrect: false },
              { text: 'It is a database', isCorrect: false },
              { text: 'It is a JavaScript library for building UIs', isCorrect: true },
              { text: 'It is a CSS framework', isCorrect: false }
            ],
            points: 5
          }
        ],
        timingMode: 'total',
        totalDuration: 180, // 3 minutes
        isActive: true,
        scheduledDate: new Date(Date.now() + 86400000), // Tomorrow
        scheduledTime: '14:30' // Add scheduled time
      },
      {
        title: 'Quick Geography Quiz',
        description: 'Test your geography knowledge',
        createdBy: teacherId,
        questions: [
          {
            question: 'What is the capital of France?',
            type: 'single',
            options: [
              { text: 'London', isCorrect: false },
              { text: 'Berlin', isCorrect: false },
              { text: 'Paris', isCorrect: true },
              { text: 'Madrid', isCorrect: false }
            ],
            points: 5,
            timeLimit: 60 // 1 minute per question
          },
          {
            question: 'Which countries are in North America?',
            type: 'multiple',
            options: [
              { text: 'Canada', isCorrect: true },
              { text: 'Brazil', isCorrect: false },
              { text: 'Mexico', isCorrect: true },
              { text: 'USA', isCorrect: true },
              { text: 'Argentina', isCorrect: false }
            ],
            points: 10,
            timeLimit: 60
          }
        ],
        timingMode: 'per-question',
        totalDuration: 240, // 4 minutes total
        isActive: true,
        scheduledDate: new Date(Date.now() - 86400000), // Yesterday
        scheduledTime: '09:00' // Add scheduled time
      }
    ];

    for (const quizData of sampleQuizzes) {
      // Check if a quiz with the same title already exists
      const existingQuiz = await Quiz.findOne({ title: quizData.title });
      if (!existingQuiz) {
        const quiz = new Quiz(quizData);
        await quiz.save();
        console.log(`✓ Created quiz: ${quizData.title}`);
      } else {
        console.log(`✓ Quiz "${quizData.title}" already exists`);
      }
    }

    console.log('\n✅ Sample data created successfully!');
    console.log('\nTest Accounts:');
    console.log('Teacher: teacher@quiz.com / password123');
    console.log('Student: student@quiz.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error creating sample data:', error);
    process.exit(1);
  }
};

const main = async () => {
  await connectDB();
  await createSampleData();
};

main();
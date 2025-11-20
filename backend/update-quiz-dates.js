const mongoose = require('mongoose');
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

const updateQuizDates = async () => {
  try {
    // Update Basic Math Quiz
    await Quiz.updateOne(
      { title: 'Basic Math Quiz' },
      { 
        scheduledDate: new Date(),
        scheduledTime: '10:00'
      }
    );
    console.log('✓ Updated Basic Math Quiz with scheduled date');

    // Update Programming Languages Quiz (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await Quiz.updateOne(
      { title: 'Programming Languages Quiz' },
      { 
        scheduledDate: tomorrow,
        scheduledTime: '14:30'
      }
    );
    console.log('✓ Updated Programming Languages Quiz with scheduled date');

    // Update Quick Geography Quiz (yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await Quiz.updateOne(
      { title: 'Quick Geography Quiz' },
      { 
        scheduledDate: yesterday,
        scheduledTime: '09:00'
      }
    );
    console.log('✓ Updated Quick Geography Quiz with scheduled date');

    console.log('\n✅ Quiz dates updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating quiz dates:', error);
    process.exit(1);
  }
};

const main = async () => {
  await connectDB();
  await updateQuizDates();
};

main();
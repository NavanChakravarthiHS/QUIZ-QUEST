const cron = require('node-cron');
const Quiz = require('../models/Quiz');

// Function to check and activate quizzes that should start
const activateScheduledQuizzes = async () => {
  try {
    console.log('Checking for quizzes to activate...');
    
    const now = new Date();
    const quizzesToActivate = await Quiz.find({
      isActive: false, // Currently inactive
      scheduledDate: { $ne: null }, // Has a scheduled date
      scheduledTime: { $ne: null } // Has a scheduled time
    });
    
    console.log(`Found ${quizzesToActivate.length} inactive quizzes with schedules`);
    
    let activatedCount = 0;
    
    for (const quiz of quizzesToActivate) {
      try {
        const scheduledDate = new Date(quiz.scheduledDate);
        scheduledDate.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check if quiz is scheduled for today
        if (scheduledDate.getTime() === today.getTime()) {
          // Check if it's time to activate
          const [scheduledHours, scheduledMinutes] = quiz.scheduledTime.split(':').map(Number);
          const scheduledDateTime = new Date();
          scheduledDateTime.setHours(scheduledHours, scheduledMinutes, 0, 0);
          
          console.log(`Checking quiz "${quiz.title}":`);
          console.log(`  - Now: ${now}`);
          console.log(`  - Scheduled time: ${scheduledDateTime}`);
          console.log(`  - Should activate: ${now >= scheduledDateTime}`);
          
          // If current time is past the scheduled time, activate the quiz
          if (now >= scheduledDateTime) {
            quiz.isActive = true;
            await quiz.save();
            console.log(`Activated quiz: ${quiz.title} (${quiz._id})`);
            activatedCount++;
          }
        }
        // For past date quizzes, we don't activate them automatically
        // They should remain inactive and be shown as completed
      } catch (error) {
        console.error(`Error processing quiz ${quiz._id}:`, error);
      }
    }
    
    console.log(`Activated ${activatedCount} quizzes`);
  } catch (error) {
    console.error('Error in activateScheduledQuizzes:', error);
  }
};

// Function to check and deactivate quizzes that should end
const deactivateEndedQuizzes = async () => {
  try {
    console.log('Checking for quizzes to deactivate...');
    
    const now = new Date();
    const activeQuizzes = await Quiz.find({
      isActive: true, // Currently active
      scheduledDate: { $ne: null }, // Has a scheduled date
      scheduledTime: { $ne: null } // Has a scheduled time
    });
    
    console.log(`Found ${activeQuizzes.length} active quizzes with schedules`);
    
    let deactivatedCount = 0;
    
    for (const quiz of activeQuizzes) {
      try {
        const scheduledDate = new Date(quiz.scheduledDate);
        scheduledDate.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check if quiz is scheduled for today
        if (scheduledDate.getTime() === today.getTime()) {
          // Check if it's time to deactivate (quiz has ended)
          const [scheduledHours, scheduledMinutes] = quiz.scheduledTime.split(':').map(Number);
          const scheduledDateTime = new Date();
          scheduledDateTime.setHours(scheduledHours, scheduledMinutes, 0, 0);
          
          // Calculate end time (scheduled time + duration)
          const endTime = new Date(scheduledDateTime.getTime() + quiz.totalDuration * 60000);
          
          console.log(`Checking quiz "${quiz.title}" for deactivation:`);
          console.log(`  - Now: ${now}`);
          console.log(`  - End time: ${endTime}`);
          console.log(`  - Should deactivate: ${now >= endTime}`);
          
          // If current time is past the end time, deactivate the quiz
          if (now >= endTime) {
            quiz.isActive = false;
            await quiz.save();
            console.log(`Deactivated quiz: ${quiz.title} (${quiz._id})`);
            deactivatedCount++;
          }
        }
        // For quizzes scheduled for past dates, we still need to check if they've ended
        else if (scheduledDate.getTime() < today.getTime()) {
          // For past date quizzes, calculate end time based on scheduled date
          const [scheduledHours, scheduledMinutes] = quiz.scheduledTime.split(':').map(Number);
          const scheduledDateTime = new Date(scheduledDate);
          scheduledDateTime.setHours(scheduledHours, scheduledMinutes, 0, 0);
          
          // Calculate end time (scheduled time + duration)
          const endTime = new Date(scheduledDateTime.getTime() + quiz.totalDuration * 60000);
          
          console.log(`Checking past date quiz "${quiz.title}" for deactivation:`);
          console.log(`  - Now: ${now}`);
          console.log(`  - End time: ${endTime}`);
          console.log(`  - Should deactivate: ${now >= endTime}`);
          
          // If current time is past the end time, deactivate the quiz
          if (now >= endTime) {
            quiz.isActive = false;
            await quiz.save();
            console.log(`Deactivated past date quiz: ${quiz.title} (${quiz._id})`);
            deactivatedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing quiz ${quiz._id}:`, error);
      }
    }
    
    console.log(`Deactivated ${deactivatedCount} quizzes`);
  } catch (error) {
    console.error('Error in deactivateEndedQuizzes:', error);
  }
};

// Schedule the jobs to run every minute
const startQuizScheduler = () => {
  console.log('Starting quiz scheduler...');
  
  // Run every minute
  cron.schedule('* * * * *', async () => {
    console.log('Running scheduled quiz checks at:', new Date());
    await activateScheduledQuizzes();
    await deactivateEndedQuizzes();
  });
};

module.exports = { startQuizScheduler };
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: mongoose.Schema.Types.ObjectId,
  selectedOptions: [String], // Store option text or ID
  isCorrect: Boolean,
  pointsEarned: Number,
  timeSpent: Number // in seconds
});

const attemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Not required for QR code access
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  // For students accessing via QR code who aren't registered
  studentInfo: {
    name: String,
    usn: String
  },
  answers: [answerSchema],
  score: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date,
    required: true
  },
  completedAt: Date,
  timeSpent: Number, // in seconds
  tabSwitches: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'auto-submitted', 'abandoned'],
    default: 'in-progress'
  }
});

// Prevent duplicate participation
attemptSchema.index({ userId: 1, quizId: 1 }, { unique: true });
// Also prevent duplicate participation for QR code students
attemptSchema.index({ 'studentInfo.usn': 1, quizId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Attempt', attemptSchema);
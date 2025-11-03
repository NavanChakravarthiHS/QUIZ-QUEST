const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['single', 'multiple'],
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  points: {
    type: Number,
    default: 1
  },
  timeLimit: {
    type: Number, // in seconds (for per-question mode)
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [questionSchema],
  timingMode: {
    type: String,
    enum: ['total', 'per-question'],
    default: 'total'
  },
  totalDuration: {
    type: Number, // in seconds
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  showResults: {
    type: Boolean,
    default: false
  },
  // Add scheduled date and time for quiz conduction
  scheduledDate: {
    type: Date,
    default: null
  },
  scheduledTime: {
    type: String, // Store as "HH:MM" format
    default: null
  }
}, {
  timestamps: true,
  // This will allow fields not in the schema to be ignored rather than causing errors
  strict: false
});

module.exports = mongoose.model('Quiz', quizSchema);
const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['single', 'multiple'],
    required: true
  },
  options: [{
    text: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  points: {
    type: Number,
    default: 1,
    min: 1
  },
  // Removed difficulty field as per requirement
  imageUrl: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
questionBankSchema.index({ subject: 1, createdBy: 1 });
questionBankSchema.index({ createdBy: 1, isActive: 1 });

const QuestionBank = mongoose.model('QuestionBank', questionBankSchema);

module.exports = QuestionBank;
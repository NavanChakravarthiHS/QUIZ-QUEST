const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[A-Za-z\s]+$/.test(v);
      },
      message: props => `${props.value} is not a valid name! Only alphabetic characters and spaces are allowed.`
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  branch: {
    type: String,
    required: function() { return this.role === 'student'; },
    enum: {
      values: ['CSE', 'ECE', 'EEE', 'ME', 'CV'],
      message: 'Branch must be one of CSE, ECE, EEE, ME, or CV'
    }
  },
  usn: {
    type: String,
    required: function() { return this.role === 'student'; },
    unique: true,
    sparse: true,
    validate: [
      {
        validator: function(v) {
          // Format: 4HG[Year][Branch][Serial] where Serial is 001-499
          if (!/^4HG\d{2}(CS|EC|EE|ME|CV)\d{3}$/.test(v)) return false;
          const serialNumber = parseInt(v.slice(-3));
          return serialNumber >= 1 && serialNumber <= 499;
        },
        message: props => `${props.value} is not a valid USN! Format should be 4HG[Year][Branch][Serial] where Serial is 001-499 (e.g., 4HG23CS043)`
      },
      {
        validator: function(v) {
          return v.length === 10;
        },
        message: props => `USN must be exactly 10 characters long`
      }
    ]
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Get all teachers (Admin only)
router.get('/teachers', auth, isAdmin, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Error fetching teachers', error: error.message });
  }
});

// Create teacher account (Admin only)
router.post('/create-teacher', auth, isAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create teacher
    const teacher = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: password,
      role: 'teacher'
    });

    await teacher.save();

    res.status(201).json({
      message: 'Teacher account created successfully',
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role
      }
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ message: 'Error creating teacher', error: error.message });
  }
});

// Bulk create teachers (Admin only)
router.post('/bulk-create-teachers', auth, isAdmin, async (req, res) => {
  try {
    const { teachers } = req.body;

    if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
      return res.status(400).json({ message: 'Teachers array is required' });
    }

    const results = {
      created: [],
      failed: []
    };

    for (const teacherData of teachers) {
      try {
        const { name, email, password } = teacherData;

        // Validation
        if (!name || !email || !password) {
          results.failed.push({
            email,
            reason: 'Missing required fields'
          });
          continue;
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
        if (existingUser) {
          results.failed.push({
            email,
            reason: 'Email already registered'
          });
          continue;
        }

        // Create teacher
        const teacher = new User({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          passwordHash: password,
          role: 'teacher'
        });

        await teacher.save();

        results.created.push({
          name: teacher.name,
          email: teacher.email
        });
      } catch (error) {
        results.failed.push({
          email: teacherData.email,
          reason: error.message
        });
      }
    }

    res.status(201).json({
      message: `Created ${results.created.length} teachers, ${results.failed.length} failed`,
      results
    });
  } catch (error) {
    console.error('Error bulk creating teachers:', error);
    res.status(500).json({ message: 'Error bulk creating teachers', error: error.message });
  }
});

// Update teacher (Admin only)
router.put('/teacher/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const teacher = await User.findById(req.params.id);
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'User is not a teacher' });
    }

    // Update fields
    if (name) teacher.name = name.trim();
    if (email) {
      // Check if new email already exists
      const existingUser = await User.findOne({ 
        email: email.trim().toLowerCase(),
        _id: { $ne: teacher._id }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      teacher.email = email.trim().toLowerCase();
    }
    if (password) teacher.passwordHash = password;

    await teacher.save();

    res.json({
      message: 'Teacher updated successfully',
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role
      }
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ message: 'Error updating teacher', error: error.message });
  }
});

// Delete teacher (Admin only)
router.delete('/teacher/:id', auth, isAdmin, async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id);
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'User is not a teacher' });
    }

    await teacher.deleteOne();

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ message: 'Error deleting teacher', error: error.message });
  }
});

module.exports = router;

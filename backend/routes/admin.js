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

// Get all students (Admin only)
router.get('/students', auth, isAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// Create student account (Admin only)
router.post('/create-student', auth, isAdmin, async (req, res) => {
  try {
    const { name, usn, branch, password } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!usn || !usn.trim()) {
      return res.status(400).json({ message: 'USN is required' });
    }

    if (!branch) {
      return res.status(400).json({ message: 'Branch is required' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Validate name format
    if (!/^[A-Za-z\s]+$/.test(name)) {
      return res.status(400).json({ message: 'Name should only contain alphabetic characters and spaces' });
    }

    // Validate USN format
    if (!/^4HG\d{2}(CS|EC|EE|ME|CV)\d{3}$/.test(usn)) {
      return res.status(400).json({ message: 'Invalid USN format. Must be 4HG[Year][Branch][Serial] (e.g., 4HG23CS043)' });
    }

    const serialNumber = parseInt(usn.slice(-3));
    if (serialNumber < 1 || serialNumber > 499) {
      return res.status(400).json({ message: 'Serial number must be between 001-499' });
    }

    // Check if USN already exists
    const existingUser = await User.findOne({ usn });
    if (existingUser) {
      return res.status(400).json({ message: 'USN already registered' });
    }

    // Check if email already exists (auto-generated from USN)
    const email = `${usn.toLowerCase()}@student.quizquest.com`;
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create student
    const student = new User({
      name: name.trim(),
      usn: usn.toUpperCase(),
      branch,
      email,
      passwordHash: password,
      role: 'student'
    });

    await student.save();

    res.status(201).json({
      message: 'Student account created successfully',
      student: {
        id: student._id,
        name: student.name,
        usn: student.usn,
        branch: student.branch,
        email: student.email,
        role: student.role
      }
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Error creating student', error: error.message });
  }
});

// Update student (Admin only)
router.put('/student/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, usn, branch, password } = req.body;
    
    const student = await User.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ message: 'User is not a student' });
    }

    // Update fields
    if (name) {
      if (!/^[A-Za-z\s]+$/.test(name)) {
        return res.status(400).json({ message: 'Name should only contain alphabetic characters and spaces' });
      }
      student.name = name.trim();
    }
    
    if (usn) {
      // Validate USN format
      if (!/^4HG\d{2}(CS|EC|EE|ME|CV)\d{3}$/.test(usn)) {
        return res.status(400).json({ message: 'Invalid USN format. Must be 4HG[Year][Branch][Serial] (e.g., 4HG23CS043)' });
      }
      
      const serialNumber = parseInt(usn.slice(-3));
      if (serialNumber < 1 || serialNumber > 499) {
        return res.status(400).json({ message: 'Serial number must be between 001-499' });
      }
      
      // Check if new USN already exists
      const existingUser = await User.findOne({ 
        usn: usn.toUpperCase(),
        _id: { $ne: student._id }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'USN already registered' });
      }
      
      student.usn = usn.toUpperCase();
      // Update email as well since it's derived from USN
      student.email = `${usn.toLowerCase()}@student.quizquest.com`;
    }
    
    if (branch) {
      student.branch = branch;
    }
    
    if (password) {
      student.passwordHash = password;
    }

    await student.save();

    res.json({
      message: 'Student updated successfully',
      student: {
        id: student._id,
        name: student.name,
        usn: student.usn,
        branch: student.branch,
        email: student.email,
        role: student.role
      }
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
});

// Delete student (Admin only)
router.delete('/student/:id', auth, isAdmin, async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ message: 'User is not a student' });
    }

    await student.deleteOne();

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
});

module.exports = router;

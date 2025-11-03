const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

// Create Quiz (Teacher only)
router.post('/create', auth, async (req, res) => {
  try {
    const { title, description, questions, timingMode, totalDuration, scheduledDate, scheduledTime } = req.body;

    // Only teachers can create quizzes
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create quizzes' });
    }

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Quiz title is required' });
    }

    // Validate scheduled date and time are provided
    if (!scheduledDate) {
      return res.status(400).json({ message: 'Scheduled date is required' });
    }

    if (!scheduledTime) {
      return res.status(400).json({ message: 'Scheduled time is required' });
    }

    // Validate questions
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'At least one question is required' });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || q.question.trim() === '') {
        return res.status(400).json({ message: `Question ${i + 1}: Question text is required` });
      }
      
      if (!q.type || !['single', 'multiple'].includes(q.type)) {
        return res.status(400).json({ message: `Question ${i + 1}: Invalid question type` });
      }
      
      if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ message: `Question ${i + 1}: At least 2 options are required` });
      }
      
      // Validate options
      for (let j = 0; j < q.options.length; j++) {
        const option = q.options[j];
        if (!option.text || option.text.trim() === '') {
          return res.status(400).json({ message: `Question ${i + 1}, Option ${j + 1}: Option text is required` });
        }
      }
      
      // Check if at least one option is marked as correct
      if (!q.options.some(opt => opt.isCorrect)) {
        return res.status(400).json({ message: `Question ${i + 1}: At least one option must be marked as correct` });
      }
      
      // Validate points
      if (q.points === undefined || q.points < 1) {
        return res.status(400).json({ message: `Question ${i + 1}: Points must be at least 1` });
      }
      
      // Validate timeLimit for per-question mode
      if (timingMode === 'per-question' && q.timeLimit !== undefined && q.timeLimit < 10) {
        return res.status(400).json({ message: `Question ${i + 1}: Time limit must be at least 10 seconds` });
      }
    }

    const quiz = new Quiz({
      title,
      description,
      questions,
      timingMode,
      totalDuration,
      createdBy: req.user._id,
      scheduledDate: scheduledDate || null,
      scheduledTime: scheduledTime || null
    });

    await quiz.save();

    res.status(201).json({
      message: 'Quiz created successfully',
      quiz: {
        id: quiz._id,
        title: quiz.title,
        questionsCount: quiz.questions.length,
        timingMode: quiz.timingMode,
        totalDuration: quiz.totalDuration,
        scheduledDate: quiz.scheduledDate,
        scheduledTime: quiz.scheduledTime
      }
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ message: 'Error creating quiz', error: error.message });
  }
});

// Join Quiz (validate user can access quiz)
router.get('/join/:quizId', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.quizId, isActive: true });
    if (!quiz) {
      return res.status(404).json({ message: 'Invalid or inactive quiz' });
    }

    // For authenticated users, check if already attempted
    if (req.user) {
      const existingAttempt = await Attempt.findOne({
        userId: req.user._id,
        quizId: quiz._id
      });

      if (existingAttempt) {
        return res.status(400).json({ message: 'Quiz already attempted' });
      }

      // Create attempt
      const attempt = new Attempt({
        userId: req.user._id,
        quizId: quiz._id,
        startedAt: new Date()
      });

      await attempt.save();

      // Return quiz details without correct answers
      const sanitizedQuiz = {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        timingMode: quiz.timingMode,
        totalDuration: quiz.totalDuration,
        questions: quiz.questions.map(q => ({
          _id: q._id,
          question: q.question,
          type: q.type,
          options: q.options.map(opt => ({
            text: opt.text,
            // Don't include isCorrect in response
          })),
          points: q.points,
          timeLimit: q.timeLimit,
          imageUrl: q.imageUrl // Include imageUrl in response
        }))
      };

      res.json({
        message: 'Quiz joined successfully',
        quiz: sanitizedQuiz,
        attemptId: attempt._id
      });
    } else {
      // For non-authenticated users (students accessing via QR code)
      // Return quiz details without creating attempt yet
      const sanitizedQuiz = {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        timingMode: quiz.timingMode,
        totalDuration: quiz.totalDuration,
        questions: quiz.questions.map(q => ({
          _id: q._id,
          question: q.question,
          type: q.type,
          options: q.options.map(opt => ({
            text: opt.text,
            // Don't include isCorrect in response
          })),
          points: q.points,
          timeLimit: q.timeLimit,
          imageUrl: q.imageUrl // Include imageUrl in response
        }))
      };

      res.json({
        message: 'Quiz details retrieved',
        quiz: sanitizedQuiz
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error joining quiz', error: error.message });
  }
});

// Student access quiz (for QR code access)
router.post('/student-access/:quizId', optionalAuth, async (req, res) => {
  try {
    const { name, usn } = req.body;
    const { quizId } = req.params;

    // Validate input
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!usn || !usn.trim()) {
      return res.status(400).json({ message: 'USN is required' });
    }

    // Validate name format
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return res.status(400).json({ message: 'Name should only contain alphabetic characters and spaces' });
    }

    // Validate USN format
    if (!/^[a-zA-Z0-9]+$/.test(usn)) {
      return res.status(400).json({ message: 'USN should only contain alphanumeric characters' });
    }

    const quiz = await Quiz.findOne({ _id: quizId, isActive: true });
    if (!quiz) {
      return res.status(404).json({ message: 'Invalid or inactive quiz' });
    }

    // Check if student already has an attempt for this quiz
    // For simplicity, we'll use a combination of name and USN to identify the student
    // In a real implementation, you might want a more robust student identification system
    const existingAttempt = await Attempt.findOne({
      'studentInfo.name': name,
      'studentInfo.usn': usn,
      quizId: quiz._id
    });

    if (existingAttempt) {
      return res.status(400).json({ message: 'You have already attempted this quiz' });
    }

    // Create a temporary student record if one doesn't exist
    let student = await User.findOne({ usn: usn, role: 'student' });
    
    if (!student) {
      // Create a temporary student user
      student = new User({
        name: name,
        usn: usn,
        email: `${usn}@student.edu`, // Generate email from USN
        passwordHash: 'temp-password', // This won't be used since they access via QR code
        role: 'student',
        branch: 'temp' // This would need to be collected or determined
      });
      
      // Don't save the temporary user to the database
      // Instead, we'll store the student info in the attempt
    }

    // Create attempt with student info
    const attempt = new Attempt({
      // If user is authenticated, use their ID, otherwise mark as student access
      userId: req.user ? req.user._id : null,
      quizId: quiz._id,
      studentInfo: {
        name: name,
        usn: usn
      },
      startedAt: new Date()
    });

    await attempt.save();

    // Return quiz details without correct answers
    const sanitizedQuiz = {
      id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      timingMode: quiz.timingMode,
      totalDuration: quiz.totalDuration,
      questions: quiz.questions.map(q => ({
        _id: q._id,
        question: q.question,
        type: q.type,
        options: q.options.map(opt => ({
          text: opt.text,
          // Don't include isCorrect in response
        })),
        points: q.points,
        timeLimit: q.timeLimit,
        imageUrl: q.imageUrl // Include imageUrl in response
      }))
    };

    res.json({
      message: 'Quiz access granted',
      quiz: sanitizedQuiz,
      attemptId: attempt._id
    });
  } catch (error) {
    console.error('Error in student access:', error);
    res.status(500).json({ message: 'Error accessing quiz', error: error.message });
  }
});

// Submit Quiz
router.post('/submit', auth, async (req, res) => {
  try {
    const { attemptId, quizId, answers } = req.body;

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Check if user is authorized to submit this attempt
    if (req.user) {
      // Authenticated user
      if (attempt.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else {
      // QR code student - they should have studentInfo
      if (!attempt.studentInfo) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ message: 'Quiz already submitted' });
    }

    // Get quiz with correct answers
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Validate answers and calculate score
    let totalScore = 0;
    let earnedScore = 0;

    answers.forEach(userAnswer => {
      const question = quiz.questions.find(q => q._id.toString() === userAnswer.questionId.toString());
      if (!question) return;

      totalScore += question.points;

      const correctOptions = question.options
        .filter(opt => opt.isCorrect)
        .map(opt => opt.text)
        .sort()
        .join(',');

      const selectedOptions = (Array.isArray(userAnswer.selectedOptions) ? userAnswer.selectedOptions : []).sort().join(',');

      const isCorrect = correctOptions === selectedOptions && correctOptions.length > 0;
      const pointsEarned = isCorrect ? question.points : 0;
      earnedScore += pointsEarned;

      attempt.answers.push({
        questionId: userAnswer.questionId,
        selectedOptions: Array.isArray(userAnswer.selectedOptions) ? userAnswer.selectedOptions : [],
        isCorrect,
        pointsEarned,
        timeSpent: userAnswer.timeSpent || 0
      });
    });

    attempt.score = earnedScore;
    attempt.totalScore = totalScore;
    attempt.status = 'completed';
    attempt.completedAt = new Date();
    attempt.timeSpent = Math.floor((attempt.completedAt - attempt.startedAt) / 1000);

    await attempt.save();

    res.json({
      message: 'Quiz submitted successfully',
      result: {
        score: earnedScore,
        totalScore: totalScore,
        percentage: Math.round((earnedScore / totalScore) * 100),
        submittedAt: attempt.completedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting quiz', error: error.message });
  }
});

// Get Quiz Result
router.get('/result/:attemptId', auth, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId)
      .populate('quizId', 'title questions')
      .populate('userId', 'name email');

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (attempt.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Format result with correct answers
    const result = {
      quiz: {
        title: attempt.quizId.title,
        id: attempt.quizId._id
      },
      student: {
        name: attempt.userId.name,
        email: attempt.userId.email
      },
      score: attempt.score,
      totalScore: attempt.totalScore,
      percentage: Math.round((attempt.score / attempt.totalScore) * 100),
      submittedAt: attempt.submittedAt,
      timeSpent: attempt.timeSpent,
      answers: attempt.answers.map((ans, idx) => {
        const question = attempt.quizId.questions[idx];
        return {
          question: question.question,
          type: question.type,
          selectedOptions: ans.selectedOptions,
          correctOptions: question.options
            .filter(opt => opt.isCorrect)
            .map(opt => opt.text),
          isCorrect: ans.isCorrect,
          pointsEarned: ans.pointsEarned,
          totalPoints: question.points
        };
      })
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching result', error: error.message });
  }
});

// Get All Quizzes (for dashboard)
router.get('/all', auth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isActive: true })
      .select('title description timingMode totalDuration questions createdAt createdBy scheduledDate scheduledTime')
      .populate('createdBy', 'name');

    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
  }
});

// Get Single Quiz by ID (with full details for editing)
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('GET /:id - Quiz ID:', req.params.id);
    console.log('User:', req.user._id, 'Role:', req.user.role);
    
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      console.log('Quiz not found in database');
      return res.status(404).json({ message: 'Quiz not found' });
    }

    console.log('Quiz found:', quiz.title, 'Created by:', quiz.createdBy);

    // Only teacher who created it can view full details
    if (req.user.role !== 'teacher') {
      console.log('User is not a teacher');
      return res.status(403).json({ message: 'Unauthorized: Only teachers can edit quizzes' });
    }
    
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      console.log('User is not the creator of this quiz');
      return res.status(403).json({ message: 'Unauthorized: You can only edit your own quizzes' });
    }

    console.log('Access granted, returning quiz data');
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Error fetching quiz', error: error.message });
  }
});

// Delete Quiz
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('DELETE request - Quiz ID:', req.params.id);
    console.log('User:', req.user._id, 'Role:', req.user.role);
    
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      console.log('Quiz not found in database');
      return res.status(404).json({ message: 'Quiz not found' });
    }

    console.log('Quiz found:', quiz.title, 'Created by:', quiz.createdBy);

    // Only teacher who created it can delete
    if (req.user.role !== 'teacher') {
      console.log('User is not a teacher');
      return res.status(403).json({ message: 'Unauthorized: Only teachers can delete quizzes' });
    }
    
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      console.log('User is not the creator of this quiz');
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own quizzes' });
    }

    // Delete all attempts for this quiz
    const deletedAttempts = await Attempt.deleteMany({ quizId: quiz._id });
    console.log('Deleted attempts:', deletedAttempts.deletedCount);

    // Delete the quiz
    await quiz.deleteOne();

    console.log('Quiz deleted successfully');
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ message: 'Error deleting quiz', error: error.message });
  }
});

// Get Quiz Analytics for Teacher Dashboard
router.get('/analytics/:quizId', auth, async (req, res) => {
  try {
    // Only teachers can access analytics
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access analytics' });
    }

    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if the teacher created this quiz
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You can only view analytics for your own quizzes' });
    }

    // Get all attempts for this quiz
    const attempts = await Attempt.find({ quizId: quiz._id })
      .populate('userId', 'name email');

    if (attempts.length === 0) {
      return res.json({
        quiz: {
          id: quiz._id,
          title: quiz.title,
          questionsCount: quiz.questions.length,
          totalPoints: quiz.questions.reduce((total, q) => total + q.points, 0)
        },
        analytics: {
          totalAttempts: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          completionRate: 0,
          scoreDistribution: []
        },
        attempts: []
      });
    }

    // Calculate analytics
    const scores = attempts.map(attempt => attempt.score);
    const totalScores = attempts.map(attempt => attempt.totalScore);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const completedAttempts = attempts.filter(attempt => attempt.status === 'completed').length;
    const completionRate = (completedAttempts / attempts.length) * 100;

    // Score distribution (grouped by ranges)
    const scoreDistribution = [];
    const maxScore = Math.max(...totalScores);
    const ranges = [
      { min: 0, max: 25, label: '0-25%' },
      { min: 25, max: 50, label: '25-50%' },
      { min: 50, max: 75, label: '50-75%' },
      { min: 75, max: 100, label: '75-100%' }
    ];

    ranges.forEach(range => {
      const count = attempts.filter(attempt => {
        const percentage = (attempt.score / attempt.totalScore) * 100;
        return percentage >= range.min && percentage < range.max;
      }).length;
      scoreDistribution.push({
        range: range.label,
        count: count,
        percentage: attempts.length > 0 ? (count / attempts.length) * 100 : 0
      });
    });

    // Prepare response data
    const responseData = {
      quiz: {
        id: quiz._id,
        title: quiz.title,
        questionsCount: quiz.questions.length,
        totalPoints: quiz.questions.reduce((total, q) => total + q.points, 0)
      },
      analytics: {
        totalAttempts: attempts.length,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: highestScore,
        lowestScore: lowestScore,
        completionRate: Math.round(completionRate * 100) / 100,
        scoreDistribution: scoreDistribution
      },
      attempts: attempts.map(attempt => ({
        id: attempt._id,
        student: {
          name: attempt.userId.name,
          email: attempt.userId.email
        },
        score: attempt.score,
        totalScore: attempt.totalScore,
        percentage: attempt.totalScore > 0 ? Math.round((attempt.score / attempt.totalScore) * 10000) / 100 : 0,
        submittedAt: attempt.submittedAt,
        timeSpent: attempt.timeSpent,
        status: attempt.status
      }))
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching quiz analytics:', error);
    res.status(500).json({ message: 'Error fetching quiz analytics', error: error.message });
  }
});

// Get quiz details for a specific attempt (for QR code students)
router.get('/attempt/:attemptId', optionalAuth, async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await Attempt.findById(attemptId)
      .populate('quizId');

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Check if the attempt belongs to the user or is a QR code attempt
    if (req.user) {
      // Authenticated user - check if they own this attempt
      if (attempt.userId && attempt.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else {
      // QR code student - check if they have student info
      if (!attempt.studentInfo) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    // Return quiz details without correct answers
    const sanitizedQuiz = {
      id: attempt.quizId._id,
      title: attempt.quizId.title,
      description: attempt.quizId.description,
      timingMode: attempt.quizId.timingMode,
      totalDuration: attempt.quizId.totalDuration,
      questions: attempt.quizId.questions.map(q => ({
        _id: q._id,
        question: q.question,
        type: q.type,
        options: q.options.map(opt => ({
          text: opt.text,
          // Don't include isCorrect in response
        })),
        points: q.points,
        timeLimit: q.timeLimit,
        imageUrl: q.imageUrl // Include imageUrl in response
      }))
    };

    res.json({
      message: 'Quiz details retrieved',
      quiz: sanitizedQuiz,
      attemptId: attempt._id
    });
  } catch (error) {
    console.error('Error fetching quiz for attempt:', error);
    res.status(500).json({ message: 'Error fetching quiz details', error: error.message });
  }
});

// Update Quiz
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, questions, timingMode, totalDuration, scheduledDate, scheduledTime } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Quiz title is required' });
    }

    // Validate scheduled date and time are provided
    if (!scheduledDate) {
      return res.status(400).json({ message: 'Scheduled date is required' });
    }

    if (!scheduledTime) {
      return res.status(400).json({ message: 'Scheduled time is required' });
    }

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Only teacher who created it can update
    if (req.user.role !== 'teacher' || quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Validate questions
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'At least one question is required' });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || q.question.trim() === '') {
        return res.status(400).json({ message: `Question ${i + 1}: Question text is required` });
      }
      
      if (!q.type || !['single', 'multiple'].includes(q.type)) {
        return res.status(400).json({ message: `Question ${i + 1}: Invalid question type` });
      }
      
      if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ message: `Question ${i + 1}: At least 2 options are required` });
      }
      
      // Validate options
      for (let j = 0; j < q.options.length; j++) {
        const option = q.options[j];
        if (!option.text || option.text.trim() === '') {
          return res.status(400).json({ message: `Question ${i + 1}, Option ${j + 1}: Option text is required` });
        }
      }
      
      // Check if at least one option is marked as correct
      if (!q.options.some(opt => opt.isCorrect)) {
        return res.status(400).json({ message: `Question ${i + 1}: At least one option must be marked as correct` });
      }
      
      // Validate points
      if (q.points === undefined || q.points < 1) {
        return res.status(400).json({ message: `Question ${i + 1}: Points must be at least 1` });
      }
      
      // Validate timeLimit for per-question mode
      if (timingMode === 'per-question' && q.timeLimit !== undefined && q.timeLimit < 10) {
        return res.status(400).json({ message: `Question ${i + 1}: Time limit must be at least 10 seconds` });
      }
    }

    // Update quiz fields
    quiz.title = title;
    quiz.description = description;
    quiz.questions = questions;
    quiz.timingMode = timingMode;
    quiz.totalDuration = totalDuration;
    quiz.scheduledDate = scheduledDate || null;
    quiz.scheduledTime = scheduledTime || null;

    await quiz.save();

    res.json({
      message: 'Quiz updated successfully',
      quiz: {
        id: quiz._id,
        title: quiz.title,
        questionsCount: quiz.questions.length,
        timingMode: quiz.timingMode,
        totalDuration: quiz.totalDuration,
        scheduledDate: quiz.scheduledDate,
        scheduledTime: quiz.scheduledTime
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating quiz', error: error.message });
  }
});

module.exports = router;
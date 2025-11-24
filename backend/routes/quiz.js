const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { generateAccessKey } = require('../utils/accessKeyGenerator');

// Create Quiz
router.post('/create', auth, async (req, res) => {
  try {
    // Only teachers can create quizzes
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create quizzes' });
    }

    const { 
      title, 
      description, 
      questions, 
      timingMode, 
      totalDuration, 
      scheduledDate, 
      scheduledTime,
      isActive = false // Default to false, teacher can manually activate later
    } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Quiz title is required' });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'At least one question is required' });
    }

    if (!timingMode || !['total', 'per-question'].includes(timingMode)) {
      return res.status(400).json({ message: 'Invalid timing mode' });
    }

    if (totalDuration === undefined || totalDuration === null || totalDuration <= 0) {
      return res.status(400).json({ message: 'Valid total duration is required' });
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || !q.question.trim()) {
        return res.status(400).json({ message: `Question ${i + 1}: Question text is required` });
      }
      
      if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ message: `Question ${i + 1}: At least 2 options are required` });
      }
      
      // Validate options
      for (let j = 0; j < q.options.length; j++) {
        const option = q.options[j];
        if (!option.text || !option.text.trim()) {
          return res.status(400).json({ message: `Question ${i + 1}, Option ${j + 1}: Option text is required` });
        }
      }
      
      // Check if at least one option is marked as correct
      if (!q.options.some(opt => opt.isCorrect)) {
        return res.status(400).json({ message: `Question ${i + 1}: At least one option must be marked as correct` });
      }
      
      // Validate points
      if (q.points === undefined || q.points === null || q.points <= 0) {
        return res.status(400).json({ message: `Question ${i + 1}: Valid points value is required` });
      }
      
      // Validate timeLimit for per-question mode
      if (timingMode === 'per-question') {
        if (q.timeLimit === undefined || q.timeLimit === null || q.timeLimit <= 0) {
          return res.status(400).json({ message: `Question ${i + 1}: Valid time limit is required for per-question mode` });
        }
      }
    }

    // Generate a unique access key for the quiz
    const accessKey = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create quiz with proper structure
    const quiz = new Quiz({
      title: title.trim(),
      description: description ? description.trim() : '',
      createdBy: req.user._id,
      questions: questions.map(q => ({
        question: q.question.trim(),
        type: q.type,
        options: q.options.map(opt => ({
          text: opt.text.trim(),
          isCorrect: opt.isCorrect
        })),
        points: q.points,
        timeLimit: timingMode === 'per-question' ? q.timeLimit : null,
        imageUrl: q.imageUrl || null
      })),
      timingMode,
      totalDuration,
      isActive, // Use the provided isActive value or default to false
      showResults: false,
      scheduledDate: scheduledDate || null,
      scheduledTime: scheduledTime || null,
      accessKey
    });

    // Save quiz to database - handle database errors
    try {
      await quiz.save();
    } catch (saveError) {
      console.error('Error saving quiz:', saveError);
      return res.status(500).json({ message: 'Error creating quiz. Please try again.' });
    }

    res.status(201).json({
      message: 'Quiz created successfully',
      quiz: {
        id: quiz._id,
        title: quiz.title,
        questionsCount: quiz.questions.length,
        timingMode: quiz.timingMode,
        totalDuration: quiz.totalDuration
      }
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ message: 'Error creating quiz. Please try again.' });
  }
});

// Join Quiz (validate user can access quiz)
router.get('/join/:quizId', auth, async (req, res) => {
  try {
    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can join quizzes' });
    }
    
    // Get the quiz - handle database errors
    let quiz;
    try {
      quiz = await Quiz.findOne({ _id: req.params.quizId, isActive: true });
    } catch (dbError) {
      console.error('Database error fetching quiz:', dbError);
      return res.status(500).json({ message: 'Error joining quiz. Please try again.' });
    }
    
    if (!quiz) {
      return res.status(404).json({ message: 'Invalid or inactive quiz' });
    }

    // For authenticated users, check if already attempted
    if (req.user) {
      // Check if student already has an attempt for this quiz - handle database errors
      let existingAttempt;
      try {
        existingAttempt = await Attempt.findOne({
          userId: req.user._id,
          quizId: quiz._id
        });
      } catch (dbError) {
        console.error('Database error checking existing attempt:', dbError);
        return res.status(500).json({ message: 'Error joining quiz. Please try again.' });
      }
      
      if (existingAttempt) {
        // If attempt exists but is abandoned, allow re-attempt
        if (existingAttempt.status === 'abandoned') {
          // Create a new attempt
          const attempt = new Attempt({
            userId: req.user._id,
            quizId: quiz._id,
            studentInfo: {
              name: req.user.name,
              usn: req.user.usn
            },
            startedAt: new Date()
          });
          
          try {
            await attempt.save();
          } catch (saveError) {
            console.error('Error saving attempt:', saveError);
            return res.status(500).json({ message: 'Error joining quiz. Please try again.' });
          }
          
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
          
          return res.json({
            message: 'Quiz joined successfully',
            quiz: sanitizedQuiz,
            attemptId: attempt._id
          });
        } else {
          return res.status(400).json({ message: 'You have already attempted this quiz' });
        }
      }
    }

    // Create attempt - handle database errors
    const attempt = new Attempt({
      userId: req.user._id,
      quizId: quiz._id,
      studentInfo: {
        name: req.user.name,
        usn: req.user.usn
      },
      startedAt: new Date()
    });

    try {
      await attempt.save();
    } catch (saveError) {
      console.error('Error saving attempt:', saveError);
      return res.status(500).json({ message: 'Error joining quiz. Please try again.' });
    }

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
  } catch (error) {
    console.error('Error joining quiz:', error);
    res.status(500).json({ message: 'Error joining quiz. Please try again.' });
  }
});

// Student access quiz (for QR code access)
router.post('/student-access/:quizId', optionalAuth, async (req, res) => {
  try {
    const { usn, password, accessKey } = req.body;
    const { quizId } = req.params;

    // Validate input
    if (!usn || !usn.trim()) {
      return res.status(400).json({ message: 'USN is required' });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (!accessKey || !accessKey.trim()) {
      return res.status(400).json({ message: 'Access key is required' });
    }

    // Validate USN format
    if (!/^[a-zA-Z0-9]+$/.test(usn)) {
      return res.status(400).json({ message: 'USN should only contain alphanumeric characters' });
    }

    // Find the student by USN - handle database errors
    let student;
    try {
      student = await User.findOne({ usn: usn.trim(), role: 'student' });
    } catch (dbError) {
      console.error('Database error fetching student:', dbError);
      return res.status(500).json({ message: 'Error accessing quiz. Please try again.' });
    }

    if (!student) {
      return res.status(401).json({ message: 'Invalid USN or password. Please check your credentials and try again.' });
    }

    // Verify password - handle errors
    try {
      const isPasswordValid = await student.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid USN or password. Please check your credentials and try again.' });
      }
    } catch (passwordError) {
      console.error('Error verifying password:', passwordError);
      return res.status(500).json({ message: 'Error accessing quiz. Please try again.' });
    }

    // Get the quiz - handle database errors
    let quiz;
    try {
      quiz = await Quiz.findOne({ _id: quizId, isActive: true });
    } catch (dbError) {
      console.error('Database error fetching quiz:', dbError);
      return res.status(500).json({ message: 'Error accessing quiz. Please try again.' });
    }

    if (!quiz) {
      return res.status(404).json({ message: 'Invalid or inactive quiz' });
    }

    // Validate access key - handle missing accessKey field
    const quizAccessKey = quiz.accessKey || '';
    if (accessKey.trim() !== quizAccessKey.trim()) {
      return res.status(401).json({ message: 'Invalid access key. Please check with your teacher.' });
    }

    // Check if student already has an attempt for this quiz - handle database errors
    let existingAttempt;
    try {
      existingAttempt = await Attempt.findOne({
        userId: student._id,
        quizId: quiz._id
      });
    } catch (dbError) {
      console.error('Database error checking existing attempt:', dbError);
      return res.status(500).json({ message: 'Error accessing quiz. Please try again.' });
    }

    if (existingAttempt) {
      return res.status(400).json({ message: 'You have already attempted this quiz' });
    }

    // Create attempt with student info - handle database errors
    const attempt = new Attempt({
      userId: student._id,
      quizId: quiz._id,
      studentInfo: {
        name: student.name,
        usn: student.usn
      },
      startedAt: new Date()
    });

    try {
      await attempt.save();
    } catch (saveError) {
      console.error('Error saving attempt:', saveError);
      return res.status(500).json({ message: 'Error accessing quiz. Please try again.' });
    }

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
    res.status(500).json({ message: 'Error accessing quiz. Please try again.' });
  }
});

// Submit Quiz
router.post('/submit', optionalAuth, async (req, res) => {
  try {
    const { attemptId, quizId, answers } = req.body;

    // Get attempt - handle database errors
    let attempt;
    try {
      attempt = await Attempt.findById(attemptId);
    } catch (dbError) {
      console.error('Database error fetching attempt:', dbError);
      return res.status(500).json({ message: 'Error submitting quiz. Please try again.' });
    }

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Check if user is authorized to submit this attempt
    if (req.user) {
      // Authenticated user - check if they are a student
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can submit quizzes' });
      }
      
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

    // Get quiz with correct answers - handle database errors
    let quiz;
    try {
      quiz = await Quiz.findById(quizId);
    } catch (dbError) {
      console.error('Database error fetching quiz:', dbError);
      return res.status(500).json({ message: 'Error submitting quiz. Please try again.' });
    }

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Validate answers and calculate score
    let totalScore = 0;
    let earnedScore = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0; // Includes unanswered questions

    // Calculate total possible score from quiz questions
    totalScore = quiz.questions.reduce((total, question) => total + question.points, 0);

    // Process each question in the quiz
    quiz.questions.forEach((question, index) => {
      // Find the user's answer for this question
      const userAnswer = answers.find(ans => ans.questionId.toString() === question._id.toString());
      
      // If no answer was provided, treat it as wrong
      if (!userAnswer || !userAnswer.selectedOptions || userAnswer.selectedOptions.length === 0) {
        wrongAnswers++;
        attempt.answers.push({
          questionId: question._id,
          selectedOptions: [],
          isCorrect: false,
          pointsEarned: 0,
          timeSpent: userAnswer ? userAnswer.timeSpent || 0 : 0
        });
        return;
      }

      // Check if the answer is correct
      const correctOptions = question.options
        .filter(opt => opt.isCorrect)
        .map(opt => opt.text)
        .sort()
        .join(',');

      const selectedOptions = (Array.isArray(userAnswer.selectedOptions) ? userAnswer.selectedOptions : []).sort().join(',');

      const isCorrect = correctOptions === selectedOptions && correctOptions.length > 0;
      
      if (isCorrect) {
        correctAnswers++;
        earnedScore += question.points;
      } else {
        wrongAnswers++;
      }

      attempt.answers.push({
        questionId: userAnswer.questionId,
        selectedOptions: Array.isArray(userAnswer.selectedOptions) ? userAnswer.selectedOptions : [],
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0,
        timeSpent: userAnswer.timeSpent || 0
      });
    });

    attempt.score = earnedScore;
    attempt.totalScore = totalScore;
    attempt.status = 'completed';
    attempt.completedAt = new Date();
    attempt.timeSpent = Math.floor((attempt.completedAt - attempt.startedAt) / 1000);

    // Save attempt - handle database errors
    try {
      await attempt.save();
    } catch (saveError) {
      console.error('Error saving attempt:', saveError);
      return res.status(500).json({ message: 'Error submitting quiz. Please try again.' });
    }

    res.json({
      message: 'Quiz submitted successfully',
      result: {
        score: earnedScore,
        totalScore: totalScore,
        correctAnswers: correctAnswers,
        wrongAnswers: wrongAnswers,
        totalQuestions: quiz.questions.length,
        percentage: totalScore > 0 ? Math.round((earnedScore / totalScore) * 100) : 0,
        submittedAt: attempt.completedAt
      }
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ message: 'Error submitting quiz. Please try again.' });
  }
});

// Get Quiz Result
router.get('/result/:attemptId', optionalAuth, async (req, res) => {
  try {
    // Get attempt - handle database errors
    let attempt;
    try {
      attempt = await Attempt.findById(req.params.attemptId)
        .populate('quizId', 'title questions')
        .populate('userId', 'name email');
    } catch (dbError) {
      console.error('Database error fetching attempt:', dbError);
      return res.status(500).json({ message: 'Error fetching result. Please try again.' });
    }

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // If user is authenticated, check if they own the attempt
    // If user is not authenticated (QR code student), allow access (they have the direct link)
    if (req.user) {
      if (attempt.userId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }
    // For unauthenticated users, we rely on the fact that they have the direct link to the attempt ID

    // Calculate statistics
    let correctAnswers = 0;
    let wrongAnswers = 0;
    
    attempt.answers.forEach(answer => {
      if (answer.isCorrect) {
        correctAnswers++;
      } else {
        wrongAnswers++;
      }
    });

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
      correctAnswers: correctAnswers,
      wrongAnswers: wrongAnswers,
      totalQuestions: attempt.quizId.questions.length,
      percentage: attempt.totalScore > 0 ? Math.round((attempt.score / attempt.totalScore) * 100) : 0,
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
    console.error('Error fetching result:', error);
    res.status(500).json({ message: 'Error fetching result. Please try again.' });
  }
});

// Get all quizzes for teacher dashboard
router.get('/all', auth, async (req, res) => {
  try {
    // Only teachers can access this endpoint
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access this resource' });
    }

    // Get all quizzes created by this teacher (both active and inactive)
    let quizzes;
    try {
      quizzes = await Quiz.find({ 
        createdBy: req.user._id  // Filter by teacher ID
      })
        .select('title description timingMode totalDuration questions createdAt createdBy scheduledDate scheduledTime accessKey isActive')
        .populate('createdBy', 'name');
    } catch (dbError) {
      console.error('Database error fetching quizzes:', dbError);
      return res.status(500).json({ 
        message: 'Error fetching quizzes. Please try again.' 
      });
    }

    // Log the quizzes to see what's being returned
    console.log('Fetched quizzes for user:', req.user._id);
    console.log('Number of quizzes found:', quizzes.length);
    
    quizzes.forEach(quiz => {
      console.log(`- ${quiz.title}: ${quiz.accessKey}`);
    });
    
    // Log the actual data being sent
    console.log('Sending quiz data to frontend:', JSON.stringify(quizzes, null, 2));

    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching quizzes. Please try again.', 
      // Don't expose stack trace in production
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Get student's past quiz attempts with results
router.get('/my-attempts', auth, async (req, res) => {
  try {
    // Only students can access this endpoint
    if (req.user.role !== 'student') {
      return res.status(403).json({ 
        message: `Access denied. You don't have permission to view quiz attempts. Your role is "${req.user.role}", but this feature requires "student" role.` 
      });
    }

    console.log('Fetching quiz attempts for student:', req.user._id, req.user.name);
    
    // Get attempts - handle database errors
    let attempts;
    try {
      attempts = await Attempt.find({ 
        userId: req.user._id,
        status: 'completed' 
      })
        .populate('quizId', 'title description timingMode totalDuration scheduledDate scheduledTime')
        .sort({ submittedAt: -1 });
    } catch (dbError) {
      console.error('Database error fetching student attempts:', dbError);
      return res.status(500).json({ 
        message: 'Error fetching attempts. Please try again.' 
      });
    }

    console.log('Number of attempts found:', attempts.length);

    // Format the response
    const formattedAttempts = attempts.map(attempt => ({
      attemptId: attempt._id,
      quiz: {
        _id: attempt.quizId._id,
        title: attempt.quizId.title,
        description: attempt.quizId.description,
        timingMode: attempt.quizId.timingMode,
        totalDuration: attempt.quizId.totalDuration,
        scheduledDate: attempt.quizId.scheduledDate,
        scheduledTime: attempt.quizId.scheduledTime
      },
      score: attempt.score,
      totalScore: attempt.totalScore,
      percentage: attempt.totalScore > 0 ? Math.round((attempt.score / attempt.totalScore) * 100) : 0,
      submittedAt: attempt.submittedAt,
      timeSpent: attempt.timeSpent,
      tabSwitches: attempt.tabSwitches,
      status: attempt.status
    }));

    res.json(formattedAttempts);
  } catch (error) {
    console.error('Error fetching student attempts:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching attempts. Please try again.', 
      // Don't expose stack trace in production
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Get Single Quiz by ID (with full details for editing)
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('GET /:id - Quiz ID:', req.params.id);
    console.log('User:', req.user._id, 'Role:', req.user.role);
    
    // Get quiz - handle database errors
    let quiz;
    try {
      quiz = await Quiz.findById(req.params.id);
    } catch (dbError) {
      console.error('Database error fetching quiz:', dbError);
      return res.status(500).json({ message: 'Error fetching quiz. Please try again.' });
    }
    
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
    res.status(500).json({ message: 'Error fetching quiz. Please try again.' });
  }
});

// Delete Quiz
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('DELETE request - Quiz ID:', req.params.id);
    console.log('User:', req.user._id, 'Role:', req.user.role);
    
    // Validate quiz ID
    if (!req.params.id) {
      console.log('Quiz ID is missing');
      return res.status(400).json({ message: 'Quiz ID is required' });
    }
    
    // Validate if ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid quiz ID format');
      return res.status(400).json({ message: 'Invalid quiz ID format' });
    }
    
    // Get quiz - handle database errors
    let quiz;
    try {
      quiz = await Quiz.findById(req.params.id);
    } catch (dbError) {
      console.error('Database error fetching quiz:', dbError);
      return res.status(500).json({ message: 'Error deleting quiz. Please try again.' });
    }
    
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

    // Delete related attempts first to prevent orphaned records
    try {
      const deletedAttempts = await Attempt.deleteMany({ quizId: quiz._id });
      console.log(`Deleted ${deletedAttempts.deletedCount} related attempts`);
    } catch (attemptError) {
      console.error('Error deleting related attempts:', attemptError);
      return res.status(500).json({ message: 'Error deleting quiz. Please try again.' });
    }

    // Delete quiz using findByIdAndDelete for proper Mongoose handling
    try {
      await Quiz.findByIdAndDelete(req.params.id);
    } catch (deleteError) {
      console.error('Error deleting quiz:', deleteError);
      return res.status(500).json({ message: 'Error deleting quiz. Please try again.' });
    }

    console.log('Quiz deleted successfully');
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ message: 'Error deleting quiz. Please try again.' });
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
      .populate('userId', 'name email usn');

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
          totalStudents: 0,
          submittedStudents: 0,
          notSubmittedStudents: 0,
          passedStudents: 0,
          failedStudents: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          completionRate: 0,
          passRate: 0
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
    
    // Pass/Fail statistics (assuming 50% is the pass mark)
    const PASS_THRESHOLD = 33;
    const passedAttempts = attempts.filter(attempt => {
      if (attempt.totalScore > 0) {
        const percentage = (attempt.score / attempt.totalScore) * 100;
        return percentage >= PASS_THRESHOLD;
      }
      return false;
    }).length;
    const failedAttempts = completedAttempts - passedAttempts;
    const passRate = completedAttempts > 0 ? (passedAttempts / completedAttempts) * 100 : 0;

    // Student statistics
    const totalStudents = attempts.length;
    const submittedStudents = completedAttempts;
    const notSubmittedStudents = totalStudents - submittedStudents;

    // Prepare response data - handle both registered users and QR code students
    const responseData = {
      quiz: {
        id: quiz._id,
        title: quiz.title,
        questionsCount: quiz.questions.length,
        totalPoints: quiz.questions.reduce((total, q) => total + q.points, 0)
      },
      analytics: {
        totalAttempts: attempts.length,
        totalStudents: totalStudents,
        submittedStudents: submittedStudents,
        notSubmittedStudents: notSubmittedStudents,
        passedStudents: passedAttempts,
        failedStudents: failedAttempts,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: highestScore,
        lowestScore: lowestScore,
        completionRate: Math.round(completionRate * 100) / 100,
        passRate: Math.round(passRate * 100) / 100
      },
      attempts: attempts.map(attempt => {
        // Handle both registered users and QR code students
        let studentName, studentEmail;
        
        if (attempt.userId) {
          // Registered user
          studentName = attempt.userId.name;
          studentEmail = attempt.userId.email || attempt.userId.usn + '@student.quizquest.com';
        } else if (attempt.studentInfo) {
          // QR code student
          studentName = attempt.studentInfo.name;
          studentEmail = attempt.studentInfo.usn ? attempt.studentInfo.usn + '@student.quizquest.com' : 'N/A';
        } else {
          studentName = 'Unknown Student';
          studentEmail = 'N/A';
        }

        // Calculate pass/fail for this attempt
        let isPassed = false;
        if (attempt.totalScore > 0 && attempt.status === 'completed') {
          const percentage = (attempt.score / attempt.totalScore) * 100;
          isPassed = percentage >= PASS_THRESHOLD;
        }

        return {
          id: attempt._id,
          student: {
            name: studentName,
            email: studentEmail
          },
          score: attempt.score,
          totalScore: attempt.totalScore,
          percentage: attempt.totalScore > 0 ? Math.round((attempt.score / attempt.totalScore) * 10000) / 100 : 0,
          submittedAt: attempt.submittedAt,
          timeSpent: attempt.timeSpent,
          status: attempt.status,
          isPassed: isPassed,
          answers: attempt.answers.map(answer => ({
            questionId: answer.questionId,
            selectedOptions: answer.selectedOptions,
            isCorrect: answer.isCorrect,
            pointsEarned: answer.pointsEarned,
            timeSpent: answer.timeSpent
          }))
        };
      })
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

    // Get attempt - handle database errors
    let attempt;
    try {
      attempt = await Attempt.findById(attemptId)
        .populate('quizId');
    } catch (dbError) {
      console.error('Database error fetching attempt:', dbError);
      return res.status(500).json({ message: 'Error fetching quiz details. Please try again.' });
    }

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Check if the attempt belongs to the user or is a QR code attempt
    if (req.user) {
      // Authenticated user - check if they are a student
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can access quiz attempts' });
      }
      
      // Check if they own this attempt
      // For QR code students who later register, they might have both userId and studentInfo
      if (attempt.userId && attempt.userId.toString() !== req.user._id.toString()) {
        // If there's a userId but it doesn't match, check if it's a QR code student
        if (!attempt.studentInfo) {
          return res.status(403).json({ message: 'Unauthorized' });
        }
      }
      // If userId matches or there's studentInfo, allow access
    } else {
      // QR code student - check if they have student info or userId (for cases where they accessed via QR but have an account)
      if (!attempt.studentInfo && !attempt.userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    // Check if quiz exists
    if (!attempt.quizId) {
      return res.status(404).json({ message: 'Quiz not found for this attempt' });
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
    res.status(500).json({ message: 'Error fetching quiz details. Please try again.' });
  }
});

// Get Quiz Details for Access Page (public endpoint)
router.get('/details/:quizId', optionalAuth, async (req, res) => {
  try {
    // Get quiz - handle database errors
    let quiz;
    try {
      quiz = await Quiz.findById(req.params.quizId);
    } catch (dbError) {
      console.error('Database error fetching quiz:', dbError);
      return res.status(500).json({ message: 'Error fetching quiz details. Please try again.' });
    }
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check if quiz is active
    if (!quiz.isActive) {
      // Check if quiz has actually ended (has an actualEndTime)
      if (quiz.actualEndTime && new Date(quiz.actualEndTime) < new Date()) {
        return res.status(400).json({ 
          message: `The quiz '${quiz.title}' has ended.`,
          subtitle: 'This quiz is no longer accessible.',
          status: 'ended',
          title: quiz.title,
          timingMode: quiz.timingMode,
          totalDuration: quiz.totalDuration,
          questionsCount: quiz.questions.length,
          scheduledDate: quiz.scheduledDate,
          scheduledTime: quiz.scheduledTime
        });
      }
      
      // Check if quiz is manually scheduled (no scheduled date/time)
      if (!quiz.scheduledDate && !quiz.scheduledTime) {
        return res.status(400).json({ 
          message: 'Quiz not yet started by the teacher.',
          status: 'not_started',
          isManuallyScheduled: true,
          title: quiz.title,
          description: quiz.description,
          timingMode: quiz.timingMode,
          totalDuration: quiz.totalDuration,
          questionsCount: quiz.questions.length,
          scheduledDate: quiz.scheduledDate,
          scheduledTime: quiz.scheduledTime
        });
      }
      
      // For date/time scheduled quizzes that are not active
      const now = new Date();
      const scheduledDate = new Date(quiz.scheduledDate);
      
      // Set time to midnight for date comparison
      scheduledDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if quiz is scheduled for today or in the future
      if (scheduledDate > today) {
        // Quiz is scheduled for a future date
        // Create scheduled start time in ISO format
        const [scheduledHours, scheduledMinutes] = quiz.scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(scheduledHours, scheduledMinutes, 0, 0);
        
        return res.status(400).json({
          message: 'Quiz is scheduled. Countdown to start:',
          status: 'not_started',
          isManuallyScheduled: false,
          title: quiz.title,
          description: quiz.description,
          timingMode: quiz.timingMode,
          totalDuration: quiz.totalDuration,
          questionsCount: quiz.questions.length,
          scheduledDate: quiz.scheduledDate,
          scheduledTime: quiz.scheduledTime,
          scheduledStartTime: scheduledDateTime.toISOString()
        });
      }
      
      if (scheduledDate.getTime() === today.getTime()) {
        // Quiz is scheduled for today, check time
        const [scheduledHours, scheduledMinutes] = quiz.scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date();
        scheduledDateTime.setHours(scheduledHours, scheduledMinutes, 0, 0);
        
        if (now < scheduledDateTime) {
          // Quiz hasn't started yet today
          // Create scheduled start time in ISO format
          const scheduledDateTimeISO = new Date(scheduledDate);
          scheduledDateTimeISO.setHours(scheduledHours, scheduledMinutes, 0, 0);
          
          return res.status(400).json({
            message: 'Quiz is scheduled. Countdown to start:',
            status: 'not_started',
            isManuallyScheduled: false,
            title: quiz.title,
            description: quiz.description,
            timingMode: quiz.timingMode,
            totalDuration: quiz.totalDuration,
            questionsCount: quiz.questions.length,
            scheduledDate: quiz.scheduledDate,
            scheduledTime: quiz.scheduledTime,
            scheduledStartTime: scheduledDateTimeISO.toISOString()
          });
        }
      }
      
      // If we get here, the quiz is inactive but should be active based on schedule
      return res.status(400).json({ 
        message: 'Quiz is not active',
        status: 'inactive'
      });
    }
    
    // If quiz is active, return quiz details
    const quizDetails = {
      id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      timingMode: quiz.timingMode,
      totalDuration: quiz.totalDuration,
      questionsCount: quiz.questions.length,
      scheduledDate: quiz.scheduledDate,
      scheduledTime: quiz.scheduledTime,
      accessKey: quiz.accessKey
    };
    
    res.json(quizDetails);
  } catch (error) {
    console.error('Error fetching quiz details:', error);
    res.status(500).json({ message: 'Error fetching quiz details. Please try again.' });
  }
});

// Validate Access Key (public endpoint)
router.post('/validate-access-key/:quizId', async (req, res) => {
  try {
    const { accessKey } = req.body;
    const { quizId } = req.params;

    // Validate input - handle missing or empty access key
    if (!accessKey || !accessKey.trim()) {
      return res.status(200).json({ 
        success: false, 
        message: 'Access key is required' 
      });
    }

    // Get the quiz - handle database errors
    let quiz;
    try {
      quiz = await Quiz.findOne({ _id: quizId, isActive: true });
    } catch (dbError) {
      console.error('Database error fetching quiz:', dbError);
      return res.status(200).json({ 
        success: false, 
        message: 'Invalid access key' 
      });
    }

    // Check if quiz exists
    if (!quiz) {
      return res.status(200).json({ 
        success: false, 
        message: 'Invalid or inactive quiz' 
      });
    }

    // Validate access key - handle missing accessKey field
    const quizAccessKey = quiz.accessKey || '';
    const isValid = accessKey.trim() === quizAccessKey.trim();
    
    if (isValid) {
      res.json({
        success: true,
        quizId: quiz._id
      });
    } else {
      // For invalid access keys, return 200 with success: false to avoid triggering error handlers
      return res.status(200).json({
        success: false,
        message: 'Invalid access key. Please check with your teacher.'
      });
    }
  } catch (error) {
    console.error('Error validating access key:', error);
    // Don't expose internal errors to client
    return res.status(200).json({ 
      success: false, 
      message: 'An error occurred while validating the access key. Please try again.' 
    });
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

    // Get quiz - handle database errors
    let quiz;
    try {
      quiz = await Quiz.findById(req.params.id);
    } catch (dbError) {
      console.error('Database error fetching quiz:', dbError);
      return res.status(500).json({ message: 'Error updating quiz. Please try again.' });
    }

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

    // Update quiz fields - handle database errors
    try {
      // Update quiz fields
      quiz.title = title;
      quiz.description = description;
      quiz.questions = questions;
      quiz.timingMode = timingMode;
      quiz.totalDuration = totalDuration;
      quiz.scheduledDate = scheduledDate || null;
      quiz.scheduledTime = scheduledTime || null;

      await quiz.save();
    } catch (saveError) {
      console.error('Error saving quiz:', saveError);
      return res.status(500).json({ message: 'Error updating quiz. Please try again.' });
    }

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
    res.status(500).json({ message: 'Error updating quiz. Please try again.' });
  }
});

// Manually activate a quiz (override scheduled time)
router.put('/:id/activate', auth, async (req, res) => {
  try {
    // Only teachers can activate quizzes
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can activate quizzes' });
    }

    // Get quiz
    let quiz;
    try {
      quiz = await Quiz.findById(req.params.id);
    } catch (dbError) {
      console.error('Database error fetching quiz:', dbError);
      return res.status(500).json({ message: 'Error activating quiz. Please try again.' });
    }

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if the teacher created this quiz
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You can only activate your own quizzes' });
    }

    // Check if quiz is already active
    if (quiz.isActive) {
      return res.status(400).json({ message: 'Quiz is already active' });
    }

    // Check if quiz has scheduled date and time
    if (quiz.scheduledDate && quiz.scheduledTime) {
      const now = new Date();
      const scheduledDate = new Date(quiz.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if scheduled for today
      if (scheduledDate.getTime() === today.getTime()) {
        const [scheduledHours, scheduledMinutes] = quiz.scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date();
        scheduledDateTime.setHours(scheduledHours, scheduledMinutes, 0, 0);

        // Check if trying to start early
        if (now < scheduledDateTime) {
          // Return early start warning instead of activating
          return res.status(400).json({
            message: 'early_start_warning',
            scheduledStartTime: scheduledDateTime,
            quiz: quiz
          });
        }
      } else if (scheduledDate > today) {
        // Quiz is scheduled for future date - return early start warning
        const [scheduledHours, scheduledMinutes] = quiz.scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(scheduledHours, scheduledMinutes, 0, 0);
        
        return res.status(400).json({
          message: 'early_start_warning',
          scheduledStartTime: scheduledDateTime,
          quiz: quiz
        });
      }
    }

    // Activate the quiz with actual start time
    quiz.isActive = true;
    quiz.actualStartTime = new Date();
    
    try {
      await quiz.save();
    } catch (saveError) {
      console.error('Error saving quiz:', saveError);
      return res.status(500).json({ message: 'Error activating quiz. Please try again.' });
    }

    res.json({
      message: 'Quiz activated successfully',
      quiz: quiz
    });
  } catch (error) {
    console.error('Error activating quiz:', error);
    res.status(500).json({ message: 'Error activating quiz. Please try again.' });
  }
});

// Handle early start confirmation
router.put('/:id/activate-early', auth, async (req, res) => {
  try {
    // Only teachers can activate quizzes
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can activate quizzes' });
    }

    // Get quiz
    let quiz;
    try {
      quiz = await Quiz.findById(req.params.id);
    } catch (dbError) {
      console.error('Database error fetching quiz:', dbError);
      return res.status(500).json({ message: 'Error activating quiz. Please try again.' });
    }

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if the teacher created this quiz
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You can only activate your own quizzes' });
    }

    // Check if quiz is already active
    if (quiz.isActive) {
      return res.status(400).json({ message: 'Quiz is already active' });
    }

    // Activate the quiz with actual start time and mark as early start
    quiz.isActive = true;
    quiz.actualStartTime = new Date();
    quiz.earlyStart = true;
    
    try {
      await quiz.save();
    } catch (saveError) {
      console.error('Error saving quiz:', saveError);
      return res.status(500).json({ message: 'Error activating quiz. Please try again.' });
    }

    res.json({
      message: 'Quiz activated successfully with early start',
      quiz: quiz
    });
  } catch (error) {
    console.error('Error activating quiz:', error);
    res.status(500).json({ message: 'Error activating quiz. Please try again.' });
  }
});

// Manually deactivate a quiz (end quiz early)
router.put('/:id/deactivate', auth, async (req, res) => {
  try {
    // Only teachers can deactivate quizzes
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can deactivate quizzes' });
    }

    // Get quiz
    let quiz;
    try {
      quiz = await Quiz.findById(req.params.id);
    } catch (dbError) {
      console.error('Database error fetching quiz:', dbError);
      return res.status(500).json({ message: 'Error deactivating quiz. Please try again.' });
    }

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if the teacher created this quiz
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You can only deactivate your own quizzes' });
    }

    // Check if quiz is already inactive
    if (!quiz.isActive) {
      return res.status(400).json({ message: 'Quiz is already inactive' });
    }

    // Check if quiz has scheduled date and time
    if (quiz.scheduledDate && quiz.scheduledTime) {
      const now = new Date();
      const scheduledDate = new Date(quiz.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if scheduled for today
      if (scheduledDate.getTime() === today.getTime()) {
        const [scheduledHours, scheduledMinutes] = quiz.scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date();
        scheduledDateTime.setHours(scheduledHours, scheduledMinutes, 0, 0);
        const endTime = new Date(scheduledDateTime.getTime() + quiz.totalDuration * 60000);

        // Check if trying to end early
        if (now < endTime) {
          // Return early end warning instead of deactivating
          return res.status(400).json({
            message: 'early_end_warning',
            scheduledEndTime: endTime,
            quiz: quiz
          });
        }
      } else if (scheduledDate > today) {
        // Quiz is scheduled for future date - it can be ended early
        const [scheduledHours, scheduledMinutes] = quiz.scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(scheduledHours, scheduledMinutes, 0, 0);
        const endTime = new Date(scheduledDateTime.getTime() + quiz.totalDuration * 60000);
        
        return res.status(400).json({
          message: 'early_end_warning',
          scheduledEndTime: endTime,
          quiz: quiz
        });
      } else if (scheduledDate < today) {
        // Quiz is scheduled for past date - check if it's still within duration
        const [scheduledHours, scheduledMinutes] = quiz.scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(scheduledHours, scheduledMinutes, 0, 0);
        const endTime = new Date(scheduledDateTime.getTime() + quiz.totalDuration * 60000);

        // Check if trying to end early
        if (now < endTime) {
          // Return early end warning instead of deactivating
          return res.status(400).json({
            message: 'early_end_warning',
            scheduledEndTime: endTime,
            quiz: quiz
          });
        }
      }
    }

    // Deactivate the quiz with actual end time
    quiz.isActive = false;
    quiz.actualEndTime = new Date();
    
    try {
      await quiz.save();
    } catch (saveError) {
      console.error('Error saving quiz:', saveError);
      return res.status(500).json({ message: 'Error deactivating quiz. Please try again.' });
    }

    res.json({
      message: 'Quiz deactivated successfully',
      quiz: quiz
    });
  } catch (error) {
    console.error('Error deactivating quiz:', error);
    res.status(500).json({ message: 'Error deactivating quiz. Please try again.' });
  }
});

// Handle early end confirmation
router.put('/:id/deactivate-early', auth, async (req, res) => {
  try {
    // Only teachers can deactivate quizzes
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can deactivate quizzes' });
    }

    // Get quiz
    let quiz;
    try {
      quiz = await Quiz.findById(req.params.id);
    } catch (dbError) {
      console.error('Database error fetching quiz:', dbError);
      return res.status(500).json({ message: 'Error deactivating quiz. Please try again.' });
    }

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if the teacher created this quiz
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You can only deactivate your own quizzes' });
    }

    // Check if quiz is already inactive
    if (!quiz.isActive) {
      return res.status(400).json({ message: 'Quiz is already inactive' });
    }

    // Deactivate the quiz with actual end time and mark as early end
    quiz.isActive = false;
    quiz.actualEndTime = new Date();
    quiz.earlyEnd = true;
    
    try {
      await quiz.save();
    } catch (saveError) {
      console.error('Error saving quiz:', saveError);
      return res.status(500).json({ message: 'Error deactivating quiz. Please try again.' });
    }

    res.json({
      message: 'Quiz deactivated successfully with early end',
      quiz: quiz
    });
  } catch (error) {
    console.error('Error deactivating quiz:', error);
    res.status(500).json({ message: 'Error deactivating quiz. Please try again.' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const QuestionBank = require('../models/QuestionBank');
const auth = require('../middleware/auth');

// Get all subjects with question counts (for dropdown)
router.get('/subjects', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access question bank' });
    }

    const subjectsWithCounts = await QuestionBank.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$subject",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          subject: "$_id",
          count: 1
        }
      },
      { $sort: { subject: 1 } }
    ]);
    
    res.json(subjectsWithCounts);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Error fetching subjects', error: error.message });
  }
});

// Get all questions (with optional subject filter)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access question bank' });
    }

    const { subject } = req.query;
    const filter = { isActive: true };
    
    if (subject) {
      filter.subject = subject;
    }

    const questions = await QuestionBank.find(filter)
      .sort({ createdAt: -1 });
    
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// Get random questions by subject
router.get('/random/:subject/:count', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access question bank' });
    }

    const { subject, count } = req.params;
    const questionCount = parseInt(count);

    if (isNaN(questionCount) || questionCount < 1) {
      return res.status(400).json({ message: 'Invalid question count' });
    }

    console.log('Fetching random questions for subject:', subject, 'count:', questionCount);
    
    // First, let's check how many questions exist for this subject
    const totalQuestions = await QuestionBank.countDocuments({
      subject: subject,
      isActive: true
    });
    
    console.log('Total questions available for subject:', totalQuestions);
    
    if (totalQuestions === 0) {
      return res.status(404).json({ message: `No questions found for subject: ${subject}` });
    }

    const questions = await QuestionBank.aggregate([
      { 
        $match: { 
          subject: subject,
          isActive: true
        }
      },
      { $sample: { size: questionCount } }
    ]);
    
    console.log('Questions fetched from aggregation:', questions.length);

    res.json(questions);
  } catch (error) {
    console.error('Error fetching random questions:', error);
    res.status(500).json({ message: 'Error fetching random questions', error: error.message });
  }
});

// Create a new question
router.post('/create', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create questions' });
    }

    const { subject, question, type, options, points, imageUrl } = req.body;

    // Validation
    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: 'Subject is required' });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question text is required' });
    }

    if (!type || !['single', 'multiple'].includes(type)) {
      return res.status(400).json({ message: 'Invalid question type' });
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: 'At least 2 options are required' });
    }

    // Validate options
    for (let i = 0; i < options.length; i++) {
      if (!options[i].text || options[i].text.trim() === '') {
        return res.status(400).json({ message: `Option ${i + 1}: Text is required` });
      }
    }

    // Check if at least one option is marked as correct
    if (!options.some(opt => opt.isCorrect)) {
      return res.status(400).json({ message: 'At least one option must be marked as correct' });
    }

    const newQuestion = new QuestionBank({
      subject: subject.trim(),
      question: question.trim(),
      type,
      options,
      points: points || 1,
      // Removed difficulty field as per requirement
      imageUrl: imageUrl || '',
      createdBy: req.user._id
    });

    await newQuestion.save();

    res.status(201).json({
      message: 'Question created successfully',
      question: newQuestion
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ message: 'Error creating question', error: error.message });
  }
});

// Bulk create questions
router.post('/bulk-create', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create questions' });
    }

    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Questions array is required' });
    }

    // Add createdBy to all questions
    const questionsWithCreator = questions.map(q => ({
      ...q,
      createdBy: req.user._id
    }));

    const createdQuestions = await QuestionBank.insertMany(questionsWithCreator);

    res.status(201).json({
      message: `${createdQuestions.length} questions created successfully`,
      questions: createdQuestions
    });
  } catch (error) {
    console.error('Error bulk creating questions:', error);
    res.status(500).json({ message: 'Error creating questions', error: error.message });
  }
});

// Update a question
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can update questions' });
    }

    const question = await QuestionBank.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own questions' });
    }

    const { subject, question: questionText, type, options, points, imageUrl } = req.body;

    if (subject) question.subject = subject.trim();
    if (questionText) question.question = questionText.trim();
    if (type) question.type = type;
    if (options) question.options = options;
    if (points) question.points = points;
    // Removed difficulty field as per requirement
    if (imageUrl !== undefined) question.imageUrl = imageUrl;

    await question.save();

    res.json({
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ message: 'Error updating question', error: error.message });
  }
});

// Delete a question
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can delete questions' });
    }

    const question = await QuestionBank.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own questions' });
    }

    // Soft delete
    question.isActive = false;
    await question.save();

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Error deleting question', error: error.message });
  }
});

module.exports = router;
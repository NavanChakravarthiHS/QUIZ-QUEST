import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizService, questionBankService } from '../services/authService';

function CreateQuiz({ user }) {
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timingMode, setTimingMode] = useState('total');
  const [totalDuration, setTotalDuration] = useState(10); // 10 minutes default for total time mode
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [activationMode, setActivationMode] = useState('scheduled'); // 'scheduled' or 'manual'
  const [questions, setQuestions] = useState([
    {
      id: `question-${Date.now()}-${Math.random()}`,
      question: '',
      type: 'single',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      points: 1,
      imageUrl: ''
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Question Bank integration
  const [useQuestionBank, setUseQuestionBank] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [questionCount, setQuestionCount] = useState(10);

  // Set default scheduled date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().split('T')[0];
    setScheduledDate(formattedDate);
    
    // Set default time to 10:00 AM
    setScheduledTime('10:00');
    
    // Fetch subjects for question bank
    fetchSubjects();
  }, []);
  
  const fetchSubjects = async () => {
    try {
      const response = await questionBankService.getAllSubjects();
      // Extract just the subject names from the new data structure
      const subjectNames = response.data.map(item => item.subject);
      setSubjects(subjectNames);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };
  
  const loadQuestionsFromBank = async () => {
    if (!selectedSubject) {
      setError('Please select a subject');
      return;
    }
    
    if (questionCount < 1) {
      setError('Please select at least 1 question');
      return;
    }
    
    try {
      console.log('Loading questions from bank for subject:', selectedSubject, 'count:', questionCount);
      const response = await questionBankService.getRandomQuestions(selectedSubject, questionCount);
      console.log('Response from backend:', response);
      const bankQuestions = response.data;
      
      if (bankQuestions.length === 0) {
        setError(`No questions found for subject: ${selectedSubject}`);
        return;
      }
      
      console.log('Bank questions received:', bankQuestions);
      
      // Convert bank questions to quiz format
      const formattedQuestions = bankQuestions.map(q => ({
        id: q._id || `question-${Date.now()}-${Math.random()}`,
        question: q.question,
        type: q.type,
        options: q.options,
        points: q.points,
        imageUrl: q.imageUrl || ''
      }));
      
      console.log('Formatted questions:', formattedQuestions);
      
      setQuestions(formattedQuestions);
      setSuccess(`Loaded ${formattedQuestions.length} questions from ${selectedSubject}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error loading questions from bank:', err);
      console.error('Error details:', err.response?.data);
      setError('Failed to load questions from bank: ' + (err.response?.data?.message || err.message));
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: `question-${Date.now()}-${Math.random()}`,
      question: '',
      type: 'single',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      points: 1,
      imageUrl: ''
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== questionId));
    } else {
      setError('At least one question is required');
    }
  };

  const updateQuestion = (questionId, field, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const addOption = (questionId) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? {
        ...q,
        options: [...q.options, { text: '', isCorrect: false }]
      } : q
    ));
  };

  const removeOption = (questionId, optionIndex) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        // Prevent removing if only 2 options left
        if (q.options.length <= 2) {
          setError('At least 2 options are required');
          return q;
        }
        return {
          ...q,
          options: q.options.filter((_, index) => index !== optionIndex)
        };
      }
      return q;
    }));
  };

  const updateOption = (questionId, optionIndex, field, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? {
        ...q,
        options: q.options.map((opt, idx) => 
          idx === optionIndex ? { ...opt, [field]: value } : opt
        )
      } : q
    ));
  };

  // Handle image upload (simulated - in a real app, you would upload to a server)
  const handleImageUpload = (questionId, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateQuestion(questionId, 'imageUrl', e.target.result);
        setSuccess('Image uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!title.trim()) {
      setError('Please enter a quiz title');
      setLoading(false);
      return;
    }

    // Validate scheduled date and time are provided when using scheduled mode
    if (activationMode === 'scheduled') {
      if (!scheduledDate) {
        setError('Please select a scheduled date for the quiz');
        setLoading(false);
        return;
      }

      if (!scheduledTime) {
        setError('Please select a scheduled time for the quiz');
        setLoading(false);
        return;
      }
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1}: Please enter the question text`);
        setLoading(false);
        return;
      }
      if (q.options.length < 2) {
        setError(`Question ${i + 1}: Please add at least 2 options`);
        setLoading(false);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          setError(`Question ${i + 1}, Option ${j + 1}: Please enter option text`);
          setLoading(false);
          return;
        }
      }
      if (!q.options.some(opt => opt.isCorrect)) {
        setError(`Question ${i + 1}: Please mark at least one option as correct`);
        setLoading(false);
        return;
      }
    }

    try {
      // Convert duration to seconds based on timing mode
      const durationInSeconds = timingMode === 'total' ? totalDuration * 60 : totalDuration;
      
      const quizData = {
        title,
        description,
        questions: questions.map(q => ({
          question: q.question,
          type: q.type,
          options: q.options,
          points: q.points,
          // Apply default per-question time when in per-question mode
          timeLimit: timingMode === 'per-question' ? totalDuration : null,
          imageUrl: q.imageUrl || null // Include image URL if present
        })),
        timingMode,
        totalDuration: durationInSeconds,
        // Only include scheduled date/time if using scheduled mode
        scheduledDate: activationMode === 'scheduled' ? scheduledDate || null : null,
        scheduledTime: activationMode === 'scheduled' ? scheduledTime || null : null,
        // Quiz is inactive by default when created, teacher can activate manually
        isActive: false
      };

      const response = await quizService.createQuiz(quizData);

      setSuccess('Quiz created successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (value, isMinutesMode) => {
    if (isMinutesMode) {
      const minutes = Math.floor(value);
      const seconds = Math.round((value - minutes) * 60);
      if (seconds === 0) {
        return `${minutes} min`;
      }
      return `${minutes} min ${seconds}s`;
    } else {
      const mins = Math.floor(value / 60);
      const secs = value % 60;
      return `${mins} min ${secs}s`;
    }
  };

  const getTotalMarks = () => {
    return questions.reduce((total, q) => total + q.points, 0);
  };

  const getTotalPoints = () => {
    return questions.reduce((total, q) => total + q.points, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Quiz</h1>
            <p className="text-gray-600">Design your quiz with customizable questions and timing</p>
          </div>
        </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Quiz Basic Info */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Quiz Information
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive quiz title"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Give your quiz a clear and descriptive title</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter quiz description (optional)"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">Provide details about what this quiz covers</p>
          </div>

          {/* Activation Mode */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activation Mode
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="activationMode"
                  value="scheduled"
                  checked={activationMode === 'scheduled'}
                  onChange={(e) => setActivationMode(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2">Scheduled Activation</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="activationMode"
                  value="manual"
                  checked={activationMode === 'manual'}
                  onChange={(e) => setActivationMode(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2">Manual Activation</span>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {activationMode === 'scheduled' 
                ? 'Quiz will automatically activate at the scheduled date and time' 
                : 'Quiz will remain inactive until you manually activate it'}
            </p>
          </div>

          {/* Scheduled Date and Time (only shown when scheduled mode is selected) */}
          {activationMode === 'scheduled' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Select the date when the quiz will be conducted</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Time *
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Select the time when the quiz will be conducted</p>
              </div>
            </div>
          )}

          {/* Quiz Timing Mode */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Quiz Timing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timing Mode
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="timingMode"
                      value="total"
                      checked={timingMode === 'total'}
                      onChange={(e) => setTimingMode(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">Total Time for Quiz</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="timingMode"
                      value="per-question"
                      checked={timingMode === 'per-question'}
                      onChange={(e) => setTimingMode(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">Time Per Question</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {timingMode === 'total' ? 'Total Duration (minutes)' : 'Time Per Question (seconds)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalDuration}
                  onChange={(e) => setTotalDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {timingMode === 'total' 
                    ? 'Total time allowed for the entire quiz' 
                    : 'Time allowed for each individual question'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Question Bank Integration */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Question Bank
          </h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useQuestionBank"
                checked={useQuestionBank}
                onChange={(e) => setUseQuestionBank(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useQuestionBank" className="ml-2 block text-sm text-gray-700">
                Load questions from question bank
              </label>
            </div>
          </div>
          
          {useQuestionBank && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={loadQuestionsFromBank}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Load Questions
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Questions Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Questions ({questions.length})
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Question
            </button>
          </div>
          
          <div className="space-y-6">
            {questions.map((question, questionIndex) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-800">
                    Question {questionIndex + 1}
                  </h3>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text
                  </label>
                  <textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                    placeholder="Enter your question"
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Type
                    </label>
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="single">Single Choice</option>
                      <option value="multiple">Multiple Choice</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={question.points}
                      onChange={(e) => updateQuestion(question.id, 'points', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-start">
                        <div className="flex items-center h-5 mt-1">
                          <input
                            type={question.type === 'single' ? 'radio' : 'checkbox'}
                            name={`question-${question.id}-correct`}
                            checked={option.isCorrect}
                            onChange={(e) => updateOption(question.id, optionIndex, 'isCorrect', e.target.checked)}
                            className={`h-4 w-4 ${question.type === 'single' ? 'text-blue-600 focus:ring-blue-500' : 'text-green-600 focus:ring-green-500'} border-gray-300`}
                          />
                        </div>
                        <div className="ml-3 flex-grow">
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(question.id, optionIndex, 'text', e.target.value)}
                            placeholder={`Option ${optionIndex + 1}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(question.id, optionIndex)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addOption(question.id)}
                    className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <svg className="-ml-1 mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Option
                  </button>
                </div>
                
                {/* <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image (Optional)
                  </label>
                  {question.imageUrl ? (
                    <div className="flex items-center">
                      <img src={question.imageUrl} alt="Question" className="h-20 w-20 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => updateQuestion(question.id, 'imageUrl', '')}
                        className="ml-4 text-red-600 hover:text-red-800"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(question.id, e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div> */}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Section */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-lg font-medium text-gray-800">
            Total Marks: <span className="font-bold">{getTotalMarks()}</span>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {loading ? 'Creating...' : 'Create Quiz'}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
);
}

export default CreateQuiz;
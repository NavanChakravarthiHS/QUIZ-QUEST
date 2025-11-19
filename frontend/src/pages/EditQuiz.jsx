import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quizService, questionBankService } from '../services/authService';

function EditQuiz({ user }) {
  const navigate = useNavigate();
  const { quizId } = useParams();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timingMode, setTimingMode] = useState('total');
  const [totalDuration, setTotalDuration] = useState(10); // Default to 10 minutes for total time mode
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Question Bank integration
  const [useQuestionBank, setUseQuestionBank] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [questionCount, setQuestionCount] = useState(10);

  useEffect(() => {
    loadQuiz();
    fetchSubjects(); // Fetch subjects for question bank
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await quizService.getQuizById(quizId);
      const data = response.data;
      
      if (!data) {
        throw new Error('No quiz data received');
      }
      
      setTitle(data.title);
      setDescription(data.description || '');
      setTimingMode(data.timingMode);
      
      // Set scheduled date and time if available
      if (data.scheduledDate) {
        // Format date as YYYY-MM-DD for input field
        const dateObj = new Date(data.scheduledDate);
        // Handle potential timezone issues by using UTC date
        const formattedDate = dateObj.toISOString().split('T')[0];
        setScheduledDate(formattedDate);
      } else {
        // Set default scheduled date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const formattedDate = tomorrow.toISOString().split('T')[0];
        setScheduledDate(formattedDate);
      }
      
      if (data.scheduledTime) {
        setScheduledTime(data.scheduledTime);
      } else {
        // Set default time to 10:00 AM
        setScheduledTime('10:00');
      }
      
      // Convert duration from seconds to appropriate unit based on timing mode
      if (data.timingMode === 'total') {
        // Convert seconds to minutes for total time mode
        setTotalDuration(Math.floor(data.totalDuration / 60));
      } else {
        // Keep seconds for per-question mode
        setTotalDuration(data.totalDuration);
      }
      
      // Convert questions to editable format - use _id if available, else generate unique ID
      if (data.questions && data.questions.length > 0) {
        const editableQuestions = data.questions.map((q, index) => ({
          id: q._id ? q._id.toString() : `question-${Date.now()}-${index}-${Math.random()}`,
          question: q.question || '',
          type: q.type || 'single',
          options: Array.isArray(q.options) && q.options.length > 0 
            ? q.options.map((opt, optIdx) => ({
                text: opt.text || '',
                isCorrect: opt.isCorrect || false
              }))
            : [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
          points: q.points || 1,
          timeLimit: q.timeLimit || null,
          imageUrl: q.imageUrl || '' // Add image URL field
        }));
        setQuestions(editableQuestions);
      } else {
        // Add a default question if none exist
        setQuestions([
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
      }
    } catch (err) {
      console.error('Error loading quiz:', err);
      console.error('Error details:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load quiz. Please check your connection and ensure you have permission to edit this quiz.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);

    // Validation
    if (!title.trim()) {
      setError('Please enter a quiz title');
      setSaving(false);
      return;
    }

    // Validate scheduled date and time are provided
    if (!scheduledDate) {
      setError('Please select a scheduled date for the quiz');
      setSaving(false);
      return;
    }

    if (!scheduledTime) {
      setError('Please select a scheduled time for the quiz');
      setSaving(false);
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1}: Please enter the question text`);
        setSaving(false);
        return;
      }
      if (!q.options || q.options.length < 2) {
        setError(`Question ${i + 1}: Please add at least 2 options`);
        setSaving(false);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          setError(`Question ${i + 1}, Option ${j + 1}: Please enter option text`);
          setSaving(false);
          return;
        }
      }
      if (!q.options.some(opt => opt.isCorrect)) {
        setError(`Question ${i + 1}: Please mark at least one option as correct`);
        setSaving(false);
        return;
      }
    }

    try {
      console.log('Submitting quiz update with questions:', questions);
      
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
        scheduledDate: scheduledDate || null,
        scheduledTime: scheduledTime || null
      };
      
      console.log('Quiz data being sent:', quizData);
      
      const response = await quizService.updateQuiz(quizId, quizData);
      
      console.log('Update successful:', response);
      setSuccess('Quiz updated successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error updating quiz:', err);
      console.error('Error details:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update quiz. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading quiz...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit Quiz</h1>
            <p className="text-gray-600">Update your quiz details and questions</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
            <p className="text-sm text-gray-500 mt-1">Provide details about what this quiz covers</p>
          </div>

          {/* Scheduled Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date *
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Select the time when the quiz will be conducted</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timing Mode *
              </label>
              <select
                value={timingMode}
                onChange={(e) => setTimingMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="total">Total Time (entire quiz)</option>
                <option value="per-question">Per Question Time</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {timingMode === 'total' 
                  ? 'Set one timer for the entire quiz' 
                  : 'Set individual timers for each question'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {timingMode === 'total' ? 'Total Duration (minutes)' : 'Default Per-Question Time (seconds)'}
              </label>
              <input
                type="number"
                value={totalDuration}
                onChange={(e) => setTotalDuration(parseInt(e.target.value))}
                min={timingMode === 'total' ? "1" : "10"}
                step={timingMode === 'total' ? "1" : "5"}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {timingMode === 'total' 
                  ? formatTime(totalDuration, true) 
                  : formatTime(totalDuration, false)}
              </p>
            </div>
          </div>
        </div>

        {/* Question Bank Integration */}
        <div className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Use Question Bank
            </h2>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useQuestionBank}
                onChange={(e) => setUseQuestionBank(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          
          {useQuestionBank && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-3">
                Load questions randomly from your question bank by subject
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Subject *
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={loadQuestionsFromBank}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition font-medium"
                  >
                    Load Questions
                  </button>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 italic">
                Note: Loading questions will replace any manually added questions below
              </p>
            </div>
          )}
        </div>

        {/* Questions Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Questions
              <span className="ml-2 bg-gray-100 text-gray-800 text-sm font-medium px-2 py-1 rounded">
                {questions.length} questions
              </span>
              <span className="ml-2 bg-gray-100 text-gray-800 text-sm font-medium px-2 py-1 rounded">
                {getTotalMarks()} total marks
              </span>
            </h2>
          </div>

          <div className="space-y-6">
            {questions.map((question, qIndex) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-5">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-800">
                    Question {qIndex + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeQuestion(question.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                    disabled={questions.length <= 1}
                  >
                    Remove
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text *
                  </label>
                  <textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                    placeholder="Enter your question here..."
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="single">Single Choice</option>
                      <option value="multiple">Multiple Choice</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marks
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={question.points}
                      onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Image (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(question.id, e.target.files[0])}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded file:border-0
                        file:text-sm file:font-medium
                        file:bg-gray-100 file:text-gray-700
                        hover:file:bg-gray-200"
                    />
                    {question.imageUrl && (
                      <button
                        type="button"
                        onClick={() => updateQuestion(question.id, 'imageUrl', '')}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {question.imageUrl && (
                    <div className="mt-3">
                      <img 
                        src={question.imageUrl} 
                        alt="Question preview" 
                        className="max-w-full h-32 object-contain border border-gray-200 rounded"
                      />
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Answer Options *
                    </label>
                    <button
                      type="button"
                      onClick={() => addOption(question.id)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Add Option
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-start">
                        <div className="flex items-center h-5 mt-1">
                          <input
                            type={question.type === 'single' ? 'radio' : 'checkbox'}
                            name={`question-${qIndex}-correct`}
                            checked={option.isCorrect}
                            onChange={(e) => updateOption(question.id, optIndex, 'isCorrect', e.target.checked)}
                            className={`h-4 w-4 ${question.type === 'single' ? 'text-green-600' : 'text-purple-600'} rounded focus:ring-green-500 border-gray-300`}
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(question.id, optIndex, 'text', e.target.value)}
                            placeholder={`Option ${optIndex + 1}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOption(question.id, optIndex)}
                          className="ml-2 text-red-500 hover:text-red-700"
                          disabled={question.options.length <= 2}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {question.type === 'single' 
                      ? 'Select the radio button for the correct answer' 
                      : 'Select checkboxes for all correct answers'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Add Question Button */}
        <div className="fixed-button-container">
          <button
            type="button"
            onClick={addQuestion}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Question
          </button>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded disabled:opacity-50"
          >
            {loading ? (
              'Updating Quiz...'
            ) : (
              'Update Quiz'
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}

export default EditQuiz;
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { quizService } from '../services/authService';

function QuizPage({ user }) {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [questionTimes, setQuestionTimes] = useState({}); // Track time spent on each question
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSubmitMessage, setAutoSubmitMessage] = useState(''); // For auto-submit notifications

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setTabSwitchCount(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  // Timer effect for TOTAL duration mode
  useEffect(() => {
    if (quiz && startTime && quiz.timingMode === 'total') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit('total'); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, startTime]);

  // Timer effect for PER-QUESTION mode
  useEffect(() => {
    if (quiz && quiz.timingMode === 'per-question' && currentQuestionIndex < quiz.questions.length) {
      const questionTimeLimit = quiz.totalDuration; // Use totalDuration for per-question mode
      setTimeLeft(questionTimeLimit);
      setQuestionStartTime(Date.now());
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Check if this is the last question
            if (currentQuestionIndex === quiz.questions.length - 1) {
              // Auto-submit quiz when time expires on the last question
              handleAutoSubmit('per-question'); // Auto-submit due to time expiration
            } else {
              // Auto-move to next question when time expires (not last question)
              handleNextQuestion(true); // true indicates auto-move due to time expiration
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, currentQuestionIndex]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      
      // Check if we have an attempt ID from query parameters or localStorage
      const urlAttemptId = searchParams.get('attemptId');
      const storedAttemptId = localStorage.getItem('currentAttemptId');
      const finalAttemptId = urlAttemptId || storedAttemptId;
      
      console.log('Fetching quiz with attempt ID:', { urlAttemptId, storedAttemptId, finalAttemptId });
      
      if (finalAttemptId) {
        // This is a QR code student with an existing attempt
        const response = await quizService.getQuizForAttempt(finalAttemptId);
        console.log('Quiz for attempt response:', response.data);
        setQuiz(response.data.quiz);
        setAttemptId(finalAttemptId);
        
        // Start timer based on quiz timing mode
        if (response.data.quiz.timingMode === 'total') {
          setTimeLeft(response.data.quiz.totalDuration);
        } else {
          setTimeLeft(response.data.quiz.totalDuration);
        }
        setStartTime(Date.now());
        setQuestionStartTime(Date.now());
      } else if (user && user.role === 'student') {
        // Authenticated student user
        const response = await quizService.joinQuiz(quizId);
        console.log('Join quiz response:', response.data);
        setQuiz(response.data.quiz);
        setAttemptId(response.data.attemptId);
        
        // Start timer based on quiz timing mode
        if (response.data.quiz.timingMode === 'total') {
          setTimeLeft(response.data.quiz.totalDuration);
        } else {
          setTimeLeft(response.data.quiz.totalDuration);
        }
        setStartTime(Date.now());
        setQuestionStartTime(Date.now());
      } else if (user && user.role === 'teacher') {
        // Teacher accessing the quiz (for preview/testing)
        const response = await quizService.getQuiz(quizId);
        console.log('Teacher access response:', response.data);
        setQuiz(response.data);
        // Teachers don't have attempts, so we set a dummy attempt ID
        setAttemptId('teacher-preview');
        
        // Start timer based on quiz timing mode
        if (response.data.timingMode === 'total') {
          setTimeLeft(response.data.totalDuration);
        } else {
          setTimeLeft(response.data.totalDuration);
        }
        setStartTime(Date.now());
        setQuestionStartTime(Date.now());
      } else {
        // Redirect to student access page if not authenticated and no attempt ID
        console.log('No attempt ID found, redirecting to student access');
        navigate(`/student-access/${quizId}`);
        return;
      }
    } catch (err) {
      console.error('Error loading quiz:', err);
      
      // Handle different types of errors
      if (err.response) {
        if (err.response.status === 403) {
          setError('Unauthorized access. Please check your credentials and try again.');
        } else if (err.response.status === 404) {
          setError('Quiz or attempt not found. Please contact your teacher.');
        } else {
          setError(err.response.data.message || 'Failed to load quiz. Please try again.');
        }
      } else if (err.request) {
        setError('Unable to connect to the server. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, optionText, isMultiple = false) => {
    setAnswers(prev => {
      if (isMultiple) {
        const currentAnswers = prev[questionId] || [];
        const newAnswers = currentAnswers.includes(optionText)
          ? currentAnswers.filter(ans => ans !== optionText)
          : [...currentAnswers, optionText];
        return { ...prev, [questionId]: newAnswers };
      } else {
        return { ...prev, [questionId]: [optionText] };
      }
    });
  };

  const handleNextQuestion = (isAutoMove = false) => {
    if (isSubmitting) return; // Prevent action if already submitting
    
    // Record time spent on current question
    if (questionStartTime) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      setQuestionTimes(prev => ({
        ...prev,
        [currentQuestionIndex]: timeSpent
      }));
    }
    
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handlePreviousQuestion = () => {
    if (isSubmitting) return; // Prevent action if already submitting
    
    // In per-question mode, don't allow going back
    if (quiz.timingMode === 'per-question') {
      setError('Cannot navigate to previous questions in fixed-time mode');
      return;
    }

    // Record time spent on current question
    if (questionStartTime) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      setQuestionTimes(prev => ({
        ...prev,
        [currentQuestionIndex]: timeSpent
      }));
    }
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now());
    }
  };

  // Handle auto-submission when timer ends
  const handleAutoSubmit = (timingMode) => {
    setAutoSubmitMessage(`Time's up! Auto-submitting your quiz...`);
    // Use a shorter delay for better user experience
    setTimeout(() => {
      handleSubmit(true); // true indicates auto-submit
    }, 500); // Reduced delay to 500ms for faster response
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    // Prevent teachers from submitting quizzes
    if (user && user.role === 'teacher') {
      setError('Teachers cannot submit quizzes. This is a preview mode only.');
      return;
    }
    
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    
    try {
      // Record time spent on the last question
      if (questionStartTime) {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        setQuestionTimes(prev => ({
          ...prev,
          [currentQuestionIndex]: timeSpent
        }));
      }
      
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptions]) => {
        // Find the question index by questionId
        const questionIndex = quiz.questions.findIndex(q => q._id === questionId);
        return {
          questionId,
          selectedOptions,
          timeSpent: questionTimes[questionIndex] || 0
        };
      });
      
      console.log('Submitting quiz with data:', { attemptId, quizId: quiz.id || quiz._id, answers: formattedAnswers, tabSwitches: tabSwitchCount });

      const response = await quizService.submitQuiz({
        attemptId,
        quizId: quiz.id || quiz._id,
        answers: formattedAnswers,
        tabSwitches: tabSwitchCount
      });
      
      console.log('Quiz submission response:', response.data);

      // Clear the attempt ID from localStorage
      localStorage.removeItem('currentAttemptId');
      localStorage.removeItem('guestStudent');
      
      // Navigate to result page with the submission response data
      // Pass the response data directly to avoid additional API call
      navigate(`/result/${attemptId}`, { 
        state: { 
          resultData: response.data.result,
          quizTitle: quiz.title
        } 
      });
    } catch (err) {
      console.error('Error submitting quiz:', err);
      
      // Handle different types of errors
      if (err.response) {
        if (err.response.status === 403) {
          setError('Unauthorized access. Please check your credentials and try again.');
        } else if (err.response.status === 404) {
          setError('Quiz or attempt not found. Please contact your teacher.');
        } else if (err.response.status === 400) {
          setError('Quiz already submitted or invalid data. Please contact your teacher.');
        } else {
          setError(err.response.data.message || 'Failed to submit quiz. Please try again.');
        }
      } else if (err.request) {
        setError('Unable to connect to the server. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Minimal header for students taking quiz */}
      {user && user.role === 'student' && (
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl font-bold text-gray-900">QuizQuest</span>
                </div>
              </div>
              <div className="flex items-center">
                <div className="ml-3 relative">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-right">
                      <div className="font-medium text-gray-700">{user.name}</div>
                      <div className="text-xs text-gray-500">Student</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Auto-submit notification */}
        {autoSubmitMessage && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{autoSubmitMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-gray-600 mt-1">{quiz.description}</p>
              <div className="mt-2 inline-block">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                  {quiz.timingMode === 'total' ? 'Free Navigation Mode' : 'Fixed Time per Question'}
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-6">
              <div className={`${timeLeft < 60 && quiz.timingMode === 'total' ? 'bg-red-50' : 'bg-blue-50'} rounded-lg px-4 py-2`}>
                <div className={`text-sm font-medium ${timeLeft < 60 ? 'text-red-800' : 'text-blue-800'}`}>
                  {quiz.timingMode === 'total' ? 'Total Time' : 'Question Time'}
                </div>
                <div className={`text-xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg px-4 py-2">
                <div className="text-sm text-gray-800 font-medium">Question</div>
                <div className="text-xl font-bold text-gray-900">
                  {currentQuestionIndex + 1} / {quiz.questions.length}
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Error message within quiz */}
        {error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Question */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start mb-6">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-800 font-bold">{currentQuestionIndex + 1}</span>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">{currentQuestion.question}</h2>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">{currentQuestion.points} Marks</span>
                <span className="mx-2">•</span>
                <span>{currentQuestion.type === 'single' ? 'Single Choice' : 'Multiple Choice'}</span>
              </div>
            </div>
          </div>

          {currentQuestion.imageUrl && (
            <div className="mb-6">
              <img 
                src={currentQuestion.imageUrl} 
                alt="Question" 
                className="max-w-full h-auto rounded-lg border border-gray-200"
              />
            </div>
          )}

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = answers[currentQuestion._id] 
                ? answers[currentQuestion._id].includes(option.text) 
                : false;
              
              return (
                <div 
                  key={index}
                  onClick={() => handleAnswerSelect(currentQuestion._id, option.text, currentQuestion.type === 'multiple')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    {currentQuestion.type === 'multiple' ? (
                      <div className={`flex-shrink-0 h-5 w-5 rounded border flex items-center justify-center ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    ) : (
                      <div className={`flex-shrink-0 h-5 w-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )}
                    <span className="ml-3 text-gray-800">{option.text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            {quiz.timingMode === 'total' ? (
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0 || isSubmitting}
                className={`px-6 py-3 rounded-lg font-medium ${
                  currentQuestionIndex === 0 || isSubmitting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
            ) : (
              <div className="text-sm text-gray-500 py-3">
                Cannot navigate back in fixed-time mode
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <button
                onClick={() => handleNextQuestion(false)}
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg font-medium flex-1 sm:flex-none ${
                  isSubmitting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {quiz.timingMode === 'per-question' ? 'Next Question' : 'Next'}
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg font-medium flex-1 sm:flex-none flex items-center justify-center ${
                  isSubmitting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Quiz'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tab Switch Warning */}
        {tabSwitchCount > 0 && (
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">Warning:</span> You have switched tabs {tabSwitchCount} time(s). 
                  Please focus on the quiz to maintain integrity.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizPage;
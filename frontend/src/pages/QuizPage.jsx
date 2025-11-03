import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../services/authService';

function QuizPage({ user }) {
  const { quizId } = useParams();
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

  useEffect(() => {
    if (quiz && startTime) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit(true); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, startTime]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      
      // Check if we have an attempt ID from localStorage (for QR code students)
      const storedAttemptId = localStorage.getItem('currentAttemptId');
      
      if (storedAttemptId) {
        // This is a QR code student with an existing attempt
        const response = await quizService.getQuizForAttempt(storedAttemptId);
        setQuiz(response.quiz);
        setAttemptId(storedAttemptId);
        
        // Start timer based on quiz timing mode
        if (response.quiz.timingMode === 'total') {
          setTimeLeft(response.quiz.totalDuration);
        } else {
          setTimeLeft(response.quiz.questions[0].timeLimit);
        }
        setStartTime(Date.now());
      } else if (user) {
        // Authenticated user
        const response = await quizService.joinQuiz(quizId);
        setQuiz(response.quiz);
        setAttemptId(response.attemptId);
        
        // Start timer based on quiz timing mode
        if (response.quiz.timingMode === 'total') {
          setTimeLeft(response.quiz.totalDuration);
        } else {
          setTimeLeft(response.quiz.questions[0].timeLimit);
        }
        setStartTime(Date.now());
      } else {
        // Redirect to student access page if not authenticated and no attempt ID
        navigate(`/student-access/${quizId}`);
        return;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quiz');
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

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      
      // For per-question timing mode, reset timer
      if (quiz.timingMode === 'per-question') {
        setTimeLeft(quiz.questions[currentQuestionIndex + 1].timeLimit);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      
      // For per-question timing mode, reset timer
      if (quiz.timingMode === 'per-question') {
        setTimeLeft(quiz.questions[currentQuestionIndex - 1].timeLimit);
      }
    }
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptions]) => ({
        questionId,
        selectedOptions
      }));

      const response = await quizService.submitQuiz({
        attemptId,
        quizId: quiz._id,
        answers: formattedAnswers,
        tabSwitches: tabSwitchCount
      });

      // Clear the attempt ID from localStorage
      localStorage.removeItem('currentAttemptId');
      
      navigate(`/result/${response.result.attemptId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz');
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

  if (error) {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-gray-600 mt-1">{quiz.description}</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-6">
              <div className="bg-blue-50 rounded-lg px-4 py-2">
                <div className="text-sm text-blue-800 font-medium">Time Left</div>
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

        {/* Question */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start mb-6">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-800 font-bold">{currentQuestionIndex + 1}</span>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">{currentQuestion.question}</h2>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">{currentQuestion.points} points</span>
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
                    <div className={`flex-shrink-0 h-5 w-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
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
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-6 py-3 rounded-lg font-medium ${
                currentQuestionIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>
          </div>
          
          <div className="flex gap-4">
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Submit Quiz
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
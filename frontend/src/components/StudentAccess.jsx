import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { quizService, authService } from '../services/authService';

function StudentAccess() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [accessKey, setAccessKey] = useState('');
  const [usn, setUsn] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizDetails, setQuizDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [quizStatus, setQuizStatus] = useState(null); // 'not_started', 'ended', 'active'
  const [step, setStep] = useState('access_key'); // 'access_key', 'student_details', 'authenticated'
  const [validAccessKey, setValidAccessKey] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null); // For countdown timer

  // Check if we're coming back from login
  useEffect(() => {
    const loginSuccess = searchParams.get('loginSuccess');
    const storedAccessKey = localStorage.getItem('pendingAccessKey');
    const storedQuizId = localStorage.getItem('pendingQuizId');

    if (loginSuccess === 'true' && storedAccessKey && storedQuizId === quizId) {
      // User just logged in, proceed with quiz access
      setAccessKey(storedAccessKey);
      setValidAccessKey(true);
      setStep('authenticated');
      // Clean up localStorage
      localStorage.removeItem('pendingAccessKey');
      localStorage.removeItem('pendingQuizId');
    }
  }, [searchParams, quizId]);

  // Fetch quiz details when component mounts
  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const response = await quizService.getQuizDetails(quizId);
        setQuizDetails(response.data);
        setQuizStatus('active'); // If we get here without error, quiz is active
      } catch (err) {
        console.error('Error fetching quiz details:', err);
        if (err.response && err.response.data) {
          // Check if it's a specific status error
          if (err.response.data.status === 'not_started') {
            setQuizStatus('not_started');
            setQuizDetails({
              title: err.response.data.title || 'Quiz Not Started',
              description: err.response.data.description || err.response.data.message,
              scheduledDate: err.response.data.scheduledDate,
              scheduledTime: err.response.data.scheduledTime,
              questionsCount: err.response.data.questionsCount || 0,
              timingMode: err.response.data.timingMode || 'total',
              totalDuration: err.response.data.totalDuration || 0,
              scheduledStartTime: err.response.data.scheduledStartTime || null
            });

            // Check if it's manually scheduled
            if (err.response.data.isManuallyScheduled) {
              // For manually scheduled quizzes, don't show countdown
              setTimeLeft(null);
            } else if (err.response.data.scheduledStartTime) {
              // Calculate time until quiz starts for scheduled quizzes using ISO format
              const scheduledDateTime = new Date(err.response.data.scheduledStartTime);
              const now = new Date();
              const diffInSeconds = Math.floor((scheduledDateTime - now) / 1000);

              if (diffInSeconds > 0) {
                setTimeLeft(diffInSeconds);
              } else {
                // If the time has passed, set time to 0
                setTimeLeft(0);
              }
            } else {
              // For manually scheduled quizzes without specific date/time, show a different message
              setTimeLeft(null);
            }
          } else if (err.response.data.status === 'ended') {
            setQuizStatus('ended');
            setQuizDetails({
              title: err.response.data.title || 'Quiz Ended',
              message: err.response.data.message,
              subtitle: err.response.data.subtitle,
              questionsCount: err.response.data.questionsCount || 0,
              timingMode: err.response.data.timingMode || 'total',
              totalDuration: err.response.data.totalDuration || 0,
              scheduledDate: err.response.data.scheduledDate,
              scheduledTime: err.response.data.scheduledTime
            });
          } else {
            setError(err.response.data.message || 'Failed to load quiz details');
          }
        } else {
          setError('Failed to load quiz details');
        }
      } finally {
        setLoadingDetails(false);
      }
    };

    if (quizId) {
      fetchQuizDetails();
    }
  }, [quizId]);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // When countdown reaches zero, clear interval and update state
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeLeft]);

  const handleAccessKeySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate access key with the backend
      const response = await quizService.validateAccessKey(quizId, { accessKey });

      // Check the response format
      if (response.data.success) {
        // Store access key temporarily
        setValidAccessKey(true);
        // Move to student details step
        setStep('student_details');
      } else {
        setError(response.data.message || 'Invalid access key. Please check with your teacher.');
      }
    } catch (err) {
      console.error('Access key validation error:', err);

      if (err.response) {
        // Check if the response has the new format
        if (err.response.data && typeof err.response.data.success !== 'undefined') {
          setError(err.response.data.message || 'Invalid access key. Please check with your teacher.');
        } else {
          setError(err.response.data.message || 'An error occurred while validating the access key. Please try again.');
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

  const handleStudentDetailsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Access the quiz with access key and student credentials
      const response = await quizService.studentAccess(quizId, {
        usn,
        password,
        accessKey
      });

      // Store the attempt ID in localStorage
      localStorage.setItem('currentAttemptId', response.data.attemptId);

      // Navigate directly to the quiz page with the attempt ID
      navigate(`/quiz/${quizId}?attemptId=${response.data.attemptId}`);
    } catch (err) {
      console.error('Student access error:', err);

      if (err.response) {
        // Check if the response has the new format
        if (err.response.data && typeof err.response.data.success !== 'undefined') {
          setError(err.response.data.message || 'An error occurred while accessing the quiz. Please try again.');
        } else {
          setError(err.response.data.message || 'An error occurred while accessing the quiz. Please try again.');
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return 'Not scheduled';
    return timeString;
  };

  // Format time for countdown display (Days:Hours:Minutes:Seconds)
  const formatCountdownTime = (seconds) => {
    if (seconds === null) return '00:00:00:00';

    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get start time
  const getStartTime = () => {
    if (quizDetails?.scheduledDate && quizDetails?.scheduledTime) {
      return new Date(`${quizDetails.scheduledDate}T${quizDetails.scheduledTime}`);
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <style>{`
        .truncate-description {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        @media (max-width: 768px) {
          .truncate-description {
            -webkit-line-clamp: 3;
          }
        }
      `}</style>
      
      {/* Minimal header for students accessing quiz */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-xl font-bold text-gray-900">QuizQuest</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Quiz Access Portal</h1>
            <p className="text-gray-600 text-lg">
              {step === 'access_key' && 'Enter Access Key to begin'}
              {step === 'student_details' && 'Enter your student details'}
              {step === 'authenticated' && 'Accessing your quiz...'}
            </p>
          </div>

          {/* Main Content - Split Screen */}
          <div className="flex flex-col lg:flex-row gap-8 items-stretch">
            {/* Left Half - Quiz Details */}
            <div className="lg:w-1/2 bg-white rounded-3xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center mb-6">
                <div className="bg-indigo-100 p-3 rounded-xl mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-800">Quiz Details</h1>
              </div>

              {loadingDetails ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
                </div>
              ) : quizDetails ? (
                <div className="space-y-8">
                  <div className="border-l-4 border-indigo-500 pl-4 py-2">
                    <h2 className="text-2xl font-bold text-gray-800">{quizDetails.title}</h2>
                    {quizDetails.description && (
                      <p className="text-gray-600 mt-2 text-lg truncate-description">{quizDetails.description}</p>
                    )}
                  </div>
                  
                  {/* Ended Quiz Message */}
                  {quizStatus === 'ended' && (
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 border border-red-200 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="bg-red-100 p-3 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-red-800 mb-2">
                        {quizDetails.message || `The quiz '${quizDetails.title}' has ended.`}
                      </h3>
                      <p className="text-gray-700 text-lg">
                        {quizDetails.subtitle || 'This quiz is no longer accessible.'}
                      </p>
                    </div>
                  )}
                  
                  {/* Countdown Timer for Not Started Quizzes */}
                  {quizStatus === 'not_started' && (
                    timeLeft !== null ? (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                        <h3 className="text-xl font-bold text-amber-800 mb-4 text-center">Quiz Starts In</h3>
                        <div className="text-center mb-4">
                          <div className="text-4xl font-bold text-amber-600 mb-2 font-mono">
                            {formatCountdownTime(timeLeft)}
                          </div>
                          <div className="flex justify-center space-x-4 text-xs text-gray-600 uppercase tracking-wider">
                            <span>Days</span>
                            <span>Hours</span>
                            <span>Minutes</span>
                            <span>Seconds</span>
                          </div>
                        </div>
                        {timeLeft > 0 ? (
                          <>
                            <p className="text-center text-gray-700">
                              Quiz is scheduled. Countdown to start:
                            </p>
                            <p className="text-center text-gray-700 mt-2">
                              Please wait for the quiz to start automatically...
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-center text-gray-700 font-bold">
                              Quiz is starting... Checking status.
                            </p>
                            <p className="text-center text-gray-700 mt-2">
                              Click "Refresh Status" to check if the quiz has started.
                            </p>
                          </>
                        )}
                        <div className="text-center mt-4">
                          <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                          >
                            Refresh Status
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                        <h3 className="text-xl font-bold text-blue-800 mb-4 text-center">Quiz Not Yet Started</h3>
                        <div className="flex justify-center mb-4">
                          <div className="bg-blue-100 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-center text-gray-700">
                          Quiz not yet started by the teacher.
                        </p>
                        <p className="text-center text-gray-700 mt-2">
                          Please wait for the teacher to start the quiz.
                        </p>
                        <div className="text-center mt-4">
                          <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          >
                            Refresh Status
                          </button>
                        </div>
                      </div>
                    )
                  )}
                  
                  {/* Quiz Details Grid - Only show for active or not_started quizzes, not for ended quizzes */}
                  {quizStatus !== 'ended' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                        <div className="flex items-center mb-3">
                          <div className="bg-indigo-500 p-2 rounded-lg mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="font-bold text-indigo-800">Timing Mode</h3>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{quizDetails.timingMode}</p>
                        {quizDetails.timingMode === 'fixed' && (
                          <p className="text-gray-600 mt-1">{quizDetails.totalDuration} minutes</p>
                        )}
                      </div>
                      
                      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-5 border border-cyan-100">
                        <div className="flex items-center mb-3">
                          <div className="bg-cyan-500 p-2 rounded-lg mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <h3 className="font-bold text-cyan-800">Total Questions</h3>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{quizDetails.questionsCount}</p>
                        {/* <p className="text-gray-600 mt-1">Total Questions</p> */}
                      </div>
                      
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
                        <div className="flex items-center mb-3">
                          <div className="bg-amber-500 p-2 rounded-lg mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h3 className="font-bold text-amber-800">Scheduled Date</h3>
                        </div>
                        <p className="text-xl font-bold text-gray-800">{formatDate(quizDetails.scheduledDate)}</p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-100">
                        <div className="flex items-center mb-3">
                          <div className="bg-emerald-500 p-2 rounded-lg mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="font-bold text-emerald-800">Scheduled Time</h3>
                        </div>
                        <p className="text-xl font-bold text-gray-800">{formatTime(quizDetails.scheduledTime)}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full p-4 inline-block mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-xl">Quiz details not available</p>
                </div>
              )}
            </div>

            {/* Right Half - Access Board */}
            <div className="lg:w-1/2 bg-white rounded-3xl shadow-xl p-8 flex flex-col transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center mb-8">
                <div className="bg-cyan-100 p-3 rounded-xl mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 11-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">
                    {step === 'access_key' && 'Access Quiz'}
                    {step === 'student_details' && 'Student Details'}
                    {step === 'authenticated' && 'Accessing Quiz'}
                  </h2>
                  <p className="text-gray-600">
                    {step === 'access_key' && 'Enter the access key to begin'}
                    {step === 'student_details' && 'Enter your student credentials'}
                    {step === 'authenticated' && 'Please wait while we prepare your quiz...'}
                  </p>
                </div>
              </div>

              <div className="flex-grow flex items-center">
                <div className="w-full max-w-md mx-auto">
                  {/* Show ended message in the access form area when quiz is ended */}
                  {quizStatus === 'ended' && (
                    <div className="text-center py-8">
                      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6">
                        <div className="flex justify-center mb-4">
                          <div className="bg-red-100 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-red-800 mb-2">
                          {quizDetails.message || `The quiz '${quizDetails.title}' has ended.`}
                        </h3>
                        <p className="text-gray-700">
                          {quizDetails.subtitle || 'This quiz is no longer accessible.'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Show access forms only when quiz is not ended */}
                  {quizStatus !== 'ended' && (
                    <>
                      {step === 'access_key' && (
                        // Access Key Form
                        <form onSubmit={handleAccessKeySubmit} className="space-y-6">
                          {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 animate-fade-in">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                                  <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <label htmlFor="accessKey" className="block text-sm font-medium text-gray-700 mb-2">
                              Access Key
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 11-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                              </div>
                              <input
                                id="accessKey"
                                type="text"
                                value={accessKey}
                                onChange={(e) => setAccessKey(e.target.value)}
                                className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition font-mono"
                                placeholder="Enter access key"
                                required
                              />
                            </div>
                          </div>
                          
                          <button
                            type="submit"
                            disabled={loading || quizStatus === 'not_started'}
                            className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white transition-all duration-300 transform hover:scale-[1.02] ${loading || quizStatus === 'not_started'
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                              }`}
                          >
                            {loading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Validating...
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                Validate Access Key
                              </>
                            )}
                          </button>
                        </form>
                      )}
                      
                      {step === 'student_details' && (
                        // Student Details Form
                        <form onSubmit={handleStudentDetailsSubmit} className="space-y-6">
                          {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 animate-fade-in">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                                  <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <label htmlFor="accessKeyDisplay" className="block text-sm font-medium text-gray-700 mb-2">
                              Access Key
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 11-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                              </div>
                              <input
                                id="accessKeyDisplay"
                                type="text"
                                value={accessKey}
                                readOnly
                                className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed font-mono"
                                placeholder="Access key"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="usn" className="block text-sm font-medium text-gray-700 mb-2">
                              USN
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <input
                                id="usn"
                                type="text"
                                value={usn}
                                onChange={(e) => setUsn(e.target.value)}
                                className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                placeholder="Enter your USN"
                                required
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                              Password
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                              <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                placeholder="Enter your password"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="flex space-x-4">
                            <button
                              type="button"
                              onClick={() => setStep('access_key')}
                              className="flex-1 py-4 px-4 border border-gray-300 rounded-xl shadow-sm text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300"
                            >
                              Back
                            </button>
                            
                            <button
                              type="submit"
                              disabled={loading}
                              className={`flex-1 flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white transition-all duration-300 transform hover:scale-[1.02] ${loading
                                ? 'bg-cyan-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                                }`}
                            >
                              {loading ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Accessing...
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                  </svg>
                                  Access Quiz
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                      
                      {step === 'authenticated' && (
                        // Accessing Quiz
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500 mx-auto mb-6"></div>
                          <p className="text-gray-600 text-lg">Accessing your quiz...</p>
                          <p className="text-gray-500 mt-2">Please wait while we prepare your quiz</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="mt-10 pt-6 border-t border-gray-200 text-center">
                    <p className="text-gray-600">
                      Need help accessing your quiz?{' '}
                      <a href="#" className="font-medium text-cyan-600 hover:text-cyan-500">
                        Take help of your teacher
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentAccess;
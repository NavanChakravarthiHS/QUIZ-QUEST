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
              title: 'Quiz Not Started',
              description: err.response.data.message,
              scheduledDate: err.response.data.scheduledDate,
              scheduledTime: err.response.data.scheduledTime
            });
          } else if (err.response.data.status === 'ended') {
            setQuizStatus('ended');
            setQuizDetails({
              title: 'Quiz Ended',
              description: err.response.data.message,
              scheduledDate: null,
              scheduledTime: null
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

  // Redirect to appropriate page based on quiz status
  if (quizStatus === 'not_started') {
    return navigate(`/quiz-not-started/${quizId}`);
  }
  
  if (quizStatus === 'ended') {
    return navigate(`/quiz-ended/${quizId}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
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
                    <p className="text-gray-600 mt-2 text-lg">{quizDetails.description}</p>
                  </div>
                  
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002-2h2a2 2 0 002 2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="font-bold text-cyan-800">Questions</h3>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{quizDetails.questionsCount}</p>
                      <p className="text-gray-600 mt-1">Total Questions</p>
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
                  
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Instructions
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="bg-indigo-100 rounded-full p-1 mt-1 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700">Enter the access key provided by your instructor</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-indigo-100 rounded-full p-1 mt-1 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700">After entering a valid access key, you'll enter your student details</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-indigo-100 rounded-full p-1 mt-1 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700">Enter your USN and password to access the quiz</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-indigo-100 rounded-full p-1 mt-1 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700">Ensure you're accessing the quiz within the scheduled time</span>
                      </li>
                    </ul>
                  </div>
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
                        disabled={loading || quizStatus !== 'active'}
                        className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white transition-all duration-300 transform hover:scale-[1.02] ${
                          loading || quizStatus !== 'active'
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
                          className={`flex-1 flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white transition-all duration-300 transform hover:scale-[1.02] ${
                            loading 
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
                  
                  <div className="mt-10 pt-6 border-t border-gray-200 text-center">
                    <p className="text-gray-600">
                      Need help accessing your quiz?{' '}
                      <a href="#" className="font-medium text-cyan-600 hover:text-cyan-500">
                        Contact support
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
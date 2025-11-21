import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../services/authService';

function QuizNotStarted() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quizDetails, setQuizDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    fetchQuizDetails();
  }, [quizId]);
  
  useEffect(() => {
    let timer;
    if (timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // When countdown reaches zero, automatically refresh
            window.location.reload();
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
  
  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      const response = await quizService.getQuizDetails(quizId);
      setQuizDetails(response.data);
      
      // Calculate time until quiz starts
      if (response.data.scheduledDate && response.data.scheduledTime) {
        const scheduledDateTime = new Date(`${response.data.scheduledDate}T${response.data.scheduledTime}`);
        const now = new Date();
        const diffInSeconds = Math.floor((scheduledDateTime - now) / 1000);
        
        if (diffInSeconds > 0) {
          setTimeLeft(diffInSeconds);
        } else {
          // If the time has passed, refresh to check if quiz is now active
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError('Failed to load quiz details');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const formatTime = (seconds) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const formatTimeOnly = (timeString) => {
    if (!timeString) return 'Not scheduled';
    return timeString;
  };
  
  const getStartTime = () => {
    if (quizDetails?.scheduledDate && quizDetails?.scheduledTime) {
      return new Date(`${quizDetails.scheduledDate}T${quizDetails.scheduledTime}`);
    }
    return null;
  };
  
  if (loading && !isRefreshing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-xl">Loading quiz details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-2xl font-bold text-gray-900">Error</h3>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Quiz Not Yet Started</h1>
            <p className="text-gray-600 text-lg">This quiz is scheduled to begin at a later time</p>
          </div>
          
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-amber-100 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">{quizDetails?.title}</h2>
              <p className="text-gray-600 text-lg mb-6">{quizDetails?.description}</p>
              
              {timeLeft !== null && timeLeft > 0 ? (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 mb-6">
                  <h3 className="text-xl font-bold text-amber-800 mb-2">Time Until Quiz Starts</h3>
                  <div className="text-4xl font-bold text-amber-600 mb-2">{formatTime(timeLeft)}</div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div 
                      className="bg-amber-600 h-4 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${Math.min(100, (timeLeft / 3600) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-600 mt-2">Please wait for the quiz to begin</p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 mb-6">
                  <h3 className="text-xl font-bold text-blue-800 mb-2">Quiz Starting Soon</h3>
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
                    <p className="text-gray-600">Checking if quiz is ready to start...</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                <div className="flex items-center mb-3">
                  <div className="bg-indigo-500 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-indigo-800">Scheduled Date</h3>
                </div>
                <p className="text-2xl font-bold text-gray-800">{formatDate(quizDetails?.scheduledDate)}</p>
              </div>
              
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-100">
                <div className="flex items-center mb-3">
                  <div className="bg-cyan-500 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-cyan-800">Scheduled Time</h3>
                </div>
                <p className="text-2xl font-bold text-gray-800">{formatTimeOnly(quizDetails?.scheduledTime)}</p>
                {getStartTime() && (
                  <p className="text-sm text-gray-600 mt-1">
                    Starts at: {getStartTime().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={fetchQuizDetails}
                disabled={isRefreshing}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white focus:outline-none mr-4 ${
                  isRefreshing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Go to Home
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">What to Expect</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-1">
                  <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-gray-600">The quiz will automatically start at the scheduled time</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-1">
                  <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-gray-600">You'll be redirected to the quiz automatically when it starts</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-1">
                  <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-gray-600">Make sure you're ready and have a stable internet connection</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizNotStarted;
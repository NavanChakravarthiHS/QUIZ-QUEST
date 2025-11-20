import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { quizService } from '../services/authService';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import ShareQuizModal from '../components/ShareQuizModal';
import QRScanner from '../components/QRScanner';

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'upcoming'

  useEffect(() => {
    if (user) {
      if (user.role === 'teacher') {
        fetchQuizzes();
      } else {
        fetchMyAttempts();
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      applyFilter();
    }
  }, [quizzes, filter, user]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const response = await quizService.getAllQuizzes();
      console.log('Fetched quizzes:', response.data);
      
      // Add a small delay to ensure data is properly loaded
      setTimeout(() => {
        const quizData = response.data || [];
        setQuizzes(quizData);
        // Also update filtered quizzes to show all by default
        setFilteredQuizzes(quizData);
      }, 100);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
      console.error('Error response:', err.response);
      
      // More detailed error messaging
      let errorMessage = 'Failed to load quizzes. ';
      
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 401) {
          errorMessage += 'Authentication failed. Please log in again.';
        } else if (err.response.status === 403) {
          errorMessage += 'Access denied. You may not have permission to view quizzes.';
        } else if (err.response.status === 500) {
          errorMessage += 'Server error. Please try again later.';
        } else {
          errorMessage += err.response.data?.message || 'Unknown server error.';
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage += 'Unable to connect to the server. Please check your connection and try again.';
      } else {
        // Something else happened
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    // If no quizzes, set filtered quizzes to empty array
    if (!quizzes || quizzes.length === 0) {
      setFilteredQuizzes([]);
      return;
    }
    
    if (filter === 'all') {
      setFilteredQuizzes(quizzes);
      return;
    }

    const now = new Date();
    const filtered = quizzes.filter(quiz => {
      // Handle case where scheduledDate might be missing or invalid
      if (!quiz.scheduledDate) {
        // For 'upcoming' filter, include quizzes without scheduled date
        // For 'completed' filter, exclude quizzes without scheduled date
        return filter === 'upcoming';
      }
      
      // Convert scheduledDate to Date object if it's a string
      const scheduledDate = new Date(quiz.scheduledDate);
      
      // Check if scheduledDate is valid
      if (isNaN(scheduledDate.getTime())) {
        return filter === 'upcoming'; // Treat invalid dates as upcoming
      }
      
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      if (filter === 'completed') {
        // Quiz is completed if scheduled date is before today
        scheduledDate.setHours(0, 0, 0, 0);
        return scheduledDate < today;
      } else if (filter === 'upcoming') {
        // Quiz is upcoming if scheduled date is today or in the future
        scheduledDate.setHours(0, 0, 0, 0);
        return scheduledDate >= today;
      }
      
      return true;
    });
    
    setFilteredQuizzes(filtered);
  };

  const fetchMyAttempts = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const response = await quizService.getMyAttempts();
      const attemptData = response.data || [];
      setQuizzes(attemptData);
      // For students, we don't use filtering, so this is fine
    } catch (err) {
      console.error('Failed to load attempts:', err);
      
      // More detailed error messaging
      let errorMessage = 'Failed to load quiz history. ';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage += 'Authentication failed. Please log in again.';
        } else if (err.response.status === 500) {
          errorMessage += 'Server error. Please try again later.';
        } else {
          errorMessage += err.response.data?.message || 'Unknown server error.';
        }
      } else if (err.request) {
        errorMessage += 'Unable to connect to the server. Please check your connection and try again.';
      } else {
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQuiz = async (quizId) => {
    try {
      // Navigate directly to the quiz page
      navigate(`/quiz/${quizId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join quiz');
    }
  };

  const handleDeleteClick = (quiz) => {
    setQuizToDelete(quiz);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return;

    try {
      await quizService.deleteQuiz(quizToDelete._id);
      alert('Quiz deleted successfully!');
      fetchQuizzes(); // Refresh the list
    } catch (err) {
      console.error('Error deleting quiz:', err);
      console.error('Error response:', err.response);
      alert(err.response?.data?.message || err.message || 'Failed to delete quiz');
    } finally {
      setShowDeleteModal(false);
      setQuizToDelete(null);
    }
  };

  const handleViewAnalytics = (quiz) => {
    setSelectedQuiz(quiz);
    setShowAnalytics(true);
  };

  const handleShareQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setShowShareModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading quizzes...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">User not authenticated. Please log in.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {user.role === 'teacher' ? 'My Quizzes' : 'My Quiz History'}
            </h1>
            <p className="text-gray-600">
              {user.role === 'teacher' ? 'Manage your quizzes or create new ones' : 'View your past quiz attempts and results'}
            </p>
          </div>
        </div>

        {user.role === 'teacher' && (
          <div className="flex gap-4 mb-8 flex-wrap">
            <Link
              to="/question-bank"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition font-semibold inline-flex items-center shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Question Bank
            </Link>
            <Link
              to="/create-quiz"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-semibold inline-flex items-center shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Quiz
            </Link>
          </div>
        )}

        {user.role === 'teacher' && (
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex items-center">
              <span className="mr-2 text-gray-700 font-medium">Filter:</span>
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border border-gray-300 focus:outline-none`}
                >
                  All Quizzes
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-4 py-2 text-sm font-medium ${
                    filter === 'completed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border-t border-b border-gray-300 focus:outline-none`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setFilter('upcoming')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                    filter === 'upcoming'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border border-gray-300 focus:outline-none`}
                >
                  Upcoming
                </button>
              </div>
            </div>
          </div>
        )}

        {user.role === 'student' && (
          <div className="flex gap-4 mb-8 flex-wrap">
            <button
              onClick={() => setShowScanner(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition font-semibold inline-flex items-center shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scan QR Code
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <div className="mt-2 text-sm">
              <p>If this problem persists:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>Check your internet connection</li>
                <li>Verify the backend server is running</li>
                <li>Try logging out and logging back in</li>
                <li>Contact support if the issue continues</li>
              </ul>
            </div>
          </div>
        )}

        {user.role === 'teacher' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredQuizzes.map((quiz) => (
              <div 
                key={quiz._id} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow"
              >
                <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{quiz.title}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      Active
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{quiz.description || 'No description provided'}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium">Scheduled:</span> 
                      {quiz.scheduledDate ? (
                        <span className="ml-1">
                          {new Date(quiz.scheduledDate).toLocaleDateString()} 
                          {quiz.scheduledTime && ` at ${quiz.scheduledTime}`}
                        </span>
                      ) : (
                        <span className="ml-1 text-gray-500">Not scheduled</span>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium">Questions:</span> 
                      <span className="ml-1">{quiz.questions?.length || 0}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Duration:</span> 
                      <span className="ml-1">{Math.floor(quiz.totalDuration / 60)} minutes</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="font-medium">Mode:</span> 
                      <span className="ml-1">{quiz.timingMode === 'total' ? 'Total Time' : 'Per Question'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-5 flex-grow flex flex-col justify-end gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/edit-quiz/${quiz._id}`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleShareQuiz(quiz)}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition flex items-center justify-center"
                      title="Share Quiz"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleViewAnalytics(quiz)}
                      className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition flex items-center justify-center"
                      title="View Analytics"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(quiz)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition flex items-center justify-center"
                      title="Delete Quiz"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {user.role === 'student' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quizAttempt, index) => {
              const isAvailable = quizAttempt.status === 'available';
              const isInProgress = quizAttempt.status === 'in-progress';
              const isCompleted = quizAttempt.status === 'completed' || quizAttempt.status === 'auto-submitted';
              
              return (
                <div
                  key={quizAttempt.attemptId}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow"
                >
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{quizAttempt.quiz.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        isAvailable ? 'bg-blue-100 text-blue-800' :
                        isInProgress ? 'bg-yellow-100 text-yellow-800' :
                        isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isAvailable ? 'Available' : 
                         isInProgress ? 'In Progress' : 
                         isCompleted ? 'Completed' : 'Unknown'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{quizAttempt.quiz.description || 'No description provided'}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium">Scheduled:</span> 
                        {quizAttempt.quiz.scheduledDate ? (
                          <span className="ml-1">
                            {new Date(quizAttempt.quiz.scheduledDate).toLocaleDateString()} 
                            {quizAttempt.quiz.scheduledTime && ` at ${quizAttempt.quiz.scheduledTime}`}
                          </span>
                        ) : (
                          <span className="ml-1 text-gray-500">Not scheduled</span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium">Questions:</span> 
                        <span className="ml-1">{quizAttempt.quiz.questionsCount || 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Duration:</span> 
                        <span className="ml-1">{Math.floor(quizAttempt.quiz.totalDuration / 60)} minutes</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="font-medium">Mode:</span> 
                        <span className="ml-1">{quizAttempt.quiz.timingMode === 'total' ? 'Total Time' : 'Per Question'}</span>
                      </div>
                      
                      {/* Display score for completed quizzes */}
                      {isCompleted && quizAttempt.score !== null && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Score:</span> 
                          <span className="ml-1">{quizAttempt.score}/{quizAttempt.totalScore} ({quizAttempt.percentage}%)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-grow flex flex-col justify-end">
                    <button
                      onClick={() => handleJoinQuiz(quizAttempt.quiz._id)}
                      className={`w-full ${
                        isAvailable ? 'bg-blue-600 hover:bg-blue-700' :
                        isInProgress ? 'bg-yellow-600 hover:bg-yellow-700' :
                        isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                      } text-white px-4 py-2 rounded text-sm font-medium transition`}
                      disabled={isCompleted}
                    >
                      {isAvailable ? 'Start Quiz' : 
                       isInProgress ? 'Continue Quiz' : 
                       isCompleted ? 'View Results' : 'Access Quiz'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(user.role === 'teacher' ? filteredQuizzes : quizzes).length === 0 && !error && (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">No quizzes available</h3>
            <p className="text-gray-600 mb-6">
              {user.role === 'teacher' 
                ? 'Create your first quiz to get started' 
                : 'No quiz attempts found. Wait for your teacher to assign a quiz.'}
            </p>
            {user.role === 'teacher' && (
              <Link
                to="/create-quiz"
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Quiz
              </Link>
            )}
          </div>
        )}

        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setQuizToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          quizTitle={quizToDelete?.title || ''}
        />

        {showAnalytics && selectedQuiz && (
          <AnalyticsDashboard 
            quiz={selectedQuiz} 
            onClose={() => setShowAnalytics(false)} 
          />
        )}

        {showShareModal && selectedQuiz && (
          <ShareQuizModal 
            quiz={selectedQuiz} 
            onClose={() => setShowShareModal(false)} 
          />
        )}

        {showScanner && (
          <QRScanner onClose={() => setShowScanner(false)} />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
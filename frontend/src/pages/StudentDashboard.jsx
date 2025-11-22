import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { quizService } from '../services/authService';
import QRScanner from '../components/QRScanner';

function StudentDashboard({ user }) {
  // Redirect if user is not a student
  if (user && user.role !== 'student') {
    // This should never happen due to route protection, but just in case
    window.location.href = '/dashboard';
    return null;
  }
  
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    // Check for pending quiz access from QR code
    const pendingQuizAccess = localStorage.getItem('pendingQuizAccess');
    if (pendingQuizAccess) {
      try {
        const { quizId, usn, password, accessKey } = JSON.parse(pendingQuizAccess);
        
        // Access the quiz
        const accessQuiz = async () => {
          const response = await quizService.studentAccess(quizId, {
            usn,
            password,
            accessKey
          });
          
          console.log('Student access response:', response.data);
          
          // Store the attempt ID in localStorage
          localStorage.setItem('currentAttemptId', response.data.attemptId);
          
          // Remove pending quiz access
          localStorage.removeItem('pendingQuizAccess');
          
          // Navigate to quiz page with attempt ID as query parameter
          navigate(`/quiz/${quizId}?attemptId=${response.data.attemptId}`);
        };
        
        accessQuiz();
        return;
      } catch (err) {
        console.error('Error accessing pending quiz:', err);
        // Remove pending quiz access if there's an error
        localStorage.removeItem('pendingQuizAccess');
      }
    }
    
    // If no pending quiz access, fetch attempts as usual
    fetchMyAttempts();
  }, []);

  const fetchMyAttempts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await quizService.getMyAttempts();
      const attemptData = response.data || [];
      setAttempts(attemptData);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading quiz history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <style>{`
        .truncate-description {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          word-wrap: break-word;
          word-break: break-word;
          max-width: 200px;
        }
        
        @media (max-width: 768px) {
          .truncate-description {
            max-width: 150px;
          }
        }
        
        /* Ensure table layout is fixed to prevent overflow */
        .quiz-attempts-table {
          table-layout: fixed;
          width: 100%;
        }
        
        /* Set specific column widths to prevent overflow */
        .quiz-attempts-table th:nth-child(1),
        .quiz-attempts-table td:nth-child(1) {
          width: 30%;
        }
        
        .quiz-attempts-table th:nth-child(2),
        .quiz-attempts-table td:nth-child(2) {
          width: 15%;
        }
        
        .quiz-attempts-table th:nth-child(3),
        .quiz-attempts-table td:nth-child(3) {
          width: 15%;
        }
        
        .quiz-attempts-table th:nth-child(4),
        .quiz-attempts-table td:nth-child(4) {
          width: 15%;
        }
        
        .quiz-attempts-table th:nth-child(5),
        .quiz-attempts-table td:nth-child(5) {
          width: 25%;
        }
        
        @media (max-width: 768px) {
          .quiz-attempts-table th:nth-child(1),
          .quiz-attempts-table td:nth-child(1) {
            width: 40%;
          }
          
          .quiz-attempts-table th:nth-child(5),
          .quiz-attempts-table td:nth-child(5) {
            width: 20%;
          }
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">My Quiz History</h1>
              <p className="text-gray-600">View your past quiz attempts and results</p>
            </div>
            {user && (
              <div className="text-right bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Student</p>
                <p className="text-lg font-semibold text-gray-800">{user.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Only show when there are attempts or always show this button */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setShowScanner(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition font-semibold inline-flex items-center shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Scan QR Code to Join Quiz
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {attempts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-3 mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 11-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Attempts</p>
                  <p className="text-2xl font-bold text-gray-800">{attempts.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-3 mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-gray-800">{attempts.filter(a => a.status === 'completed').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="bg-yellow-100 rounded-full p-3 mr-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Avg. Score</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {attempts.length > 0 
                      ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / attempts.length) 
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-3 mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Best Score</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {attempts.length > 0 
                      ? Math.max(...attempts.map(a => a.percentage || 0)) 
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Attempts List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Quiz Attempts</h2>
          </div>

          {attempts.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No quiz attempts yet</h3>
              <p className="text-gray-600 mb-6">Scan a QR code to join a quiz and get started!</p>
              <button
                onClick={() => setShowScanner(true)}
                className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Scan QR Code
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full quiz-attempts-table">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quiz
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attempts.map((attempt) => (
                    <tr key={attempt.attemptId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{attempt.quiz.title}</div>
                        <div className="text-sm text-gray-500 truncate-description">{attempt.quiz.description || 'No description'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {attempt.submittedAt 
                            ? new Date(attempt.submittedAt).toLocaleDateString() 
                            : 'Not completed'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.score !== null ? (
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">{attempt.score}</span>
                            <span className="text-gray-500">/{attempt.totalScore}</span>
                            <span className="ml-2 font-semibold">({attempt.percentage}%)</span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Not scored</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          attempt.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : attempt.status === 'in-progress' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {attempt.status === 'completed' ? 'Completed' : 
                           attempt.status === 'in-progress' ? 'In Progress' : 'Available'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {attempt.status === 'completed' ? (
                          <button
                            onClick={() => navigate(`/result/${attempt.attemptId}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Results
                          </button>
                        ) : attempt.status === 'in-progress' ? (
                          <button
                            onClick={() => navigate(`/quiz/${attempt.quiz._id}?attemptId=${attempt.attemptId}`)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Continue
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/quiz/${attempt.quiz._id}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Start Quiz
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <QRScanner 
          isOpen={showScanner} 
          onClose={() => setShowScanner(false)} 
        />
      </div>
    </div>
  );
}

export default StudentDashboard;
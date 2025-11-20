import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { quizService } from '../services/authService';
import QRScanner from '../components/QRScanner';

function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    fetchMyAttempts();
  }, []);

  const fetchMyAttempts = async () => {
    try {
      const response = await quizService.getMyAttempts();
      setAttempts(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to load attempts:', err);
      setError('Failed to load quiz history: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading your quiz history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">My Quiz Dashboard</h1>
                <p className="text-gray-600">View your past quiz attempts and results</p>
              </div>
              {user && (
                <div className="text-right bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Student</p>
                  <p className="text-lg font-semibold text-gray-800">{user.name}</p>
                </div>
              )}
            </div>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                  <p className="text-gray-600 text-sm">Average Score</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {attempts.length > 0 
                      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length) 
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="bg-yellow-100 rounded-full p-3 mr-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Best Score</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage)) : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-3 mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Time</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {attempts.length > 0 
                      ? Math.round(attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / 60) 
                      : 0}m
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quiz History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">Quiz History</h2>
          </div>

          {attempts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No Quiz Attempts Yet</h3>
              <p className="text-gray-600 mb-6">Start by scanning a QR code or joining a quiz through the link provided by your teacher</p>
              {/* Removed the duplicate Scan QR Code button here to prevent double scanner */}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Quiz Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Score</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Percentage</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Time Spent</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Submitted On</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt, index) => (
                    <tr key={attempt.attemptId} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800">{attempt.quiz.title}</p>
                          <p className="text-sm text-gray-500">{attempt.quiz.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                        {attempt.score} / {attempt.totalScore}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        <span className={`px-3 py-1 rounded-full text-white ${
                          attempt.percentage >= 75 ? 'bg-green-500' :
                          attempt.percentage >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}>
                          {attempt.percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {attempt.timeSpent ? Math.round(attempt.timeSpent / 60) : 0} min
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(attempt.submittedAt).toLocaleDateString()} <br />
                        <span className="text-xs text-gray-500">
                          {new Date(attempt.submittedAt).toLocaleTimeString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* QR Scanner Modal - Single instance */}
        {showScanner && (
          <QRScanner onClose={() => setShowScanner(false)} />
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;

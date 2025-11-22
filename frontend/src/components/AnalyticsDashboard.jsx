import React, { useState, useEffect } from 'react';
import { quizService } from '../services/authService';

function AnalyticsDashboard({ quiz, onClose }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAttempts, setExpandedAttempts] = useState(new Set());

  const toggleAttemptExpansion = (attemptId) => {
    const newExpanded = new Set(expandedAttempts);
    if (newExpanded.has(attemptId)) {
      newExpanded.delete(attemptId);
    } else {
      newExpanded.add(attemptId);
    }
    setExpandedAttempts(newExpanded);
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await quizService.getQuizAnalytics(quiz._id);
      setAnalyticsData(response.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchAnalytics();
  }, [quiz._id]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl">Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Analytics for {quiz.title}</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  const { quiz: quizInfo, analytics, attempts } = analyticsData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl p-8 max-w-6xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Analytics for {quiz.title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500"></div>
            <div className="text-3xl font-bold text-gray-800">{analytics.totalStudents}</div>
            <div className="text-gray-500 mt-1">Total Students</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-green-500"></div>
            <div className="text-3xl font-bold text-gray-800">{analytics.submittedStudents}</div>
            <div className="text-gray-500 mt-1">Submitted</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-500"></div>
            <div className="text-3xl font-bold text-gray-800">{analytics.notSubmittedStudents}</div>
            <div className="text-gray-500 mt-1">Not Submitted</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-purple-500"></div>
            <div className="text-3xl font-bold text-gray-800">{analytics.averageScore.toFixed(1)}</div>
            <div className="text-gray-500 mt-1">Average Score</div>
          </div>
        </div>

        {/* Pass/Fail Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-green-500"></div>
            <div className="text-3xl font-bold text-gray-800">{analytics.passedStudents}</div>
            <div className="text-gray-500 mt-1">Students Passed</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-500"></div>
            <div className="text-3xl font-bold text-gray-800">{analytics.failedStudents}</div>
            <div className="text-gray-500 mt-1">Students Failed</div>
          </div>
        </div>

        {/* Student Attempts with Question-wise Analysis */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Student Attempts ({attempts.length})</h3>
          {attempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attempts.map((attempt, index) => (
                    <React.Fragment key={attempt.id}>
                      <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{attempt.student.name}</div>
                          <div className="text-sm text-gray-500">{attempt.student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attempt.score} / {attempt.totalScore}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${attempt.percentage >= 75 ? 'bg-green-100 text-green-800' : 
                              attempt.percentage >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {attempt.percentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${attempt.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              attempt.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {attempt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${attempt.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {attempt.isPassed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'Not submitted'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => toggleAttemptExpansion(attempt.id)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            {expandedAttempts.has(attempt.id) ? 'Hide Details' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                      {expandedAttempts.has(attempt.id) && (
                        <tr key={`${attempt.id}-details`}>
                          <td colSpan="7" className="px-6 py-4 bg-gray-50">
                            <div className="ml-4">
                              <h4 className="font-medium text-gray-900 mb-2">Question-wise Analysis</h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selected Options</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {attempt.answers.map((answer, ansIndex) => {
                                      // Find the corresponding question in the quiz
                                      const question = quiz.questions.find(q => q._id === answer.questionId) || 
                                                      { question: 'Unknown Question', options: [] };
                                      
                                      return (
                                        <tr key={`${attempt.id}-${answer.questionId}`} className={ansIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                          <td className="px-4 py-2 text-sm text-gray-900 max-w-xs">
                                            <div className="truncate" title={question.question}>
                                              {question.question}
                                            </div>
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-900">
                                            {answer.selectedOptions && answer.selectedOptions.length > 0 
                                              ? answer.selectedOptions.join(', ') 
                                              : 'No answer selected'}
                                          </td>
                                          <td className="px-4 py-2 text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                              ${answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                              {answer.isCorrect ? 'Correct' : 'Incorrect'}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-900">
                                            {answer.pointsEarned} / {question.points || 0}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No attempts recorded for this quiz yet.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
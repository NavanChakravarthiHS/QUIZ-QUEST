import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { quizService } from '../services/authService';

function ResultPage({ user }) {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Check if result data was passed from QuizPage
    if (location.state && location.state.resultData) {
      console.log('Using result data from location state:', location.state.resultData);
      const resultWithQuiz = {
        ...location.state.resultData,
        quiz: {
          title: location.state.quizTitle || 'Quiz'
        }
      };
      setResult(resultWithQuiz);
      setLoading(false);
    } else {
      // Fallback to API call if no data was passed
      loadResult();
    }
  }, [attemptId, location.state]);
  
  const loadResult = async () => {
    try {
      console.log('Loading result for attempt ID:', attemptId);
      
      if (!attemptId) {
        throw new Error('No attempt ID provided');
      }
      
      const response = await quizService.getResult(attemptId);
      console.log('Result data received:', response.data);
      
      if (!response.data) {
        throw new Error('No result data received from server');
      }
      
      setResult(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to load result:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load result';
      setError(errorMessage);
      
      // Show alert with specific error message
      alert(`Failed to load result: ${errorMessage}`);
      
      // Navigate to dashboard after a short delay to let user see the alert
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading result...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Result</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">No Result Data</h1>
          <p className="text-gray-700 mb-6">No result data available for this attempt.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  const percentage = result.percentage;
  const isPass = percentage >= 40; // Assuming 40% is the pass mark
  const getGradeColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getStatusColor = () => {
    return isPass ? 'text-green-600' : 'text-red-600';
  };
  
  const getStatusText = () => {
    return isPass ? 'PASS' : 'FAIL';
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Results</h1>
        <h2 className="text-xl text-gray-600 mb-6">{result.quiz.title}</h2>
        
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className={`text-6xl font-bold ${getGradeColor()}`}>
              {percentage}%
            </div>
          </div>
          <div className="text-center text-xl">
            <p>Your Score: {result.score} / {result.totalScore}</p>
          </div>
          <div className={`text-center text-2xl font-bold mt-4 ${getStatusColor()}`}>
            {getStatusText()}
          </div>
        </div>
        
        {/* Summary Statistics - Always visible to students and teachers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-600 font-semibold">Total Questions</p>
            <p className="text-2xl font-bold text-gray-800">{result.totalQuestions}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-600 font-semibold">Correct Answers</p>
            <p className="text-2xl font-bold text-gray-800">{result.correctAnswers}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-600 font-semibold">Wrong Answers</p>
            <p className="text-2xl font-bold text-gray-800">{result.wrongAnswers}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-purple-600 font-semibold">Total Marks</p>
            <p className="text-2xl font-bold text-gray-800">{result.totalScore}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">Time Spent</p>
            <p className="text-xl font-semibold">{Math.floor(result.timeSpent / 60)} minutes</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">Submitted At</p>
            <p className="text-xl font-semibold">
              {new Date(result.submittedAt).toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Question details - Only visible to teachers */}
        {user && user.role === 'teacher' && (
          <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Question Details</h2>
            <div className="space-y-6">
              {result.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-lg border-2 ${
                    answer.isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Question {index + 1}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      answer.isCorrect
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{answer.question}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-gray-600 mb-2">Your Answer:</p>
                      {answer.selectedOptions.length > 0 ? (
                        <ul className="list-disc list-inside text-gray-700">
                          {answer.selectedOptions.map((opt, i) => (
                            <li key={i}>{opt}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No answer selected</p>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600 mb-2">Correct Answer:</p>
                      <ul className="list-disc list-inside text-gray-700">
                        {answer.correctOptions.map((opt, i) => (
                          <li key={i}>{opt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-gray-600">Time Spent: {answer.timeSpent} seconds</span>
                    <span className="font-semibold">Points: {answer.pointsEarned} / {answer.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultPage;
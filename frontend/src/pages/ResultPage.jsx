import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../services/authService';

function ResultPage({ user }) {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadResult();
  }, [attemptId]);
  
  const loadResult = async () => {
    try {
      const data = await quizService.getResult(attemptId);
      setResult(data);
    } catch (err) {
      alert('Failed to load result');
      navigate('/dashboard');
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
  
  if (!result) return null;
  
  const percentage = result.percentage;
  const getGradeColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
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
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-8">
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
                    <p className="text-red-600">No answer provided</p>
                  )}
                </div>
                
                <div>
                  <p className="font-semibold text-gray-600 mb-2">Correct Answer:</p>
                  <ul className="list-disc list-inside text-green-700">
                    {answer.correctOptions.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <p className="mt-3 text-gray-600">
                Points: {answer.pointsEarned} / {answer.totalPoints}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <button
        onClick={() => navigate('/dashboard')}
        className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition font-semibold"
      >
        Back to Dashboard
      </button>
    </div>
  );
}

export default ResultPage;


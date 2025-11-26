import { useState, useEffect } from 'react';

const QuestionNavigator = ({ 
  totalQuestions, 
  currentQuestionIndex, 
  onQuestionSelect,
  answers,
  visited,
  questions
}) => {
  // Generate question numbers array
  const questionNumbers = Array.from({ length: totalQuestions }, (_, i) => i);

  // Determine the status color for each question
  const getQuestionStatus = (index) => {
    if (index === currentQuestionIndex) {
      return 'current'; // Blue
    } 
    
    // Check if question is answered
    if (questions && answers) {
      const questionId = questions[index]?._id;
      if (questionId && answers[questionId] !== undefined && answers[questionId] !== null && answers[questionId].length > 0) {
        return 'answered'; // Green
      }
    }
    
    // Check if question is visited
    if (visited && visited.has(index)) {
      return 'visited'; // Orange
    }
    
    return 'not-visited'; // Grey
  };

  return (
    <div className="question-navigator bg-white rounded-xl shadow-lg p-5 border border-gray-200">
      <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Question Navigator
      </h3>
      
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 gap-3">
        {questionNumbers.map((index) => (
          <button
            key={index}
            onClick={() => onQuestionSelect(index)}
            className={`
              w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 transform hover:scale-105 shadow-sm
              ${
                getQuestionStatus(index) === 'current'
                  ? 'bg-blue-600 text-white border-2 border-blue-800 shadow-blue-200' // Blue for current question
                  : getQuestionStatus(index) === 'answered'
                  ? 'bg-green-500 text-white shadow-green-100' // Green for answered
                  : getQuestionStatus(index) === 'visited'
                  ? 'bg-orange-400 text-white shadow-orange-100' // Orange for visited but not answered
                  : 'bg-gray-200 text-gray-700 shadow-gray-100' // Grey for not visited
              }
              hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            `}
          >
            {index + 1}
          </button>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Legend</h4>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm bg-blue-600 mr-2"></div>
            <span className="text-xs text-gray-600">Current</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm bg-green-500 mr-2"></div>
            <span className="text-xs text-gray-600">Answered</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm bg-orange-400 mr-2"></div>
            <span className="text-xs text-gray-600">Visited</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-sm bg-gray-200 mr-2"></div>
            <span className="text-xs text-gray-600">Not Visited</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigator;
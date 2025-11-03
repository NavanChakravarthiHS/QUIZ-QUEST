function QuestionCard({ question, selectedOptions = [], onSelect, type }) {
  const handleOptionClick = (optionText) => {
    if (type === 'single') {
      // Single choice: replace selection
      onSelect(question._id, [optionText]);
    } else {
      // Multiple choice: toggle selection
      if (selectedOptions.includes(optionText)) {
        onSelect(question._id, selectedOptions.filter(opt => opt !== optionText));
      } else {
        onSelect(question._id, [...selectedOptions, optionText]);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        {question.question}
      </h3>
      
      {/* Display image if available */}
      {question.imageUrl && (
        <div className="mb-4">
          <img 
            src={question.imageUrl} 
            alt="Question" 
            className="max-w-full h-auto max-h-64 object-contain rounded-lg border border-gray-200"
          />
        </div>
      )}
      
      <p className="text-sm text-gray-500 mb-4">
        {type === 'single' ? 'Select one answer' : 'Select one or more answers'}
      </p>
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <div
            key={index}
            onClick={() => handleOptionClick(option.text)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedOptions.includes(option.text)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                selectedOptions.includes(option.text)
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-400'
              }`}>
                {selectedOptions.includes(option.text) && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <span className="text-gray-800">{option.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuestionCard;
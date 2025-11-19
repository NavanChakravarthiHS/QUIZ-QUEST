import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionBankService } from '../services/authService';

function QuestionBank({ user }) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [continuousMode, setContinuousMode] = useState(false); // New state for continuous mode

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    question: '',
    type: 'single',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    points: 1,
    // Removed difficulty field as per requirement
    imageUrl: ''
  });

  // New state for subject input
  const [subjectInput, setSubjectInput] = useState('');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  useEffect(() => {
    if (user?.role !== 'teacher') {
      navigate('/dashboard');
      return;
    }
    fetchSubjects();
    fetchQuestions();
  }, [user, navigate]);

  const fetchSubjects = async () => {
    try {
      const response = await questionBankService.getAllSubjects();
      // Transform the data to match the expected format
      const subjectsWithCounts = response.data;
      setSubjects(subjectsWithCounts);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchQuestions = async (subject = '') => {
    try {
      setLoading(true);
      const response = await questionBankService.getAllQuestions(subject);
      setQuestions(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectFilter = (subject) => {
    setSelectedSubject(subject);
    fetchQuestions(subject);
  };

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { text: '', isCorrect: false }]
    });
  };

  const handleRemoveOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
    }
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index][field] = value;
    
    // For single choice, uncheck others when one is checked
    if (formData.type === 'single' && field === 'isCorrect' && value) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }
    
    setFormData({ ...formData, options: newOptions });
  };

  // Update the initializeForm function to also reset subject input
  const initializeForm = () => {
    setFormData({
      subject: '',
      question: '',
      type: 'single',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      points: 1,
      // Removed difficulty field as per requirement
      imageUrl: ''
    });
    setSubjectInput('');
    setEditingQuestion(null);
    setShowAddForm(true);
  };

  // Update resetForm to also reset subject input
  const resetForm = () => {
    setFormData({
      subject: '',
      question: '',
      type: 'single',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      points: 1,
      // Removed difficulty field as per requirement
      imageUrl: ''
    });
    setSubjectInput('');
    setEditingQuestion(null);
    // Don't hide the form in continuous mode
    if (!continuousMode) {
      setShowAddForm(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.subject.trim()) {
      setError('Subject is required');
      return;
    }

    if (!formData.question.trim()) {
      setError('Question text is required');
      return;
    }

    const filledOptions = formData.options.filter(opt => opt.text.trim());
    if (filledOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    if (!filledOptions.some(opt => opt.isCorrect)) {
      setError('At least one option must be marked as correct');
      return;
    }

    try {
      const questionData = {
        ...formData,
        options: filledOptions
      };

      if (editingQuestion) {
        await questionBankService.updateQuestion(editingQuestion._id, questionData);
        setSuccess('Question updated successfully!');
      } else {
        await questionBankService.createQuestion(questionData);
        setSuccess('Question added successfully!');
      }

      // In continuous mode, reset form but keep it visible
      if (continuousMode && !editingQuestion) {
        resetForm();
        // Keep the subject from the previous question for convenience
        setFormData(prev => ({
          ...prev,
          subject: formData.subject,
          question: '',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ]
        }));
      } else {
        resetForm();
      }

      fetchSubjects();
      fetchQuestions(selectedSubject);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving question:', err);
      setError(err.response?.data?.message || 'Failed to save question');
    }
  };

  // Update handleEdit to set the subject input as well
  const handleEdit = (question) => {
    setFormData({
      subject: question.subject,
      question: question.question,
      type: question.type,
      options: question.options,
      points: question.points,
      // Removed difficulty field as per requirement
      imageUrl: question.imageUrl || ''
    });
    setSubjectInput(question.subject);
    setEditingQuestion(question);
    setContinuousMode(false); // Turn off continuous mode when editing
    setShowAddForm(true);
  };

  const handleDelete = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await questionBankService.deleteQuestion(questionId);
      setSuccess('Question deleted successfully!');
      fetchQuestions(selectedSubject);
      fetchSubjects();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('Failed to delete question');
    }
  };

  // Get filtered subjects for dropdown (extract just the subject names)
  const filteredSubjects = subjects
    .map(s => s.subject)
    .filter(subject => 
      subject.toLowerCase().includes(subjectInput.toLowerCase()) && 
      subject !== subjectInput
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Question Bank</h1>
          <p className="text-gray-600">Manage your questions and organize by subject</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => {
              if (showAddForm) {
                // If form is open, close it
                setShowAddForm(false);
              } else {
                // If form is closed, open it and initialize
                initializeForm();
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-semibold inline-flex items-center shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showAddForm ? 'Cancel' : 'Add Question'}
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg transition font-semibold"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={subjectInput}
                      onChange={(e) => {
                        setSubjectInput(e.target.value);
                        setFormData({ ...formData, subject: e.target.value });
                        setShowSubjectDropdown(true);
                      }}
                      onFocus={() => setShowSubjectDropdown(true)}
                      onBlur={() => setTimeout(() => setShowSubjectDropdown(false), 200)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Mathematics, Science"
                      required
                    />
                    {showSubjectDropdown && filteredSubjects.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-auto">
                        {filteredSubjects.map((subject, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
                            onMouseDown={() => {
                              setSubjectInput(subject);
                              setFormData({ ...formData, subject: subject });
                              setShowSubjectDropdown(false);
                            }}
                          >
                            {subject}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="single">Single Choice</option>
                    <option value="multiple">Multiple Choice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Text *
                </label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter your question"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Removed difficulty field as per requirement */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options * (Check correct answer{formData.type === 'multiple' ? 's' : ''})
                </label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                      className="mt-3"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Option ${index + 1}`}
                    />
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Option
                </button>
              </div>

              {/* Continuous Mode Toggle */}
              {!editingQuestion && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="continuousMode"
                    checked={continuousMode}
                    onChange={(e) => setContinuousMode(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="continuousMode" className="ml-2 block text-sm text-gray-700">
                    Add questions continuously (form stays open after saving)
                  </label>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-semibold"
                >
                  {editingQuestion ? 'Update Question' : continuousMode ? 'Save & Add Another' : 'Add Question'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subject Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSubjectFilter('')}
              className={`px-4 py-2 rounded-lg transition font-medium ${
                selectedSubject === '' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Subjects
            </button>
            {subjects.map((subjectObj) => (
              <button
                key={subjectObj.subject}
                onClick={() => handleSubjectFilter(subjectObj.subject)}
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  selectedSubject === subjectObj.subject 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {subjectObj.subject} ({subjectObj.count})
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-xl text-gray-600">Loading questions...</div>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <p className="text-gray-600 text-lg">No questions found. Start by adding your first question!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {questions.map((q) => (
              <div key={q._id} className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {q.subject}
                      </span>
                      {/* Removed difficulty display as per requirement */}
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        {q.type === 'single' ? 'Single Choice' : 'Multiple Choice'}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        {q.points} {q.points === 1 ? 'mark' : 'marks'}
                      </span>
                    </div>
                    <p className="text-gray-800 font-medium mb-2">{q.question}</p>
                    <div className="space-y-1">
                      {q.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className={`w-5 h-5 rounded flex items-center justify-center ${
                            opt.isCorrect ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {opt.isCorrect ? '✓' : '○'}
                          </span>
                          <span className={opt.isCorrect ? 'text-green-700 font-medium' : 'text-gray-600'}>
                            {opt.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(q)}
                      className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(q._id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionBank;
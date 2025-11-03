import axios from 'axios';

// When running via Vite, use relative base so the dev proxy handles /api -> backend
const API_URL = import.meta.env.VITE_API_URL || '/';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authService = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
};

// Quiz endpoints
export const quizService = {
  createQuiz: (quizData) => api.post('/api/quiz/create', quizData),
  getAllQuizzes: () => api.get('/api/quiz/all'),
  getMyAttempts: () => api.get('/api/quiz/my-attempts'),
  getQuiz: (id) => api.get(`/api/quiz/${id}`),
  getQuizById: (id) => api.get(`/api/quiz/${id}`), // Alias for getQuiz
  updateQuiz: (id, quizData) => api.put(`/api/quiz/${id}`, quizData),
  deleteQuiz: (id) => api.delete(`/api/quiz/${id}`),
  joinQuiz: (quizId) => api.get(`/api/quiz/join/${quizId}`),
  submitQuiz: (submissionData) => api.post('/api/quiz/submit', submissionData),
  getQuizResult: (attemptId) => api.get(`/api/quiz/result/${attemptId}`),
  getQuizAnalytics: (quizId) => api.get(`/api/quiz/analytics/${quizId}`),
  // New endpoint for QR code students
  getQuizForAttempt: (attemptId) => api.get(`/api/quiz/attempt/${attemptId}`),
  studentAccess: (quizId, studentData) => api.post(`/api/quiz/student-access/${quizId}`, studentData)
};

// Question Bank endpoints
export const questionBankService = {
  getAllSubjects: () => api.get('/api/question-bank/subjects'),
  getAllQuestions: (subject) => api.get('/api/question-bank/all', { params: { subject } }),
  getRandomQuestions: (subject, count) => api.get(`/api/question-bank/random/${subject}/${count}`),
  createQuestion: (questionData) => api.post('/api/question-bank/create', questionData),
  bulkCreateQuestions: (questions) => api.post('/api/question-bank/bulk-create', { questions }),
  updateQuestion: (id, questionData) => api.put(`/api/question-bank/${id}`, questionData),
  deleteQuestion: (id) => api.delete(`/api/question-bank/${id}`)
};

export default api;
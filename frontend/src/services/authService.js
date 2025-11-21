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

// Add response interceptor to handle errors consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error for debugging
    console.error('API Error:', error);
    
    // If the error has the new format, return it as is
    if (error.response && error.response.data && typeof error.response.data.success !== 'undefined') {
      return Promise.reject(error);
    }
    
    // For other errors, maintain backward compatibility
    return Promise.reject(error);
  }
);

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
  getQuizDetails: (id) => api.get(`/api/quiz/details/${id}`), // New endpoint for quiz details
  updateQuiz: (id, quizData) => api.put(`/api/quiz/${id}`, quizData),
  deleteQuiz: (id) => api.delete(`/api/quiz/${id}`),
  joinQuiz: (quizId) => api.get(`/api/quiz/join/${quizId}`),
  submitQuiz: (submissionData) => api.post('/api/quiz/submit', submissionData),
  getResult: (attemptId) => api.get(`/api/quiz/result/${attemptId}`), // Added missing getResult function
  getQuizResult: (attemptId) => api.get(`/api/quiz/result/${attemptId}`), // Alias for getResult
  getQuizAnalytics: (quizId) => api.get(`/api/quiz/analytics/${quizId}`),
  // New endpoint for QR code students
  getQuizForAttempt: (attemptId) => api.get(`/api/quiz/attempt/${attemptId}`),
  studentAccess: (quizId, studentData) => api.post(`/api/quiz/student-access/${quizId}`, studentData),
  validateAccessKey: (quizId, data) => api.post(`/api/quiz/validate-access-key/${quizId}`, data),
  // Manual activation/deactivation endpoints
  activateQuiz: (id) => api.put(`/api/quiz/${id}/activate`),
  deactivateQuiz: (id) => api.put(`/api/quiz/${id}/deactivate`),
  // Early start/end handling endpoints
  activateQuizEarly: (id) => api.put(`/api/quiz/${id}/activate-early`),
  deactivateQuizEarly: (id) => api.put(`/api/quiz/${id}/deactivate-early`)
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

// Admin endpoints
export const adminService = {
  getAllTeachers: () => api.get('/api/admin/teachers'),
  createTeacher: (teacherData) => api.post('/api/admin/create-teacher', teacherData),
  bulkCreateTeachers: (teachers) => api.post('/api/admin/bulk-create-teachers', { teachers }),
  updateTeacher: (id, teacherData) => api.put(`/api/admin/teacher/${id}`, teacherData),
  deleteTeacher: (id) => api.delete(`/api/admin/teacher/${id}`),
  // Student management endpoints
  getAllStudents: () => api.get('/api/admin/students'),
  createStudent: (studentData) => api.post('/api/admin/create-student', studentData),
  updateStudent: (id, studentData) => api.put(`/api/admin/student/${id}`, studentData),
  deleteStudent: (id) => api.delete(`/api/admin/student/${id}`)
};

export default api;
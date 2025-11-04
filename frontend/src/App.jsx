import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import StudentLogin from './pages/StudentLogin';
import TeacherLogin from './pages/TeacherLogin';
import AdminLogin from './pages/AdminLogin';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import CreateQuiz from './pages/CreateQuiz';
import EditQuiz from './pages/EditQuiz';
import QuestionBank from './pages/QuestionBank';
import StudentAccess from './components/StudentAccess';
import Navbar from './components/Navbar';
import { authService } from './services/authService';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
          <Route path="/student-login" element={!user ? <StudentLogin onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
          <Route path="/teacher-login" element={!user ? <TeacherLogin onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
          <Route path="/admin/login" element={!user ? <AdminLogin onLogin={handleLogin} /> : <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} />} />
          <Route path="/signup" element={!user ? <Signup onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user && user.role !== 'admin' ? <Dashboard user={user} /> : user?.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/login" />} />
          <Route path="/admin/dashboard" element={user?.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/admin/login" />} />
          <Route path="/question-bank" element={user?.role === 'teacher' ? <QuestionBank user={user} /> : <Navigate to="/dashboard" />} />
          <Route path="/create-quiz" element={user?.role === 'teacher' ? <CreateQuiz user={user} /> : <Navigate to="/dashboard" />} />
          <Route path="/edit-quiz/:quizId" element={user?.role === 'teacher' ? <EditQuiz user={user} /> : <Navigate to="/dashboard" />} />
          <Route path="/quiz/:quizId" element={<QuizPage user={user} />} />
          <Route path="/student-access/:quizId" element={<StudentAccess />} />
          <Route path="/result/:attemptId" element={<ResultPage user={user} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
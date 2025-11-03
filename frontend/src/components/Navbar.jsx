import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === '/' && !user;

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isLandingPage 
        ? 'bg-transparent backdrop-blur-md border-b border-white/20' 
        : 'bg-white/95 backdrop-blur-md shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link 
              to={user ? "/dashboard" : "/"} 
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              QuizQuest
            </Link>
          </div>
          {user ? (
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/student-login"
                className="text-gray-700 hover:text-blue-600 transition-all duration-200 px-5 py-2.5 rounded-xl hover:bg-gray-100 font-medium"
              >
                Student Login
              </Link>
              <Link
                to="/teacher-login"
                className="text-gray-700 hover:text-blue-600 transition-all duration-200 px-5 py-2.5 rounded-xl hover:bg-gray-100 font-medium"
              >
                Teacher Login
              </Link>
              <Link
                to="/signup"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;


import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === '/' && !user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size and handle resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
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
                onClick={closeMenu}
              >
                QuizQuest
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            {!isMobile && user && (
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
            )}
            
            {/* Desktop Navigation for non-logged in users */}
            {!isMobile && !user && (
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
                  to="/admin/login"
                  className="text-gray-700 hover:text-red-600 transition-all duration-200 px-5 py-2.5 rounded-xl hover:bg-red-50 font-medium"
                >
                  Admin
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </div>
            )}
            
            {/* Mobile Hamburger Menu */}
            {isMobile && (
              <button
                onClick={toggleMenu}
                className="text-gray-700 hover:text-blue-600 focus:outline-none"
                aria-label="Toggle menu"
              >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>
      </nav>
      
      {/* Mobile Sidebar Menu */}
      {isMobile && isMenuOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={closeMenu}
          ></div>
          
          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <Link 
                  to={user ? "/dashboard" : "/"} 
                  className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                  onClick={closeMenu}
                >
                  QuizQuest
                </Link>
                <button
                  onClick={closeMenu}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close menu"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto py-4">
                {user ? (
                  <div className="px-4 space-y-6">
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 rounded-full">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.role}</p>
                      </div>
                    </div>
                    
                    <nav className="space-y-2">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={closeMenu}
                      >
                        Dashboard
                      </Link>
                      
                      {user.role === 'teacher' && (
                        <>
                          <Link
                            to="/question-bank"
                            className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={closeMenu}
                          >
                            Question Bank
                          </Link>
                          <Link
                            to="/create-quiz"
                            className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={closeMenu}
                          >
                            Create Quiz
                          </Link>
                        </>
                      )}
                      
                      {user.role === 'admin' && (
                        <Link
                          to="/admin/dashboard"
                          className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={closeMenu}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                    </nav>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        closeMenu();
                      }}
                      className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg transition-all duration-200 font-semibold shadow-md mt-4"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <nav className="px-4 space-y-2">
                    <Link
                      to="/student-login"
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={closeMenu}
                    >
                      Student Login
                    </Link>
                    <Link
                      to="/teacher-login"
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={closeMenu}
                    >
                      Teacher Login
                    </Link>
                    <Link
                      to="/admin/login"
                      className="block px-4 py-3 text-gray-700 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={closeMenu}
                    >
                      Admin Login
                    </Link>
                    <Link
                      to="/signup"
                      className="block px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 font-semibold shadow-lg mt-4 text-center"
                      onClick={closeMenu}
                    >
                      Sign Up
                    </Link>
                  </nav>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Navbar;
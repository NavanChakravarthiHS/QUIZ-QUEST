import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to student login by default
    navigate('/student-login');
  }, [navigate]);

  return null;
}

export default Login;


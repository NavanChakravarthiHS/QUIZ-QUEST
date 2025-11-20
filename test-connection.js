// Simple test script to verify frontend-backend connection
const axios = require('axios');

async function testConnection() {
  try {
    console.log('Testing connection to backend...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('Health check:', healthResponse.data);
    
    // Test quiz endpoint (without auth)
    try {
      const quizResponse = await axios.get('http://localhost:5000/api/quiz/all');
      console.log('Quiz endpoint (unauthorized):', quizResponse.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Quiz endpoint correctly requires authentication');
      } else {
        console.log('Unexpected error from quiz endpoint:', error.message);
      }
    }
    
    console.log('Connection test completed successfully');
  } catch (error) {
    console.error('Connection test failed:', error.message);
    console.log('Please ensure the backend server is running on port 5000');
  }
}

testConnection();
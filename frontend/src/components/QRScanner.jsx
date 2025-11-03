import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'react-qr-scanner';

function QRScanner({ onClose }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);

  const handleScan = (data) => {
    if (data) {
      try {
        // Extract quiz ID from scanned URL
        const url = new URL(data.text);
        const path = url.pathname;
        
        // Check if it's a student-access URL
        if (path.includes('/student-access/')) {
          const quizId = path.split('/student-access/')[1];
          navigate(`/student-access/${quizId}`);
          onClose();
        } else if (path.includes('/quiz/')) {
          const quizId = path.split('/quiz/')[1];
          navigate(`/quiz/${quizId}`);
          onClose();
        } else {
          setError('Invalid quiz QR code');
        }
      } catch (err) {
        setError('Invalid QR code format');
      }
    }
  };

  const handleError = (err) => {
    console.error('QR Scanner Error:', err);
    setError('Camera access denied or not available');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Scan Quiz QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Position the QR code within the camera frame to scan
          </p>
          
          {scanning && (
            <div className="relative">
              <QrScanner
                delay={300}
                onError={handleError}
                onScan={handleScan}
                style={{ width: '100%' }}
                constraints={{
                  video: { facingMode: 'environment' }
                }}
              />
              <div className="absolute inset-0 border-4 border-blue-500 pointer-events-none rounded-lg">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-600"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-600"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-600"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-600"></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition font-medium"
          >
            Cancel
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Make sure to allow camera access when prompted</p>
        </div>
      </div>
    </div>
  );
}

export default QRScanner;

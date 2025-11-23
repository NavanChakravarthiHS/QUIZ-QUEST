import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';

function QRScanner({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [uploading, setUploading] = useState(false); // New state for upload processing
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false); // Track if we're currently scanning

  useEffect(() => {
    if (isOpen) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    // Prevent multiple scanner instances
    if (isScanningRef.current) {
      return;
    }
    
    try {
      isScanningRef.current = true;
      
      // Clear any existing scanner
      if (html5QrCodeRef.current) {
        await stopScanner();
      }
      
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanError
      );
      setScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      isScanningRef.current = false;
      setError('Camera access denied or not available. Please allow camera access or upload an image instead.');
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    } finally {
      html5QrCodeRef.current = null;
      isScanningRef.current = false;
      setScanning(false);
    }
  };

  const onScanSuccess = (decodedText, decodedResult) => {
    // Prevent multiple scans
    if (!isScanningRef.current) {
      return;
    }
    
    try {
      isScanningRef.current = false;
      
      // Extract quiz ID from scanned URL
      const url = new URL(decodedText);
      const path = url.pathname;
      
      // Check if it's a student-access URL
      if (path.includes('/student-access/')) {
        const quizId = path.split('/student-access/')[1];
        stopScanner();
        navigate(`/student-access/${quizId}`);
        onClose();
      } else if (path.includes('/quiz/')) {
        const quizId = path.split('/quiz/')[1];
        stopScanner();
        navigate(`/quiz/${quizId}`);
        onClose();
      } else {
        setError('Invalid quiz QR code');
        setTimeout(() => {
          setError('');
          isScanningRef.current = true;
        }, 2000);
      }
    } catch (err) {
      setError('Invalid QR code format');
      setTimeout(() => {
        setError('');
        isScanningRef.current = true;
      }, 2000);
    }
  };

  const onScanError = (errorMessage) => {
    // Ignore scanning errors (happens when no QR code is in view)
  };

  // New function to handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please upload an image file (PNG/JPG)');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Use Html5Qrcode to scan the uploaded image
      const html5QrCode = new Html5Qrcode("qr-reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch (err) {
      console.error('Error scanning uploaded image:', err);
      setError('No valid QR code found in the image. Please try another image.');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Scan Quiz QR Code</h2>
          <button
            onClick={handleClose}
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

        {uploading && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 text-center">
            Processing image...
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Position the QR code within the camera frame to scan
          </p>
          
          <div 
            id="qr-reader" 
            ref={scannerRef}
            className="w-full rounded-lg overflow-hidden"
            style={{ minHeight: '300px' }}
          ></div>
        </div>

        {/* Upload section */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or upload a QR code image:
          </label>
          <div className="flex items-center">
            <label className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition font-medium text-center cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? 'Processing...' : 'Upload QR Image'}
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
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
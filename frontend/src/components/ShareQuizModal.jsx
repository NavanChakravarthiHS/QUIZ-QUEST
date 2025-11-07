import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

function ShareQuizModal({ quiz, onClose }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const quizUrl = `${window.location.origin}/student-access/${quiz._id}`;

  useEffect(() => {
    generateQRCode();
  }, [quiz._id]);

  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(quizUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        // Add error correction for better scanning reliability
        errorCorrectionLevel: 'H'
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(quizUrl);
    // Show a toast notification instead of alert
    const originalText = document.getElementById('copy-btn').textContent;
    document.getElementById('copy-btn').textContent = 'Copied!';
    setTimeout(() => {
      document.getElementById('copy-btn').textContent = originalText;
    }, 2000);
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `quiz-${quiz._id}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Share Quiz</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 rounded-full p-2 hover:bg-gray-100 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{quiz.title}</h3>
          <p className="text-gray-600">Share this quiz with your students</p>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-6">
          {qrCodeUrl ? (
            <div className="relative group">
              <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
                <img 
                  src={qrCodeUrl} 
                  alt="Quiz QR Code" 
                  className="w-64 h-64 object-contain"
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={downloadQRCode}
                  className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium flex items-center hover:bg-gray-100 transition"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-gray-500">Generating QR code...</div>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-2">Scan this QR code to access the quiz</p>
        </div>

        {/* Quiz Link */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quiz Link
          </label>
          <div className="flex">
            <input
              type="text"
              value={quizUrl}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent truncate"
            />
            <button
              id="copy-btn"
              onClick={copyToClipboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg transition font-medium"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to use:
          </h4>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1 ml-2">
            <li>Display the QR code on a projector or screen</li>
            <li>Students scan the code with their mobile devices</li>
            <li>Students enter their name and USN</li>
            <li>Students can then attempt the quiz</li>
          </ol>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={downloadQRCode}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download QR
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareQuizModal;
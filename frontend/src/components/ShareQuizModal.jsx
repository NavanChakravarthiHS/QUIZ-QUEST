import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

function ShareQuizModal({ quiz, onClose }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  // Modified the URL to open in a new tab
  const quizUrl = `${window.location.origin}/student-access/${quiz._id}`;

  useEffect(() => {
    generateQRCode();
  }, [quiz._id]);

  const generateQRCode = async () => {
    try {
      // Embed both quiz link and access key in QR code
      const qrData = `Quiz: ${quiz.title}
Link: ${quizUrl}
Access Key: ${quiz.accessKey || 'N/A'}

Scan to join the quiz!`;
      
      const url = await QRCode.toDataURL(qrData, {
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

  const shareOnWhatsApp = () => {
    const message = `Join my quiz: ${quiz.title}

Quiz Link: ${quizUrl}
Access Key: ${quiz.accessKey || 'N/A'}

Scan the QR code attached to join instantly!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    // Download QR code for manual attachment
    setTimeout(() => downloadQRCode(), 500);
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(quizUrl)}&quote=${encodeURIComponent(`Join my quiz: ${quiz.title}

Access Key: ${quiz.accessKey || 'N/A'}

Scan the QR code below to join instantly!`)}`;
    window.open(facebookUrl, '_blank');
  };

  const shareOnTwitter = () => {
    const tweetText = `Check out my quiz: ${quiz.title}

Access Key: ${quiz.accessKey || 'N/A'}
Scan the QR code below to join!

${quizUrl}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank');
    // Download QR code for manual attachment
    setTimeout(() => downloadQRCode(), 500);
  };

  const shareViaEmail = () => {
    const subject = `Join my Quiz: ${quiz.title}`;
    const body = `Hi,

I'd like to invite you to take my quiz: ${quiz.title}

Quiz Link: ${quizUrl}
Access Key: ${quiz.accessKey || 'N/A'}

Please download the QR code from the link above or scan it to join instantly!

Best regards`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    // Download QR code for manual attachment
    setTimeout(() => downloadQRCode(), 500);
  };

  const shareOnTelegram = () => {
    const message = `Join my quiz: ${quiz.title}

Access Key: ${quiz.accessKey || 'N/A'}
Scan the QR code to join!

${quizUrl}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(quizUrl)}&text=${encodeURIComponent(quiz.title)}`;
    window.open(telegramUrl, '_blank');
    // Download QR code for manual attachment
    setTimeout(() => downloadQRCode(), 500);
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
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full mx-auto shadow-2xl overflow-y-auto max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
          <h2 className="text-2xl font-bold text-white">Share Quiz</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white rounded-full p-2 hover:bg-gray-800 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-8 py-6 overflow-y-auto flex-1">
          {/* Quiz Title */}
          <div className="mb-6 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">{quiz.title}</h3>
            <p className="text-gray-400 text-sm">Scan QR code or share with your students</p>
          </div>

          {/* Access Key Display */}
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4">
            <div className="text-center">
              <p className="text-blue-100 text-sm mb-1">Access Key</p>
              <p className="text-white text-3xl font-bold tracking-widest">{quiz.accessKey || 'N/A'}</p>
              <p className="text-blue-100 text-xs mt-2">Students will need this key to access the quiz</p>
            </div>
          </div>

          {/* QR Code - Centered */}
          <div className="flex flex-col items-center mb-6">
            {qrCodeUrl ? (
              <div className="relative group">
                <div className="bg-white p-4 rounded-lg shadow-xl">
                  <img 
                    src={qrCodeUrl} 
                    alt="Quiz QR Code" 
                    className="w-56 h-56 object-contain"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={downloadQRCode}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download QR
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-56 h-56 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
              </div>
            )}
            
            <div className="mt-4 text-center">
              <p className="text-gray-400 text-sm flex items-center justify-center">
                <svg className="w-4 h-4 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                QR code includes quiz link + access key
              </p>
            </div>
          </div>

          {/* Share Section */}
          <div className="border-t border-gray-700 pt-6">
            <h4 className="text-white font-semibold mb-4 text-sm">Share</h4>
            
            {/* Social Media Buttons - Horizontal */}
            <div className="flex gap-3 justify-center mb-5 flex-wrap">
              <button
                onClick={shareOnWhatsApp}
                className="flex flex-col items-center justify-center gap-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition transform hover:scale-110 duration-200 w-20 h-20"
                title="Share on WhatsApp"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-xs font-medium">WhatsApp</span>
              </button>

              <button
                onClick={shareOnFacebook}
                className="flex flex-col items-center justify-center gap-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition transform hover:scale-110 duration-200 w-20 h-20"
                title="Share on Facebook"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
                <span className="text-xs font-medium">Facebook</span>
              </button>

              <button
                onClick={shareOnTwitter}
                className="flex flex-col items-center justify-center gap-1 px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-full transition transform hover:scale-110 duration-200 w-20 h-20"
                title="Share on Twitter"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <span className="text-xs font-medium">Twitter</span>
              </button>

              <button
                onClick={shareViaEmail}
                className="flex flex-col items-center justify-center gap-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition transform hover:scale-110 duration-200 w-20 h-20"
                title="Share via Gmail"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="#EA4335"/>
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v.5l9 7 9-7V6c0-1.1-.9-2-2-2z" fill="#FBBC04"/>
                  <path d="M2 6v12c0 1.1.9 2 2 2h.5V9.5l8 6.3 8-6.3v10.5H20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2z" fill="#34A853"/>
                  <path d="M20 4v.5l-9 7-9-7V4c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2z" fill="#4285F4"/>
                </svg>
                <span className="text-xs font-medium">Gmail</span>
              </button>

              <button
                onClick={shareOnTelegram}
                className="flex flex-col items-center justify-center gap-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full transition transform hover:scale-110 duration-200 w-20 h-20"
                title="Share on Telegram"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.902-1.056-.692-1.653-1.123-2.678-1.799-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.017-1.793 1.14-5.061 3.345-.479.329-.913.489-1.302.48-.429-.008-1.252-.242-1.865-.442-.752-.231-1.344-.354-1.293-.747.028-.183.324-.368.892-.563 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.14.12.099.153.231.167.344.014.112.027.265.027.403z" />
                </svg>
                <span className="text-xs font-medium">Telegram</span>
              </button>
            </div>

            {/* Copy Link Section */}
            <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
              <input
                type="text"
                value={quizUrl}
                readOnly
                className="flex-1 bg-gray-800 text-gray-300 text-xs border-0 focus:outline-none truncate"
              />
              <button
                id="copy-btn"
                onClick={copyToClipboard}
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-1 rounded-lg transition font-semibold whitespace-nowrap text-sm"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="sticky bottom-0 px-8 py-4 bg-gray-900 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareQuizModal;
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

  const shareOnWhatsApp = () => {
    const message = `Join my quiz: ${quiz.title}

Quiz Link: ${quizUrl}

Scan the QR code attached to join instantly!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    // Download QR code for manual attachment
    setTimeout(() => downloadQRCode(), 500);
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(quizUrl)}&quote=${encodeURIComponent(`Join my quiz: ${quiz.title}\n\nScan the QR code below to join instantly!`)}`;
    window.open(facebookUrl, '_blank');
  };

  const shareOnTwitter = () => {
    const tweetText = `Check out my quiz: ${quiz.title}

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

Please download the QR code from the link above or scan it to join instantly!

Best regards`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    // Download QR code for manual attachment
    setTimeout(() => downloadQRCode(), 500);
  };

  const shareOnTelegram = () => {
    const message = `Join my quiz: ${quiz.title}

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

          {/* QR Code - Centered */}
          <div className="flex justify-center mb-6">
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-56 h-56 bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-gray-500 flex flex-col items-center">
                  <svg className="w-12 h-12 mb-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs">Generating QR code...</span>
                </div>
              </div>
            )}
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
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-9.746 9.798c0 2.364.575 4.65 1.668 6.66L2.4 24l7.183-1.975a9.857 9.857 0 004.204.9h.004c5.396 0 9.747-4.363 9.747-9.798 0-2.619-.674-5.08-1.955-7.228-1.282-2.147-3.012-3.979-5.193-5.075-2.182-1.096-4.658-1.657-7.238-1.657z" />
                </svg>
                <span className="text-xs font-medium">WhatsApp</span>
              </button>

              <button
                onClick={shareOnFacebook}
                className="flex flex-col items-center justify-center gap-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition transform hover:scale-110 duration-200 w-20 h-20"
                title="Share on Facebook"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-xs font-medium">Facebook</span>
              </button>

              <button
                onClick={shareOnTwitter}
                className="flex flex-col items-center justify-center gap-1 px-4 py-3 bg-black hover:bg-gray-800 text-white rounded-full transition transform hover:scale-110 duration-200 w-20 h-20"
                title="Share on Twitter X"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.165-6.744L2.88 21.75H-1.263l7.73-8.835L-2.744 2.25h6.6l4.759 6.318L18.244 2.25zM17.8 19.75h1.835L6.169 4.122H4.27l13.53 15.628z" />
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
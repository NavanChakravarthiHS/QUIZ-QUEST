function DeleteConfirmModal({ isOpen, onClose, onConfirm, quizTitle }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/30 transform transition-all">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Delete Quiz</h2>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <strong>"{quizTitle}"</strong>?
          </p>
          <p className="text-sm text-red-600 mb-6">
            This action cannot be undone. All quiz attempts will also be deleted.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl transition font-semibold"
            >
              Delete Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;


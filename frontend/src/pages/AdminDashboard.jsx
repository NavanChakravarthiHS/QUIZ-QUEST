import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/authService';

function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchTeachers();
  }, [user, navigate]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllTeachers();
      setTeachers(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' });
    setEditingTeacher(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingTeacher) {
        await adminService.updateTeacher(editingTeacher._id, formData);
        setSuccess('Teacher updated successfully!');
      } else {
        await adminService.createTeacher(formData);
        setSuccess('Teacher created successfully!');
      }

      resetForm();
      fetchTeachers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving teacher:', err);
      setError(err.response?.data?.message || 'Failed to save teacher');
    }
  };

  const handleEdit = (teacher) => {
    setFormData({
      name: teacher.name,
      email: teacher.email,
      password: '' // Don't pre-fill password
    });
    setEditingTeacher(teacher);
    setShowAddForm(true);
  };

  const handleDelete = async (teacherId) => {
    if (!confirm('Are you sure you want to delete this teacher account?')) return;

    try {
      await adminService.deleteTeacher(teacherId);
      setSuccess('Teacher deleted successfully!');
      fetchTeachers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting teacher:', err);
      setError('Failed to delete teacher');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage teacher accounts and credentials</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium">
                <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                Admin: {user?.name}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition font-semibold inline-flex items-center shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showAddForm ? 'Cancel' : 'Add Teacher'}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Teacher's full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="teacher@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingTeacher && '(leave blank to keep unchanged)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Minimum 8 characters"
                  required={!editingTeacher}
                  minLength="8"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition font-semibold"
                >
                  {editingTeacher ? 'Update Teacher' : 'Create Teacher'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Teachers List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">
              Teacher Accounts ({teachers.length})
            </h2>
          </div>

          {teachers.length === 0 ? (
            <div className="p-12 text-center text-gray-600">
              No teachers found. Create your first teacher account!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teachers.map((teacher) => (
                    <tr key={teacher._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{teacher.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(teacher.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(teacher._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

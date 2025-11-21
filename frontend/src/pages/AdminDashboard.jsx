import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/authService';

function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' or 'students'
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    usn: '',
    branch: ''
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchTeachers();
    fetchStudents();
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

  const fetchStudents = async () => {
    try {
      const response = await adminService.getAllStudents();
      setStudents(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', usn: '', branch: '' });
    setEditingTeacher(null);
    setEditingStudent(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (activeTab === 'teachers') {
        if (editingTeacher) {
          await adminService.updateTeacher(editingTeacher._id, formData);
          setSuccess('Teacher updated successfully!');
        } else {
          await adminService.createTeacher(formData);
          setSuccess('Teacher created successfully!');
        }
      } else {
        // Student management
        if (editingStudent) {
          await adminService.updateStudent(editingStudent._id, formData);
          setSuccess('Student updated successfully!');
        } else {
          await adminService.createStudent(formData);
          setSuccess('Student created successfully!');
        }
      }

      resetForm();
      fetchTeachers();
      fetchStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving:', err);
      setError(err.response?.data?.message || `Failed to save ${activeTab === 'teachers' ? 'teacher' : 'student'}`);
    }
  };

  const handleEditTeacher = (teacher) => {
    setFormData({
      name: teacher.name,
      email: teacher.email,
      password: '' // Don't pre-fill password
    });
    setEditingTeacher(teacher);
    setEditingStudent(null);
    setShowAddForm(true);
    setActiveTab('teachers');
  };

  const handleEditStudent = (student) => {
    setFormData({
      name: student.name,
      usn: student.usn,
      branch: student.branch,
      password: '' // Don't pre-fill password
    });
    setEditingStudent(student);
    setEditingTeacher(null);
    setShowAddForm(true);
    setActiveTab('students');
  };

  const handleDeleteTeacher = async (teacherId) => {
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

  const handleDeleteStudent = async (studentId) => {
    if (!confirm('Are you sure you want to delete this student account?')) return;

    try {
      await adminService.deleteStudent(studentId);
      setSuccess('Student deleted successfully!');
      fetchStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting student:', err);
      setError('Failed to delete student');
    }
  };

  // Function to handle adding a new teacher
  const handleAddTeacher = () => {
    resetForm();
    setActiveTab('teachers');
    setShowAddForm(true);
  };

  // Function to handle adding a new student
  const handleAddStudent = () => {
    resetForm();
    setActiveTab('students');
    setShowAddForm(true);
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
              <p className="text-gray-600">Manage teacher and student accounts</p>
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'teachers' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Teachers
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'students' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Students
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          {activeTab === 'teachers' ? (
            <button
              onClick={handleAddTeacher}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition font-semibold inline-flex items-center shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Teacher
            </button>
          ) : (
            <button
              onClick={handleAddStudent}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition font-semibold inline-flex items-center shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Student
            </button>
          )}
          
          {showAddForm && (
            <button
              onClick={resetForm}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg transition font-semibold inline-flex items-center shadow-sm"
            >
              Cancel
            </button>
          )}
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
              {editingTeacher ? 'Edit Teacher' : editingStudent ? 'Edit Student' : `Add New ${activeTab === 'teachers' ? 'Teacher' : 'Student'}`}
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
                  placeholder="Full name"
                  required
                />
              </div>

              {activeTab === 'students' || editingStudent ? (
                // Student-specific fields
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      USN *
                    </label>
                    <input
                      type="text"
                      value={formData.usn}
                      onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="e.g., 4HG23CS043"
                      required={activeTab === 'students' || editingStudent}
                      pattern="4HG\d{2}(CS|EC|EE|ME|CV)\d{3}"
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: 4HG[Year][Branch][Serial] (e.g., 4HG23CS043)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch *
                    </label>
                    <select
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required={activeTab === 'students' || editingStudent}
                    >
                      <option value="">Select Branch</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="ME">ME</option>
                      <option value="CV">CV</option>
                    </select>
                  </div>
                </>
              ) : (
                // Teacher-specific field
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
                    required={activeTab === 'teachers' || editingTeacher}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingTeacher || editingStudent ? '(leave blank to keep unchanged)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Minimum 8 characters"
                  required={!editingTeacher && !editingStudent}
                  minLength="8"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition font-semibold"
                >
                  {editingTeacher ? 'Update Teacher' : editingStudent ? 'Update Student' : `Create ${activeTab === 'teachers' ? 'Teacher' : 'Student'}`}
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

        {/* Teachers/Students List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">
              {activeTab === 'teachers' ? 'Teacher Accounts' : 'Student Accounts'} ({activeTab === 'teachers' ? teachers.length : students.length})
            </h2>
          </div>

          {activeTab === 'teachers' ? (
            // Teachers list
            teachers.length === 0 ? (
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
                            onClick={() => handleEditTeacher(teacher)}
                            className="text-blue-600 hover:text-blue-800 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(teacher._id)}
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
            )
          ) : (
            // Students list
            students.length === 0 ? (
              <div className="p-12 text-center text-gray-600">
                No students found. Create your first student account!
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
                        USN
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch
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
                    {students.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{student.usn}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{student.branch}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(student.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="text-blue-600 hover:text-blue-800 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student._id)}
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
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
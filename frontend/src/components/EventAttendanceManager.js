import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

// Base URL - Change this to switch between development and production
//const BASE_URL = "https://unisphere-backend-o6o2.onrender.com"; // Production
const BASE_URL = "http://localhost:5001"; // Development

const EventAttendanceManager = ({ eventId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (eventId) {
      fetchEventAttendance();
      fetchEventRegistrations();
    }
  }, [eventId]);

  const fetchEventAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/v1/attendance/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendance(response.data.data.docs || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance data');
    }
  };

  const fetchEventRegistrations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/v1/registrations/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegistrations(response.data.data.docs || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to fetch registration data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (record) => {
    setEditingRecord(record._id);
    setEditStatus(record.status);
    setEditNotes(record.notes || '');
  };

  const handleSave = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BASE_URL}/api/v1/attendance/edit/${eventId}/${userId}`,
        { status: editStatus, notes: editNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Attendance updated successfully');
      setEditingRecord(null);
      fetchEventAttendance();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
    }
  };

  const handleCancel = () => {
    setEditingRecord(null);
    setEditStatus('');
    setEditNotes('');
  };

  const handleMarkAttendance = async (userId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BASE_URL}/api/v1/attendance/mark-for-others`,
        { eventId, userId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Attendance marked successfully');
      fetchEventAttendance();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const getAttendanceRecord = (userId) => {
    return attendance.find(record => record.user._id === userId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'absent': return 'text-red-600 bg-red-100';
      case 'late': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleManageAttendance = () => {
    navigate(`/faculty/event/${eventId}/attendance`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Event Attendance</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleManageAttendance}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
          >
            Manage Attendance
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {registrations.slice(0, 10).map((registration) => {
              const attendanceRecord = getAttendanceRecord(registration.user._id);
              const isEditing = editingRecord === attendanceRecord?._id;

              return (
                <tr key={registration._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {registration.user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {registration.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(attendanceRecord?.status || 'absent')}`}>
                        {attendanceRecord?.status || 'Not Marked'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {isEditing ? (
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full"
                        rows="2"
                        placeholder="Add notes..."
                      />
                    ) : (
                      <span className="text-sm text-gray-600">
                        {attendanceRecord?.notes || 'No notes'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {isEditing ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave(registration.user._id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        {attendanceRecord ? (
                          <button
                            onClick={() => handleEditClick(attendanceRecord)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                          >
                            Edit
                          </button>
                        ) : (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleMarkAttendance(registration.user._id, 'present')}
                              className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(registration.user._id, 'late')}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                            >
                              Late
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(registration.user._id, 'absent')}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                            >
                              Absent
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {registrations.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No students registered for this event.</p>
        </div>
      )}

      {registrations.length > 10 && (
        <div className="mt-4 text-center">
          <button
            onClick={handleManageAttendance}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            View all {registrations.length} students →
          </button>
        </div>
      )}
    </div>
  );
};

export default EventAttendanceManager;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { toast } from 'react-toastify';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const FacultyAttendanceReports = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    eventId: '',
    userId: '',
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  });
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalAttendance: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    attendanceRate: 0,
    eventBreakdown: [],
    studentBreakdown: []
  });

  useEffect(() => {
    fetchAttendanceReports();
    fetchEventsAndStudents();
  }, [filters]);

  const fetchAttendanceReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query params
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(
        `http://localhost:5001/api/v1/attendance/reports?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('📊 Attendance Reports:', response.data);
      setAttendanceData(response.data.data);
      calculateAnalytics(response.data.data.docs);
    } catch (error) {
      console.error('❌ Error fetching attendance reports:', error);
      toast.error('Failed to fetch attendance reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventsAndStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch events for filter dropdown
      const eventsRes = await axios.get('http://localhost:5001/api/v1/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(eventsRes.data?.data?.events || []);

      // Fetch users (students) for filter dropdown
      const usersRes = await axios.get('http://localhost:5001/api/v1/users/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const studentsList = usersRes.data?.data?.docs?.filter(user => user.role === 'student') || [];
      setStudents(studentsList);
    } catch (error) {
      console.error('❌ Error fetching events/students:', error);
    }
  };

  const calculateAnalytics = (attendanceRecords) => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      setAnalytics({
        totalAttendance: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        attendanceRate: 0,
        eventBreakdown: [],
        studentBreakdown: []
      });
      return;
    }

    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
    const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;
    const lateCount = attendanceRecords.filter(record => record.status === 'late').length;
    const attendanceRate = totalAttendance > 0 ? ((presentCount + lateCount) / totalAttendance * 100).toFixed(1) : 0;

    // Event breakdown
    const eventBreakdown = attendanceRecords.reduce((acc, record) => {
      const eventTitle = record.event?.title || 'Unknown Event';
      if (!acc[eventTitle]) {
        acc[eventTitle] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      acc[eventTitle][record.status]++;
      acc[eventTitle].total++;
      return acc;
    }, {});

    // Student breakdown
    const studentBreakdown = attendanceRecords.reduce((acc, record) => {
      const studentName = record.user?.name || 'Unknown Student';
      if (!acc[studentName]) {
        acc[studentName] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      acc[studentName][record.status]++;
      acc[studentName].total++;
      return acc;
    }, {});

    setAnalytics({
      totalAttendance,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
      eventBreakdown: Object.entries(eventBreakdown),
      studentBreakdown: Object.entries(studentBreakdown)
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const clearFilters = () => {
    setFilters({
      eventId: '',
      userId: '',
      status: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 50
    });
  };

  // Chart configurations
  const statusPieData = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [{
      data: [analytics.presentCount, analytics.absentCount, analytics.lateCount],
      backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
      borderColor: ['#059669', '#DC2626', '#D97706'],
      borderWidth: 2
    }]
  };

  const eventBarData = {
    labels: analytics.eventBreakdown.slice(0, 10).map(([event]) => 
      event.length > 15 ? event.substring(0, 15) + '...' : event
    ),
    datasets: [
      {
        label: 'Present',
        data: analytics.eventBreakdown.slice(0, 10).map(([, data]) => data.present),
        backgroundColor: '#10B981'
      },
      {
        label: 'Absent',
        data: analytics.eventBreakdown.slice(0, 10).map(([, data]) => data.absent),
        backgroundColor: '#EF4444'
      },
      {
        label: 'Late',
        data: analytics.eventBreakdown.slice(0, 10).map(([, data]) => data.late),
        backgroundColor: '#F59E0B'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#fff'
        }
      },
      title: {
        display: true,
        color: '#fff'
      }
    },
    scales: {
      x: {
        ticks: { color: '#fff' },
        grid: { color: '#374151' }
      },
      y: {
        ticks: { color: '#fff' },
        grid: { color: '#374151' }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#fff'
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📊 Attendance Reports & Analytics</h1>
        <button
          onClick={clearFilters}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          Clear Filters
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event</label>
            <select
              value={filters.eventId}
              onChange={(e) => handleFilterChange('eventId', e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="">All Events</option>
              {events.map(event => (
                <option key={event._id} value={event._id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Student</label>
            <select
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="">All Students</option>
              {students.map(student => (
                <option key={student._id} value={student._id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-600 p-4 rounded-lg text-center">
          <h3 className="text-lg font-semibold">Total Records</h3>
          <p className="text-2xl font-bold">{analytics.totalAttendance}</p>
        </div>
        <div className="bg-green-600 p-4 rounded-lg text-center">
          <h3 className="text-lg font-semibold">Present</h3>
          <p className="text-2xl font-bold">{analytics.presentCount}</p>
        </div>
        <div className="bg-red-600 p-4 rounded-lg text-center">
          <h3 className="text-lg font-semibold">Absent</h3>
          <p className="text-2xl font-bold">{analytics.absentCount}</p>
        </div>
        <div className="bg-yellow-600 p-4 rounded-lg text-center">
          <h3 className="text-lg font-semibold">Attendance Rate</h3>
          <p className="text-2xl font-bold">{analytics.attendanceRate}%</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Attendance Distribution</h3>
          <div className="h-64">
            <Pie data={statusPieData} options={pieOptions} />
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Attendance by Event</h3>
          <div className="h-64">
            <Bar data={eventBarData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold">Attendance Records</h3>
          {attendanceData && (
            <p className="text-sm text-gray-400">
              Showing {attendanceData.docs?.length || 0} of {attendanceData.totalDocs || 0} records
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Marked By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {attendanceData?.docs?.map((record) => (
                <tr key={record._id} className="hover:bg-gray-700">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {record.user?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {record.user?.email || ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {record.event?.title || 'Unknown Event'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {record.event?.club?.name || ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.status === 'present' ? 'bg-green-100 text-green-800' :
                      record.status === 'absent' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(record.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {record.markedBy?.name || 'System'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {attendanceData && attendanceData.totalPages > 1 && (
          <div className="p-4 border-t border-gray-700 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Page {attendanceData.page} of {attendanceData.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={!attendanceData.hasPrevPage}
                onClick={() => handleFilterChange('page', attendanceData.page - 1)}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Previous
              </button>
              <button
                disabled={!attendanceData.hasNextPage}
                onClick={() => handleFilterChange('page', attendanceData.page + 1)}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="mt-6 text-center">
        <button
          onClick={() => {
            const csvData = attendanceData?.docs?.map(record => ({
              Student: record.user?.name || 'Unknown',
              Email: record.user?.email || '',
              Event: record.event?.title || 'Unknown Event',
              Club: record.event?.club?.name || '',
              Status: record.status,
              DateTime: new Date(record.createdAt).toLocaleString(),
              MarkedBy: record.markedBy?.name || 'System'
            }));
            
            if (csvData?.length > 0) {
              const csv = [
                Object.keys(csvData[0]).join(','),
                ...csvData.map(row => Object.values(row).join(','))
              ].join('\n');
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
              toast.success('📄 Report exported successfully!');
            }
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
        >
          📄 Export to CSV
        </button>
      </div>
    </div>
  );
};

export default FacultyAttendanceReports;

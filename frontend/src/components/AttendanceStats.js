import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Base URL - Change this to switch between development and production
// const BASE_URL = "https://unisphere-backend-o6o2.onrender.com"; // Production
const BASE_URL = "http://localhost:5001"; // Development

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AttendanceStats = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/v1/attendance/my-attendance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setAttendanceData(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch attendance data:", err);
      setError(err.response?.data?.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-white">Loading attendance data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchAttendanceData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!attendanceData) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
        <div className="text-center py-8">
          <p className="text-gray-400">No attendance data available</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const doughnutData = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [
      {
        data: [
          attendanceData.breakdown.present,
          attendanceData.breakdown.absent,
          attendanceData.breakdown.late,
        ],
        backgroundColor: [
          '#10B981', // Green for Present
          '#EF4444', // Red for Absent
          '#F59E0B', // Yellow for Late
        ],
        borderColor: [
          '#059669',
          '#DC2626',
          '#D97706',
        ],
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels: ['Registered Events', 'Attended Events'],
    datasets: [
      {
        label: 'Events',
        data: [attendanceData.totalRegisteredEvents, attendanceData.attendedEvents || attendanceData.breakdown.present + attendanceData.breakdown.late],
        backgroundColor: ['#3B82F6', '#10B981'],
        borderColor: ['#2563EB', '#059669'],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#E5E7EB', // Gray-200
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#9CA3AF', // Gray-400
        },
        grid: {
          color: '#374151', // Gray-700
        },
      },
      x: {
        ticks: {
          color: '#9CA3AF', // Gray-400
        },
        grid: {
          color: '#374151', // Gray-700
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#E5E7EB', // Gray-200
          padding: 20,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Attendance Statistics</h3>
        <button
          onClick={fetchAttendanceData}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Events</p>
              <p className="text-2xl font-bold text-white">{attendanceData.totalRegisteredEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Attended</p>
              <p className="text-2xl font-bold text-white">{attendanceData.attendedEvents || (attendanceData.breakdown.present + attendanceData.breakdown.late)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Attendance Rate</p>
              <p className="text-2xl font-bold text-white">{attendanceData.attendancePercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Event Overview</h3>
          <div className="h-64">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Attendance Breakdown</h3>
          <div className="h-64">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Detailed Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-600 bg-opacity-20 rounded-lg border border-green-600">
            <div className="text-2xl font-bold text-green-400">{attendanceData.breakdown.present}</div>
            <div className="text-sm text-green-300">Present</div>
          </div>
          <div className="text-center p-4 bg-red-600 bg-opacity-20 rounded-lg border border-red-600">
            <div className="text-2xl font-bold text-red-400">{attendanceData.breakdown.absent}</div>
            <div className="text-sm text-red-300">Absent</div>
          </div>
          <div className="text-center p-4 bg-yellow-600 bg-opacity-20 rounded-lg border border-yellow-600">
            <div className="text-2xl font-bold text-yellow-400">{attendanceData.breakdown.late}</div>
            <div className="text-sm text-yellow-300">Late</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceStats;

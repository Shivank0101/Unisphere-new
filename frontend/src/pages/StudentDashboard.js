import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import AttendanceStats from '../components/AttendanceStats';

const StudentDashboard = () => {
  const [clubs, setClubs] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log('🔄 Fetching dashboard data...');
        
        // Fetch clubs
        const clubsRes = await axios.get("http://localhost:5001/api/v1/clubs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('✅ Clubs fetched:', clubsRes.data);
        setClubs(clubsRes.data?.data?.clubs || []);

        // Fetch user's registrations
        console.log('🔄 Fetching user registrations...');
        const registrationsRes = await axios.get("http://localhost:5001/api/v1/registrations/my-registrations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('✅ Registrations fetched:', registrationsRes.data);
        console.log('📊 Number of registrations:', registrationsRes.data?.data?.docs?.length || 0);
        setRegistrations(registrationsRes.data?.data?.docs || []);
        
      } catch (err) {
        console.error("❌ Failed to load data:", err);
        console.error("❌ Error details:", err.response?.data);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleQRScanSuccess = async (message) => {
    setAttendanceMessage(message);
    setShowQRScanner(false);
    
    console.log('🔄 Refreshing data after successful attendance marking...');
    
    // Refresh registration data to show updated attendance status
    try {
      const token = localStorage.getItem("token");
      const registrationsRes = await axios.get("http://localhost:5001/api/v1/registrations/my-registrations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('✅ Registration data refreshed:', registrationsRes.data);
      setRegistrations(registrationsRes.data?.data?.docs || []);
    } catch (err) {
      console.error("❌ Failed to refresh registration data:", err);
    }
    
    // Clear message after 5 seconds
    setTimeout(() => setAttendanceMessage(''), 5000);
  };

  const openQRScanner = () => {
    setShowQRScanner(true);
    setAttendanceMessage('');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-white mb-4">Student Dashboard</h1>

      {/* 🟦 Clubs Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">All Clubs</h2>




        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
  {clubs.map((club) => (
    <div
      key={club._id}
      className="bg-gray-900 rounded-xl border border-gray-700 shadow-md hover:shadow-xl hover:scale-[1.02] transition duration-300 ease-in-out"
    >
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-2">{club.name}</h3>

        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
          {club.description || "No description available."}
        </p>

        <div className="text-sm text-gray-400 mb-3">
          <p><span className="font-medium text-gray-300">Members:</span> {club.memberCount}</p>
          {/* <p><span className="font-medium text-gray-300">Events:</span> {club.eventCount}</p> */}
        </div>

        <button
          className="mt-4 w-full bg-green-600 text-white font-semibold py-2 px-4 rounded hover:bg-green-700 transition"
          onClick={() => navigate(`/studentdashboard/clubdetails/${club._id}`)}
        >
          View Details
        </button>
      </div>
    </div>
  ))}
</div>






      </section>

      {/* 🟨 Events Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Your Events ({registrations.length})</h2>
        {loading ? (
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-white">Loading your events...</span>
            </div>
          </div>
        ) : registrations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {registrations.map((registration) => (
              <div
                key={registration._id}
                className="bg-gray-900 rounded-xl border border-gray-700 shadow-md hover:shadow-xl hover:scale-[1.02] transition duration-300 ease-in-out"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {registration.event?.title || "Event Title"}
                  </h3>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {registration.event?.description || "No description available."}
                  </p>

                  <div className="text-sm text-gray-400 mb-3">
                    <p><span className="font-medium text-gray-300">Date:</span> {
                      registration.event?.startDate 
                        ? new Date(registration.event.startDate).toLocaleDateString()
                        : "TBD"
                    }</p>
                    <p><span className="font-medium text-gray-300">Time:</span> {
                      registration.event?.startDate 
                        ? new Date(registration.event.startDate).toLocaleTimeString()
                        : "TBD"
                    }</p>
                    <p><span className="font-medium text-gray-300">Location:</span> {registration.event?.location || "TBD"}</p>
                    <p><span className="font-medium text-gray-300">Registration Status:</span> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        registration.status === 'registered' ? 'bg-green-600 text-white' :
                        registration.status === 'attended' ? 'bg-blue-600 text-white' :
                        registration.status === 'cancelled' ? 'bg-red-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {registration.status}
                      </span>
                    </p>
                    {registration.event?.club?.name && (
                      <p><span className="font-medium text-gray-300">Club:</span> {registration.event.club.name}</p>
                    )}
                    <p><span className="font-medium text-gray-300">Registered:</span> {
                      new Date(registration.registrationDate).toLocaleDateString()
                    }</p>
                  </div>

                  <div className="space-y-2">
                    <button
                      className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition"
                      onClick={() => navigate(`/event/${registration.event?._id}`)}
                    >
                      View Event Details
                    </button>
                    
                    {registration.status === 'registered' && (
                      <button
                        className="w-full bg-yellow-600 text-white font-semibold py-2 px-4 rounded hover:bg-yellow-700 transition"
                        onClick={openQRScanner}
                      >
                        Mark Attendance
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-8">
            <div className="text-gray-400 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-lg font-medium mb-2">No events registered yet</p>
              <p className="text-sm">Browse clubs above to find events to join!</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Refresh Data
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 🟩 Attendance Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">Your Attendance</h2>
        
        {/* Success/Error Messages */}
        {attendanceMessage && (
          <div className="mb-4 p-4 bg-green-600 text-white rounded-lg">
            {attendanceMessage}
          </div>
        )}

        {/* QR Scanner Button */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 mb-6">
          <div className="text-center">
            <div className="mb-4">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h4m0 0V2m0 2h2m0 0v2M4 20h4m0 0v2m0-2h2m-2 0h-2" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-2">Mark Attendance</h3>
            <p className="text-gray-300 mb-6">
              Scan the QR code displayed by your instructor to mark your attendance for events.
            </p>
            
            <button
              onClick={openQRScanner}
              className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
            >
              <div className="flex items-center justify-center">
                <svg 
                  className="w-5 h-5 mr-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h4m0 0V2m0 2h2m0 0v2M4 20h4m0 0v2m0-2h2m-2 0h-2" />
                </svg>
                Scan QR Code
              </div>
            </button>

            <div className="mt-4 text-xs text-gray-400">
              <p>• Make sure to enable camera permissions</p>
              <p>• QR code must be from your registered events</p>
              <p>• You can only mark attendance once per event</p>
            </div>
          </div>
        </div>

        {/* Attendance Statistics */}
        <AttendanceStats />
      </section>
      
      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onClose={() => setShowQRScanner(false)}
          onSuccess={handleQRScanSuccess}
        />
      )}
    </div>
  );
};

export default StudentDashboard;

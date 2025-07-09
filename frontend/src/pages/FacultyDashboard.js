import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FacultyAttendanceReports from "../components/FacultyAttendanceReports";

const BASE_URL = "https://unisphere-backend-o6o2.onrender.com"; // Production

// const BASE_URL = "http://localhost:5001";

const FacultyDashboard = () => {
  const [clubs, setClubs] = useState([]);
  const [showAttendanceReports, setShowAttendanceReports] = useState(false);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/api/v1/clubs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setClubs(res.data?.data?.clubs || []);
    } catch (err) {
      console.error("❌ Error fetching clubs:", err);
    }
  };

  const handleDelete = async (clubId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/api/v1/clubs/${clubId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setClubs((prev) => prev.filter((club) => club._id !== clubId));
      toast.success("✅ Club deleted successfully!");
    } catch (err) {
      console.error("❌ Error deleting club:", err);
      toast.error("❌ Error deleting club!");
    }
  };

  return (
    <div className="w-full min-h-screen p-6 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      
      {/* Tabs */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-4">
          <button
            onClick={() => setShowAttendanceReports(false)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              !showAttendanceReports
                ? "bg-purple-600 text-white shadow-[0_0_12px_#9333ea]"
                : "bg-white/10 text-gray-300 hover:bg-white/20 border border-purple-400"
            }`}
          >
            🏫 Clubs Management
          </button>

          <button
            onClick={() => setShowAttendanceReports(true)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              showAttendanceReports
                ? "bg-purple-600 text-white shadow-[0_0_12px_#9333ea]"
                : "bg-white/10 text-gray-300 hover:bg-white/20 border border-purple-400"
            }`}
          >
            📊 Attendance Reports
          </button>
        </div>

        {!showAttendanceReports && (
          <Link
            to="/faculty/create-club"
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg shadow-[0_0_12px_#a855f7] transition"
          >
            ➕ Create New Club
          </Link>
        )}
      </div>

      {/* Content */}
      {showAttendanceReports ? (
        <FacultyAttendanceReports />
      ) : (
        <>
          <h1 className="text-4xl font-bold mb-8 drop-shadow-[0_0_6px_#9333ea]">🏫 Faculty Dashboard</h1>

          <section>
            <h2 className="text-2xl font-semibold mb-6">All Clubs</h2>
            {clubs.length === 0 ? (
              <p className="text-gray-400">No clubs found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {clubs.map((club) => (
                  <div
                    key={club._id}
                     className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_4px_#9333ea]"
                  >
                    {club.imageUrl && (
                      <div className="w-full h-48 bg-gray-700 overflow-hidden">
                        <img
                          src={club.imageUrl}
                          alt={club.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="text-xl font-bold text-purple-400 drop-shadow">{club.name}</h3>
                      <p className="text-sm mb-2 text-gray-300">{club.description}</p>
                      <p className="text-gray-400">👥 Members: {club.memberCount}</p>

                      <div className="mt-4 flex gap-3">
                        <Link
                          to={`/faculty/club/${club._id}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded shadow-[0_0_10px_#3b82f6]"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => handleDelete(club._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded shadow-[0_0_10px_#dc2626]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default FacultyDashboard;

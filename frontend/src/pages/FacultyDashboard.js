import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FacultyAttendanceReports from "../components/FacultyAttendanceReports";

const FacultyDashboard = () => {
  const [clubs, setClubs] = useState([]);
  const [showAttendanceReports, setShowAttendanceReports] = useState(false);
  // const navigate = useNavigate();

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://unisphere-backend-o6o2.onrender.com/api/v1/clubs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Fetched Clubs:", res.data);
      setClubs(res.data?.data?.clubs || []);
    } catch (err) {
      console.error("❌ Error fetching clubs:", err);
    }
  };

  const handleDelete = async (clubId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`https://unisphere-backend-o6o2.onrender.com/api/v1/clubs/${clubId}`, {
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
    <div className="p-6 text-white max-w-6xl mx-auto">
      {/* Navigation Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setShowAttendanceReports(false)}
            className={`px-4 py-2 rounded ${
              !showAttendanceReports
                ? "bg-orange-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🏫 Clubs Management
          </button>
          <button
            onClick={() => setShowAttendanceReports(true)}
            className={`px-4 py-2 rounded ${
              showAttendanceReports
                ? "bg-orange-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            📊 Attendance Reports
          </button>
        </div>
        
        {!showAttendanceReports && (
          <Link
            to="/faculty/create-club"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow"
          >
            ➕ Create New Club
          </Link>
        )}
      </div>

      {/* Conditional Content */}
      {showAttendanceReports ? (
        <FacultyAttendanceReports />
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6">🏫 Faculty Dashboard</h1>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">All Clubs</h2>
            {clubs.length === 0 ? (
              <p>No clubs found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clubs.map((club) => (
                  <div key={club._id} className="bg-gray-800 p-4 rounded shadow">
                    <h3 className="text-xl font-bold">{club.name}</h3>
                    <p className="text-sm mb-2">{club.description}</p>
                    <p>👥 Members: {club.memberCount}</p>
                    {/* <p>🎉 Events: {club.eventCount}</p> */}
                    <div className="mt-3 flex gap-2">
                      <Link
                        to={`/faculty/club/${club._id}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => handleDelete(club._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
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

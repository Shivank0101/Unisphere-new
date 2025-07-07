import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FacultyDashboard = () => {
  const [clubs, setClubs] = useState([]);
  // const navigate = useNavigate();

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5001/api/v1/clubs", {
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
      await axios.delete(`http://localhost:5001/api/v1/clubs/${clubId}`, {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🏫 Faculty Dashboard</h1>
        <Link
          to="/faculty/create-club"
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow"
        >
          ➕ Create New Club
        </Link>
      </div>

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

      {/* ✅ Button added at the very bottom */}
    <div className="mt-10 text-center">
      <Link
        to="/faculty/attendance"
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded shadow-md"
      >
        📋 Manage Attendance
      </Link>
    </div>


    </div>
  );
};

export default FacultyDashboard;

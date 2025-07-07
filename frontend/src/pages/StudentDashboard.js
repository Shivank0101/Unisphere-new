import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [clubs, setClubs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5001/api/v1/clubs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setClubs(res.data?.data?.clubs || []);
      } catch (err) {
        console.error("Failed to load clubs:", err);
      }
    };

    fetchClubs();
  }, []);

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
        <h2 className="text-xl font-semibold text-white mb-3">Your Events</h2>
        <div className="text-white"> {/* Add event display here later */}Coming soon...</div>
      </section>

      {/* 🟩 Attendance Section */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-3">Your Attendance</h2>
        <div className="text-white"> {/* Add attendance display here later */}Coming soon...</div>
      </section>
    </div>
  );
};

export default StudentDashboard;

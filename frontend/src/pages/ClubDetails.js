import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import StudentEvents from '../components/StudentEvents';

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Base URL - Change this to switch between development and production
const BASE_URL = "https://unisphere-backend-o6o2.onrender.com"; // Production
// const BASE_URL = "http://localhost:5001"; // Development





const ClubDetails = () => {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);

  

  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${BASE_URL}/api/v1/clubs/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setClub(res.data?.data || null);
        const userId = JSON.parse(atob(token.split('.')[1]))._id;
        setJoined(res.data?.data?.members?.some(m => m._id === userId));
      } catch (err) {
        setError('Failed to fetch club details');
        console.error(err);
      }
    };

    fetchClubDetails();
  }, [id]);

  const handleJoinClub = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BASE_URL}/api/v1/clubs/${id}/join`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setJoined(true);
       toast.success(" Successfully joined the club!");
    } catch (err) {
       toast.error("❌ Error joining the club.");
      console.error(err);
    }
  };

  const handleLeaveClub = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BASE_URL}/api/v1/clubs/${id}/leave`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setJoined(false);
       toast.info(" You have successfully left the club.");
    } catch (err) {
       toast.error("❌ Error leaving the club.");
      console.error(err);
    }
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!club) {
    return <p className="text-white">Loading club details...</p>;
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#0a0f1c] via-[#0e1a2b] to-[#00040f] p-4 sm:p-8 text-white">
  <div className="w-full bg-white/5 backdrop-blur-md border border-cyan-400/20 rounded-xl shadow-md p-6 sm:p-10">
  
      <h1 className="text-3xl font-bold mb-6 border-b border-cyan-400/20 pb-2">{club.name}</h1>

      {club.imageUrl && (
        <div className="w-full h-64 rounded-lg overflow-hidden mb-6">
          <img
            src={club.imageUrl}
            alt={club.name}
            className="w-full h-full object-cover"
            onError={(e) => (e.target.style.display = 'none')}
          />
        </div>
      )}

      <p className="text-gray-300 mb-6">{club.description}</p>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Faculty Coordinator</h2>
        <p className="text-gray-200">{club.facultyCoordinator?.name} ({club.facultyCoordinator?.email})</p>
        <p className="text-sm text-cyan-300">Department: {club.facultyCoordinator?.department}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-center">
        <div>
          <p className="text-2xl font-bold">{club.memberCount}</p>
          <p className="text-cyan-300 text-sm">Members</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{club.eventCount}</p>
          <p className="text-cyan-300 text-sm">Events</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{club.upcomingEvents}</p>
          <p className="text-cyan-300 text-sm">Upcoming</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{club.pastEvents}</p>
          <p className="text-cyan-300 text-sm">Past</p>
        </div>
      </div>

      {/* 🔘 Join / Leave Button */}
      {!joined ? (
        <button
          className="bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200 hover:shadow-[0_0_10px_#00fff7] mb-6"
          onClick={handleJoinClub}
        >
          Join Club
        </button>
      ) : (
        <button
          className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 hover:shadow-[0_0_10px_#ff4d67] mb-6"
          onClick={handleLeaveClub}
        >
          Leave Club
        </button>
      )}

      {/* 👥 Members List */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Members</h2>
        {club.members?.length === 0 ? (
          <p className="text-gray-500">No members yet.</p>
        ) : (
          <ul className="divide-y divide-cyan-800/20">
            {club.members.map((member) => (
              <li key={member._id} className="py-2 text-gray-300">
                {member.name} ({member.email}) – {member.role}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 📅 Events Section */}
      <StudentEvents clubId={club._id} events={club.events} />
    </div>
  </div>
  );
};

export default ClubDetails;

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import StudentEvents from '../components/StudentEvents';

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";





const ClubDetails = () => {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);

  

  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5001/api/v1/clubs/${id}`, {
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
      await axios.post(`http://localhost:5001/api/v1/clubs/${id}/join`, {}, {
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
      await axios.post(`http://localhost:5001/api/v1/clubs/${id}/leave`, {}, {
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
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 rounded-lg shadow-lg text-white">
      <h1 className="text-3xl font-bold mb-4 border-b border-gray-700 pb-2">
        {club.name}
      </h1>

      <p className="text-gray-300 mb-6">{club.description}</p>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Faculty Coordinator</h2>
        <p className="text-gray-300">
          {club.facultyCoordinator?.name} ({club.facultyCoordinator?.email})
        </p>
        <p className="text-gray-400 text-sm">
          Department: {club.facultyCoordinator?.department}
        </p>
      </div>

      <div className="flex flex-wrap gap-6 mb-6">
        <div>
          <p className="text-lg font-semibold">{club.memberCount}</p>
          <p className="text-gray-400 text-sm">Members</p>
        </div>
        <div>
          <p className="text-lg font-semibold">{club.eventCount}</p>
          <p className="text-gray-400 text-sm">Events</p>
        </div>
        <div>
          <p className="text-lg font-semibold">{club.upcomingEvents}</p>
          <p className="text-gray-400 text-sm">Upcoming</p>
        </div>
        <div>
          <p className="text-lg font-semibold">{club.pastEvents}</p>
          <p className="text-gray-400 text-sm">Past</p>
        </div>
      </div>

      {/* Join or Leave Button */}
      {!joined ? (
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded transition mb-6"
          onClick={handleJoinClub}
        >
          Join Club
        </button>
      ) : (
        <button
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition mb-6"
          onClick={handleLeaveClub}
        >
          Leave Club
        </button>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Members</h2>
        {club.members?.length === 0 ? (
          <p className="text-gray-500">No members yet.</p>
        ) : (
          <ul className="divide-y divide-gray-700">
            {club.members.map((member) => (
              <li key={member._id} className="py-2 text-gray-300">
                {member.name} ({member.email}) - {member.role}
              </li>
            ))}
          </ul>
        )}
      </div>


      <StudentEvents clubId={club._id} events={club.events} />

    </div>
  );
};

export default ClubDetails;

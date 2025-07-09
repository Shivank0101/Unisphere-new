import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Base URL - Change this to switch between development and production
const BASE_URL = "https://unisphere-backend-o6o2.onrender.com"; // Production
// const BASE_URL = "http://localhost:5001"; // Development

const StudentEvents = ({ clubId, events }) => {
  const [registeredEventIds, setRegisteredEventIds] = useState([]);
  const [userId, setUserId] = useState("");
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [participantType, setParticipantType] = useState("");

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = JSON.parse(atob(token.split('.')[1]));
    setUserId(decoded._id);

    const fetchMyRegistrations = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/v1/registrations/my-registrations`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const registeredIds = res.data?.data?.docs
          ?.map(reg => reg.event?._id)
          .filter(Boolean); // ignore if event is null
        setRegisteredEventIds(registeredIds || []);
      } catch (err) {
        console.error("Error fetching registered events", err);
      }
    };

    fetchMyRegistrations();
  }, []);

  const handleRegisterClick = (eventId) => {
    setSelectedEventId(eventId);
    setParticipantType("");
    setShowRegistrationModal(true);
  };

  const handleRegister = async () => {
    if (!participantType) {
      toast.error("Please select your participant type");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `${BASE_URL}/api/v1/registrations/register`,
        { 
          eventId: selectedEventId,
          participantType: participantType
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("✅ Successfully registered for the event!");
      setRegisteredEventIds(prev => [...prev, selectedEventId]);
      setShowRegistrationModal(false);
      setSelectedEventId(null);
      setParticipantType("");
    } catch (error) {
      console.error("Registration failed:", error.response?.data || error.message);
      toast.error(`❌ Failed to register: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUnregister = async (eventId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(`${BASE_URL}/api/v1/registrations/unregister`, 
        { eventId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setRegisteredEventIds(registeredEventIds.filter(id => id !== eventId));
       toast.info(" You have been unregistered from the event.");
    } catch (err) {
      toast.error("❌ Unregistration failed");
      console.error(err);
    }
  };

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-white mb-6">Events</h2>
      {events?.length === 0 ? (
        <p className="text-gray-400">No events organized by this club.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {events.map(event => (
            <div
              key={event._id}
              className="bg-white/5 backdrop-blur-md border border-cyan-400/20 rounded-xl shadow-md p-6 transition duration-300 ease-in-out hover:shadow-[0_0_20px_#00fff7]"
            >
              {/* Event Image */}
              {event.imageUrl && (
                <div className="mb-4">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-48 object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      console.error('Failed to load image. Please use a direct image URL (ending with .jpg, .png, etc.):', event.imageUrl);
                    }}
                  />
                </div>
              )}
              
              <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
              </p>
              <p className="text-gray-300 mb-4">{event.description}</p>

              <div className="text-sm text-gray-400 mb-3">
                <p><span className="text-gray-300 font-medium">Type:</span> {event.eventType}</p>
                <p><span className="text-gray-300 font-medium">Location:</span> {event.location}</p>
                {event.maxCapacity && (
                  <p><span className="text-gray-300 font-medium">Max Capacity:</span> {event.maxCapacity}</p>
                )}
              </div>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {event.tags.map((tag, index) => (
                    <span key={index} className="bg-blue-600 text-xs px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {registeredEventIds.includes(event._id) ? (
                <button
                  onClick={() => handleUnregister(event._id)}
                  className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
                >
                  Unregister
                </button>
              ) : (
                <button
                  onClick={() => handleRegisterClick(event._id)}
                  className="mt-4 w-full bg-gradient-to-r from-lime-400 to-emerald-500 hover:from-lime-500 hover:to-emerald-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 hover:shadow-[0_0_10px_#3fff70]"
                >
                  Register
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Select Participation Type</h2>
            <p className="text-gray-600 mb-4">
              Please select how you would like to participate in this event:
            </p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="participantType"
                  value="club_member"
                  checked={participantType === "club_member"}
                  onChange={(e) => setParticipantType(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-semibold text-gray-800">👥 Club Member</div>
                  <div className="text-sm text-gray-600">
                    Participating as a member of the organizing club
                  </div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="participantType"
                  value="volunteer"
                  checked={participantType === "volunteer"}
                  onChange={(e) => setParticipantType(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-semibold text-gray-800">🙋‍♂️ Volunteer</div>
                  <div className="text-sm text-gray-600">
                    Participating as a volunteer to help with the event
                  </div>
                </div>
              </label>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRegistrationModal(false);
                  setSelectedEventId(null);
                  setParticipantType("");
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRegister}
                disabled={!participantType}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded transition"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentEvents;

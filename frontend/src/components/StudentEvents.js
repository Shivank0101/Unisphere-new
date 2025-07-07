import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const StudentEvents = ({ clubId, events }) => {
  const [registeredEventIds, setRegisteredEventIds] = useState([]);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = JSON.parse(atob(token.split('.')[1]));
    setUserId(decoded._id);

    const fetchMyRegistrations = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/v1/registrations/my-registrations", {
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

  const handleRegister = async (eventId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        "http://localhost:5001/api/v1/registrations/register",
        { eventId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(" Successfully registered for the event!");
      setRegisteredEventIds(prev => [...prev, eventId]);
    } catch (error) {
      console.error("Registration failed:", error.response?.data || error.message);
      toast.error(`❌ Failed to register: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUnregister = async (eventId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(`http://localhost:5001/api/v1/registrations/unregister`, 
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
              className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6 transition duration-300 ease-in-out hover:shadow-2xl"
            >
              <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
              </p>
              <p className="text-gray-300 mb-4">{event.description}</p>

              <div className="text-sm text-gray-400 mb-3">
                <p><span className="text-gray-300 font-medium">Type:</span> {event.eventType}</p>
                <p><span className="text-gray-300 font-medium">Location:</span> {event.location}</p>
              </div>

              {registeredEventIds.includes(event._id) ? (
                <button
                  onClick={() => handleUnregister(event._id)}
                  className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
                >
                  Unregister
                </button>
              ) : (
                <button
                  onClick={() => handleRegister(event._id)}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
                >
                  Register
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentEvents;

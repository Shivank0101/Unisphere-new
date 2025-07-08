import React, { useState, useEffect } from 'react';
import { useParams,Link } from 'react-router-dom';
import axios from 'axios';

// Base URL - Change this to switch between development and production
//const BASE_URL = "https://unisphere-backend-o6o2.onrender.com"; // Production
const BASE_URL = "http://localhost:5001"; // Development

const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    axios.get(`${BASE_URL}/api/events/${id}`)
      .then(response => setEvent(response.data))
      .catch(error => console.error(error));
  }, [id]);

  if (!event) return <div className="flex justify-center items-center h-screen text-gray-700">Loading...</div>;

  return (
    <div className="container mx-auto p-6 max-w-2xl bg-white shadow-md rounded-lg">
      
       {/* 🔘 Edit Event Button */}
    <div className="flex justify-end mb-4">
      <Link
        to={`/edit/${event._id}`}
        className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition"
      >
        Edit Event
      </Link>
    </div>

      {/* Event Image */}
      {event.imageUrl && (
        <div className="mb-6">
          <img
            src={event.imageUrl}
            alt={event.title || event.name}
            className="w-full h-64 object-cover rounded-lg shadow-md"
            onError={(e) => {
              e.target.style.display = 'none';
              console.error('Failed to load image:', event.imageUrl);
            }}
          />
        </div>
      )}
  
      <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 text-transparent bg-clip-text mb-4 font-satisfy">
        {event.title || event.name}
      </h1>
      <p className="text-lg text-gray-600 mb-2">{new Date(event.startDate || event.date).toLocaleDateString()}</p>
      <p className="text-base text-gray-800 mb-4">{event.description || 'No description provided'}</p>
      <p className="text-base text-gray-800 mb-4">📍 {event.location || 'No location provided'}</p>
      
      {/* Additional Event Details */}
      {event.eventType && (
        <p className="text-base text-gray-800 mb-2">🏷 Type: {event.eventType}</p>
      )}
      {event.maxCapacity && (
        <p className="text-base text-gray-800 mb-2">👥 Max Capacity: {event.maxCapacity}</p>
      )}
      {event.tags && event.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {event.tags.map((tag, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="bg-gray-50 p-4 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Attendees</h2>
        {(event.attendees || event.registrations || []).length > 0 ? (
          <ul className="list-disc pl-5 space-y-2">
            {(event.attendees || event.registrations || []).map((attendee, index) => (
              <li key={index} className="text-gray-700">
                <strong>{attendee.name}</strong> - {attendee.email}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No attendees</p>
        )}
      </div>
    </div>
  );
};

export default EventDetails;

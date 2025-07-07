import React, { useState, useEffect } from 'react';
import { useParams,Link } from 'react-router-dom';
import axios from 'axios';

const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5001/api/events/${id}`)
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
  
      <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 text-transparent bg-clip-text mb-4 font-satisfy">
        {event.name}
      </h1>
      <p className="text-lg text-gray-600 mb-2">{new Date(event.date).toLocaleDateString()}</p>
      <p className="text-base text-gray-800 mb-4">{event.description || 'No description provided'}</p>
      <p className="text-base text-gray-800 mb-4">{event.location || 'No location provided'}</p>
      <div className="bg-gray-50 p-4 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Attendees</h2>
        {event.attendees.length > 0 ? (
          <ul className="list-disc pl-5 space-y-2">
            {event.attendees.map((attendee, index) => (
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

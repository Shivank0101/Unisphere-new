import React, { useEffect, useState } from "react";
import axios from "axios";

import { useNavigate } from "react-router-dom";


const FacultyClubEvents = ({ clubId }) => {
  const [events, setEvents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [qrData, setQrData] = useState(null);


  const navigate = useNavigate();


  const [newEvent, setNewEvent] = useState({
    title: "", description: "", startDate: "", endDate: "",
    location: "", maxCapacity: "", eventType: "", imageUrl: "", tags: ""
  });

  const fetchClubEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://unisphere-backend-o6o2.onrender.com/api/v1/events/club/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(res.data);
    } catch (err) {
      console.error("Error fetching events", err);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...newEvent,
        club: clubId,
        maxCapacity: Number(newEvent.maxCapacity),
        eventType: newEvent.eventType.toLowerCase()
      };
      await axios.post(`http://unisphere-backend-o6o2.onrender.com/api/v1/events`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      resetForm();
      fetchClubEvents();
    } catch (err) {
      console.error("Error creating event", err.response?.data || err.message);
      alert("Failed to create event");
    }
  };

  const handleEditEvent = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...newEvent,
        club: clubId,
        maxCapacity: Number(newEvent.maxCapacity),
        eventType: newEvent.eventType.toLowerCase()
      };
      await axios.put(`http://unisphere-backend-o6o2.onrender.com/api/v1/events/${editingEventId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      resetForm();
      fetchClubEvents();
    } catch (err) {
      console.error("Error updating event", err.response?.data || err.message);
      alert("Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://unisphere-backend-o6o2.onrender.com/api/v1/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchClubEvents();
    } catch (err) {
      console.error("Error deleting event", err);
      alert("Failed to delete event");
    }
  };

  const handleSendReminder = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://unisphere-backend-o6o2.onrender.com/api/v1/events/${eventId}/remind`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Reminder sent successfully!");
    } catch (err) {
      console.error("Error sending reminder", err);
      alert("Reminder sending failed!");
    }
  };

  const handleEditClick = (event) => {
    setNewEvent({
      ...event,
      tags: Array.isArray(event.tags) ? event.tags.join(",") : event.tags
    });
    setEditingEventId(event._id);
    setShowCreateForm(true);
  };

 const handleGenerateQR = async (eventId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`http://unisphere-backend-o6o2.onrender.com/api/v1/attendance/qr/generate/${eventId}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const { qrCodeUrl, expiresAt } = response.data.data;
    setQrData({ eventId, qrCodeUrl, expiresAt }); // Store QR for modal or display
    alert("✅ QR Code generated successfully!");
  } catch (error) {
    console.error("QR generation failed", error);
    alert("❌ Failed to generate QR Code.");
  }
};






  const resetForm = () => {
    setShowCreateForm(false);
    setEditingEventId(null);
    setNewEvent({
      title: "", description: "", startDate: "", endDate: "",
      location: "", maxCapacity: "", eventType: "", imageUrl: "", tags: ""
    });
  };

  useEffect(() => {
    if (clubId) fetchClubEvents();
  }, [clubId]);

  return (
    <div className="bg-gray-900 p-4 mt-6 rounded-lg">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">📅 Club Events</h2>
        <button
          onClick={() => {
            if (editingEventId) resetForm(); 
            else setShowCreateForm(!showCreateForm);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
        >
          {showCreateForm ? "Cancel" : "➕ Create Event"}
        </button>
      </div>

      {showCreateForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-gray-800 p-6 rounded-lg shadow-md text-white">
          <input className="p-2 rounded bg-gray-700 text-white placeholder-gray-400"
            placeholder="Title"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />

          <input className="p-2 rounded bg-gray-700 text-white placeholder-gray-400"
            placeholder="Location"
            value={newEvent.location}
            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} />

          <input
  type="datetime-local"
  className="p-2 rounded bg-gray-700 text-white"
  value={newEvent.startDate ? newEvent.startDate.slice(0, 16) : ""}
  onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}

  
/>

<input
  type="datetime-local"
  className="p-2 rounded bg-gray-700 text-white"
  value={newEvent.endDate ? newEvent.endDate.slice(0, 16) : ""}
  onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
/>


          <input type="number" className="p-2 rounded bg-gray-700 text-white placeholder-gray-400"
            placeholder="Max Capacity"
            value={newEvent.maxCapacity}
            onChange={(e) => setNewEvent({ ...newEvent, maxCapacity: e.target.value })} />

          <select className="p-2 rounded bg-gray-700 text-white"
            value={newEvent.eventType}
            onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}>
            <option value="">Select Event Type</option>
            <option value="workshop">Workshop</option>
            <option value="seminar">Seminar</option>
            <option value="competition">Competition</option>
            <option value="meeting">Meeting</option>
            <option value="social">Social</option>
            <option value="other">Other</option>
          </select>

          <input className="p-2 rounded bg-gray-700 text-white placeholder-gray-400"
            placeholder="Image URL"
            value={newEvent.imageUrl}
            onChange={(e) => setNewEvent({ ...newEvent, imageUrl: e.target.value })} />

          <input className="p-2 rounded bg-gray-700 text-white placeholder-gray-400"
            placeholder="Tags (comma separated)"
            value={newEvent.tags}
            onChange={(e) =>
              setNewEvent({ ...newEvent, tags: e.target.value })
            } />

          <textarea rows="2" className="col-span-1 md:col-span-2 p-2 rounded bg-gray-700 text-white placeholder-gray-400"
            placeholder="Description"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} />

          <button
            onClick={editingEventId ? handleEditEvent : handleCreateEvent}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold col-span-1 md:col-span-2 px-4 py-2 rounded transition duration-200"
          >
            {editingEventId ? "💾 Update Event" : "✅ Create Event"}
          </button>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {events.length === 0 ? (
          <p className="text-gray-400">No events available.</p>
        ) : (
          events.map((event) => (
            <div key={event._id} className="bg-gray-800 p-4 rounded text-white">
              <h3 className="text-xl font-semibold">{event.title}</h3>
              <p className="text-sm">{event.description}</p>
              <p className="text-sm text-gray-400">📍 {event.location}</p>
              <p className="text-sm text-gray-400">🗓 {new Date(event.startDate).toLocaleString()} → {new Date(event.endDate).toLocaleString()}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <button onClick={() => handleEditClick(event)} className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded">✏ Edit</button>
                <button onClick={() => handleDeleteEvent(event._id)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded">🗑 Delete</button>
                <button onClick={() => handleSendReminder(event._id)} className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded">📧 Send Reminder</button>
                <button onClick={() => handleGenerateQR(event._id)} className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded">📷 Generate QR</button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Modal to display QR Code */}
      {qrData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-4 text-black">📷 QR Code for Event</h2>
            <img src={qrData.qrCodeUrl} alt="QR Code" className="mx-auto mb-4 w-64 h-64" />
            <p className="text-gray-600 mb-2">⏰ Expires at: {new Date(qrData.expiresAt).toLocaleTimeString()}</p>
            <button
              onClick={() => setQrData(null)}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default FacultyClubEvents;

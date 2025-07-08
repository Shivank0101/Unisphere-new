import React, { useEffect, useState } from "react";
import axios from "axios";

import { useNavigate } from "react-router-dom";

// Base URL - Change this to switch between development and production
//const BASE_URL = "https://unisphere-backend-o6o2.onrender.com"; // Production
const BASE_URL = "http://localhost:5001"; // Development

const FacultyClubEvents = ({ clubId }) => {
  const [events, setEvents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [imageError, setImageError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageUploadMode, setImageUploadMode] = useState("url"); // "url" or "file"

  const navigate = useNavigate();

  const [newEvent, setNewEvent] = useState({
    title: "", description: "", startDate: "", endDate: "",
    location: "", maxCapacity: "", eventType: "", imageUrl: "", tags: ""
  });

  // Helper function to validate image URL
  const isValidImageUrl = (url) => {
    if (!url) return true; // Empty URL is valid (optional field)
    
    // Check if URL starts with http/https
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false;
    }
    
    // Check if URL ends with common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const urlLower = url.toLowerCase();
    const hasValidExtension = imageExtensions.some(ext => urlLower.includes(ext));
    
    // Also check for common image hosting patterns
    const validHosts = ['imgur.com', 'cloudinary.com', 'unsplash.com', 'pexels.com'];
    const hasValidHost = validHosts.some(host => urlLower.includes(host));
    
    // Reject Google search URLs
    if (urlLower.includes('google.com/search') || urlLower.includes('googleusercontent.com')) {
      return false;
    }
    
    return hasValidExtension || hasValidHost;
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setNewEvent({ ...newEvent, imageUrl: url });
    
    if (url && !isValidImageUrl(url)) {
      setImageError("Please enter a valid image URL (e.g., https://example.com/image.jpg)");
    } else {
      setImageError("");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setImageError("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setImageError("File size must be less than 5MB");
        return;
      }
      
      setSelectedFile(file);
      setImageError("");
      
      // Clear URL input when file is selected
      setNewEvent({ ...newEvent, imageUrl: "" });
    }
  };

  const handleImageModeChange = (mode) => {
    setImageUploadMode(mode);
    setSelectedFile(null);
    setImageError("");
    setNewEvent({ ...newEvent, imageUrl: "" });
  };

  const fetchClubEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/api/v1/events/club/${clubId}`, {
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
      
      // Validate required fields on frontend
      if (!newEvent.title || !newEvent.description || !newEvent.startDate || !newEvent.endDate || !newEvent.location) {
        alert("Please fill in all required fields (title, description, start date, end date, location)");
        return;
      }
      
      // Validate image URL if provided (only for URL mode)
      if (imageUploadMode === "url" && newEvent.imageUrl && !isValidImageUrl(newEvent.imageUrl)) {
        alert("Please enter a valid image URL. Use direct links to images (e.g., https://example.com/image.jpg)");
        return;
      }
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', newEvent.title);
      formData.append('description', newEvent.description);
      formData.append('startDate', newEvent.startDate);
      formData.append('endDate', newEvent.endDate);
      formData.append('location', newEvent.location);
      formData.append('club', clubId);
      formData.append('eventType', newEvent.eventType ? newEvent.eventType.toLowerCase() : "other");
      
      if (newEvent.maxCapacity) {
        formData.append('maxCapacity', Number(newEvent.maxCapacity));
      }
      
      if (newEvent.tags) {
        formData.append('tags', newEvent.tags);
      }
      
      // Add image - either file or URL
      if (imageUploadMode === "file" && selectedFile) {
        formData.append('image', selectedFile);
      } else if (imageUploadMode === "url" && newEvent.imageUrl) {
        formData.append('imageUrl', newEvent.imageUrl);
      }
      
      // Debug: Log the formData contents
      console.log("Creating event with FormData");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      await axios.post(`${BASE_URL}/api/v1/events`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      resetForm();
      fetchClubEvents();
      alert("✅ Event created successfully!");
    } catch (err) {
      console.error("Error creating event", err.response?.data || err.message);
      alert(`Failed to create event: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleEditEvent = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Validate required fields on frontend
      if (!newEvent.title || !newEvent.description || !newEvent.startDate || !newEvent.endDate || !newEvent.location) {
        alert("Please fill in all required fields (title, description, start date, end date, location)");
        return;
      }
      
      // Validate image URL if provided (only for URL mode)
      if (imageUploadMode === "url" && newEvent.imageUrl && !isValidImageUrl(newEvent.imageUrl)) {
        alert("Please enter a valid image URL. Use direct links to images (e.g., https://example.com/image.jpg)");
        return;
      }
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', newEvent.title);
      formData.append('description', newEvent.description);
      formData.append('startDate', newEvent.startDate);
      formData.append('endDate', newEvent.endDate);
      formData.append('location', newEvent.location);
      formData.append('eventType', newEvent.eventType ? newEvent.eventType.toLowerCase() : "other");
      
      if (newEvent.maxCapacity) {
        formData.append('maxCapacity', Number(newEvent.maxCapacity));
      }
      
      if (newEvent.tags) {
        formData.append('tags', newEvent.tags);
      }
      
      // Add image - either file or URL
      if (imageUploadMode === "file" && selectedFile) {
        formData.append('image', selectedFile);
      } else if (imageUploadMode === "url" && newEvent.imageUrl) {
        formData.append('imageUrl', newEvent.imageUrl);
      }
      
      // Debug: Log the formData contents
      console.log("Editing event with FormData");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      await axios.put(`${BASE_URL}/api/v1/events/${editingEventId}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      resetForm();
      fetchClubEvents();
      alert("✅ Event updated successfully!");
    } catch (err) {
      console.error("Error updating event", err.response?.data || err.message);
      alert("Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/api/v1/events/${eventId}`, {
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
      await axios.post(`${BASE_URL}/api/v1/events/${eventId}/remind`, {}, {
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
    
    if (!token) {
      alert("❌ Authentication required. Please login again.");
      return;
    }

    // Debug: Check user role from token
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      console.log("🔍 User role from token:", tokenPayload.role);
      console.log("🔍 User details:", tokenPayload);
    } catch (tokenError) {
      console.error("❌ Error parsing token:", tokenError);
    }

    console.log("🔄 Generating QR code for event ID:", eventId);
    
    const response = await axios.post(`${BASE_URL}/api/v1/attendance/qr/generate/${eventId}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log("✅ QR Response:", response.data);
    
    if (response.data && response.data.data) {
      const { qrCodeUrl, expiresAt } = response.data.data;
      setQrData({ eventId, qrCodeUrl, expiresAt });
      alert("✅ QR Code generated successfully!");
    } else {
      console.error("❌ Invalid response structure:", response.data);
      alert("❌ Failed to generate QR Code - Invalid response.");
    }
  } catch (error) {
    console.error("❌ QR generation failed:", error);
    
    if (error.response) {
      // Server responded with error status
      console.error("❌ Response data:", error.response.data);
      console.error("❌ Response status:", error.response.status);
      
      if (error.response.status === 403) {
        alert("❌ Permission denied. Only faculty can generate QR codes. Please make sure you're logged in as faculty.");
      } else if (error.response.status === 404) {
        alert("❌ Event not found.");
      } else if (error.response.status === 500) {
        alert("❌ Server error. Please try again later.");
      } else {
        alert(`❌ Failed to generate QR Code: ${error.response.data?.message || error.message}`);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error("❌ No response received:", error.request);
      alert("❌ Network error. Please check your connection.");
    } else {
      // Something else happened
      console.error("❌ Error:", error.message);
      alert(`❌ Error: ${error.message}`);
    }
  }
};






  const resetForm = () => {
    setShowCreateForm(false);
    setEditingEventId(null);
    setImageError("");
    setSelectedFile(null);
    setImageUploadMode("url");
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

          {/* Image Upload Section */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Image
            </label>
            
            {/* Image Mode Toggle */}
            <div className="flex gap-4 mb-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="imageMode"
                  value="url"
                  checked={imageUploadMode === "url"}
                  onChange={() => handleImageModeChange("url")}
                  className="mr-2"
                />
                <span className="text-sm text-gray-400">Image URL</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="imageMode"
                  value="file"
                  checked={imageUploadMode === "file"}
                  onChange={() => handleImageModeChange("file")}
                  className="mr-2"
                />
                <span className="text-sm text-gray-400">Upload File</span>
              </label>
            </div>
            
            {/* URL Input */}
            {imageUploadMode === "url" && (
              <div>
                <input 
                  className="w-full p-2 rounded bg-gray-700 text-white placeholder-gray-400"
                  placeholder="Image URL (e.g., https://example.com/image.jpg)"
                  value={newEvent.imageUrl}
                  onChange={handleImageUrlChange} 
                />
                <p className="text-xs text-gray-400 mt-1">
                  💡 Tip: Use image hosting services like Imgur, Cloudinary, or direct URLs to publicly accessible images
                </p>
              </div>
            )}
            
            {/* File Input */}
            {imageUploadMode === "file" && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full p-2 rounded bg-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                <p className="text-xs text-gray-400 mt-1">
                  💡 Tip: Upload images directly from your device (JPEG, PNG, GIF, WebP - max 5MB)
                </p>
                {selectedFile && (
                  <p className="text-xs text-green-400 mt-1">
                    ✅ Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            )}
            
            {imageError && (
              <p className="text-xs text-red-400 mt-1">⚠️ {imageError}</p>
            )}
          </div>

          {/* Image Preview */}
          {((imageUploadMode === "url" && newEvent.imageUrl) || (imageUploadMode === "file" && selectedFile)) && (
            <div className="col-span-1 md:col-span-2">
              <p className="text-sm text-gray-400 mb-2">Image Preview:</p>
              <img
                src={imageUploadMode === "url" ? newEvent.imageUrl : URL.createObjectURL(selectedFile)}
                alt="Event preview"
                className="w-full max-w-md h-48 object-cover rounded"
                onError={(e) => {
                  e.target.style.display = 'none';
                  setImageError("Failed to load image. Please check the URL or file and try again.");
                }}
                onLoad={(e) => {
                  e.target.style.display = 'block';
                  setImageError("");
                }}
              />
            </div>
          )}

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
              <div className="flex flex-col md:flex-row gap-4">
                {/* Event Image */}
                {event.imageUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full md:w-48 h-32 object-cover rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        console.error('Failed to load image:', event.imageUrl);
                      }}
                    />
                  </div>
                )}
                
                {/* Event Details */}
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold">{event.title}</h3>
                  <p className="text-sm">{event.description}</p>
                  <p className="text-sm text-gray-400">📍 {event.location}</p>
                  <p className="text-sm text-gray-400">🗓 {new Date(event.startDate).toLocaleString()} → {new Date(event.endDate).toLocaleString()}</p>
                  {event.maxCapacity && (
                    <p className="text-sm text-gray-400">👥 Max Capacity: {event.maxCapacity}</p>
                  )}
                  {event.eventType && (
                    <p className="text-sm text-gray-400">🏷 Type: {event.eventType}</p>
                  )}
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {event.tags.map((tag, index) => (
                        <span key={index} className="bg-blue-600 text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-3">
                <button onClick={() => handleEditClick(event)} className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded">✏ Edit</button>
                <button onClick={() => handleDeleteEvent(event._id)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded">🗑 Delete</button>
                <button onClick={() => handleSendReminder(event._id)} className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded">📧 Send Reminder</button>
                <button onClick={() => handleGenerateQR(event._id)} className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded">📷 Generate QR</button>
                <button onClick={() => navigate(`/faculty/event/${event._id}/attendance`)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded">👥 Manage Attendance</button>
              </div>
            </div>
          ))
        )}
      </div>
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

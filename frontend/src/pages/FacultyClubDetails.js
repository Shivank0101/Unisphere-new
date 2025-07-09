import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import FacultyClubEvents from "../components/FacultyClubEvents";

// Base URL - Change this to switch between development and production
//const BASE_URL = "https://unisphere-backend-o6o2.onrender.com"; // Production
const BASE_URL = "http://localhost:5001"; // Development

const FacultyClubDetails = () => {
  const { clubId } = useParams();
  const [club, setClub] = useState(null);
  const [newMemberId, setNewMemberId] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [updatedClub, setUpdatedClub] = useState({ 
    name: "", 
    description: "",
    imageUrl: "",
    imageFile: null
  });
  const [imageMode, setImageMode] = useState('url'); // 'url' or 'file'
  const [imagePreview, setImagePreview] = useState(null);

  const fetchClub = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/api/v1/clubs/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClub(res.data.data);
      setUpdatedClub({
        name: res.data.data.name,
        description: res.data.data.description,
        imageUrl: res.data.data.imageUrl || "",
        imageFile: null
      });
      setImagePreview(res.data.data.imageUrl || null);
    } catch (err) {
      console.error("Failed to fetch club details:", err);
    }
  };

  useEffect(() => {
    fetchClub();
  }, [clubId]);

  const handleAddMember = async () => {
    if (!newMemberId.trim()) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BASE_URL}/api/v1/clubs/${clubId}/join`,
        { userId: newMemberId }, // assuming your backend accepts this structure
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNewMemberId("");
      fetchClub();
    } catch (err) {
      console.error("Error adding member:", err);
      alert("Failed to add member. Make sure the ID is valid.");
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/api/v1/clubs/${clubId}/remove-member/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchClub();
    } catch (err) {
      console.error("Error removing member:", err);
      alert("Failed to remove member.");
    }
  };

  const handleUpdateClub = async () => {
    try {
      const token = localStorage.getItem("token");
      
      let requestData;
      let headers = { Authorization: `Bearer ${token}` };

      if (imageMode === 'file' && updatedClub.imageFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('name', updatedClub.name);
        formData.append('description', updatedClub.description);
        formData.append('image', updatedClub.imageFile);
        
        requestData = formData;
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        // Use JSON for URL or no image
        requestData = {
          name: updatedClub.name,
          description: updatedClub.description,
          imageUrl: imageMode === 'url' ? updatedClub.imageUrl : undefined
        };
        headers['Content-Type'] = 'application/json';
      }

      await axios.put(`${BASE_URL}/api/v1/clubs/${clubId}`, requestData, { headers });
      setEditMode(false);
      fetchClub();
    } catch (err) {
      console.error("Error updating club:", err);
      alert("Failed to update club.");
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUpdatedClub({ ...updatedClub, imageFile: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setUpdatedClub({ ...updatedClub, imageUrl: url });
    setImagePreview(url);
  };

  if (!club) return <p className="text-white p-4">Loading...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">📘 Club Details</h1>

      {editMode ? (
        <div className="bg-gray-800 p-4 rounded mb-4">
          <input
            className="w-full p-2 mb-2 bg-gray-700 rounded"
            value={updatedClub.name}
            onChange={(e) => setUpdatedClub({ ...updatedClub, name: e.target.value })}
            placeholder="Club Name"
          />
          <textarea
            className="w-full p-2 mb-4 bg-gray-700 rounded"
            value={updatedClub.description}
            onChange={(e) => setUpdatedClub({ ...updatedClub, description: e.target.value })}
            placeholder="Club Description"
          />
          
          {/* Image Upload Section */}
          <div className="mb-4">
            <label className="block text-white mb-2">Club Image:</label>
            <div className="flex gap-4 mb-3">
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`px-4 py-2 rounded ${
                  imageMode === 'url' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                Image URL
              </button>
              <button
                type="button"
                onClick={() => setImageMode('file')}
                className={`px-4 py-2 rounded ${
                  imageMode === 'file' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                Upload File
              </button>
            </div>

            {imageMode === 'url' ? (
              <input
                type="url"
                value={updatedClub.imageUrl}
                onChange={handleImageUrlChange}
                placeholder="Enter image URL"
                className="w-full p-2 bg-gray-700 rounded"
              />
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="w-full p-2 bg-gray-700 rounded"
              />
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <button
            onClick={handleUpdateClub}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mr-2"
          >
            Save
          </button>
          <button
            onClick={() => setEditMode(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 p-4 rounded mb-4">
          {/* Club Image Display */}
          {club.imageUrl && (
            <div className="w-full h-48 bg-gray-700 rounded-lg overflow-hidden mb-4">
              <img
                src={club.imageUrl}
                alt={club.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <h2 className="text-xl font-semibold mb-2">{club.name}</h2>
          <p className="mb-2">{club.description}</p>
          <p><strong>Faculty Coordinator:</strong> {club.facultyCoordinator?.name}</p>
          <p><strong>Email:</strong> {club.facultyCoordinator?.email}</p>
          <p><strong>Department:</strong> {club.facultyCoordinator?.department}</p>
          <button
            onClick={() => setEditMode(true)}
            className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
          >
            ✏️ Update Club
          </button>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">👥 Members ({club.memberCount})</h3>
        <div className="space-y-2">
          {club.members.map((member) => (
            <div
              key={member._id}
              className="flex justify-between items-center bg-gray-700 p-2 rounded"
            >
              <div>
                <p className="font-medium">
                  {member.name}
                  {member._id === club.facultyCoordinator?._id && (
                    <span className="ml-2 text-yellow-400 text-sm">👨‍🏫 Faculty Coordinator</span>
                  )}
                </p>
                <p className="text-sm text-gray-300">{member.email}</p>
              </div>
              
              {/* Hide Remove button for faculty coordinator */}
              {member._id !== club.facultyCoordinator?._id && (
                <button
                  onClick={() => handleRemoveMember(member._id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">➕ Add Member (by User ID)</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMemberId}
            onChange={(e) => setNewMemberId(e.target.value)}
            placeholder="Enter User ID"
            className="w-full bg-gray-700 p-2 rounded"
          />
          <button
            onClick={handleAddMember}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
      </div>
        <FacultyClubEvents clubId={clubId} />
    </div>
  );
};

export default FacultyClubDetails;

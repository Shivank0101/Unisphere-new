import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import FacultyClubEvents from "../components/FacultyClubEvents";

// Base URL - Change this to switch between development and production
const BASE_URL = "https://unisphere-backend-o6o2.onrender.com"; // Production
// const BASE_URL = "http://localhost:5001"; // Development

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
    
  <div className="min-h-screen w-full px-6 py-8 bg-gradient-to-br from-[#0f0f10] via-[#121212] to-[#1a1a1a] text-white">
    <h1 className="text-3xl font-extrabold mb-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.9)]">
       Club Details
    </h1>

    {editMode ? (
      <div className="backdrop-blur-xl bg-white/5 border border-cyan-400 rounded-xl p-6 shadow-2xl shadow-cyan-400/40 hover:shadow-cyan-400/80 hover:scale-105 transition-all duration-300"
      >
        <input
          className="w-full p-3 mb-4 bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          value={updatedClub.name}
          onChange={(e) => setUpdatedClub({ ...updatedClub, name: e.target.value })}
          placeholder="Club Name"
        />
        <textarea
          className="w-full p-3 mb-4 bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          value={updatedClub.description}
          onChange={(e) => setUpdatedClub({ ...updatedClub, description: e.target.value })}
          placeholder="Club Description"
        />

        <div className="mb-4">
          <label className="block mb-2 text-white font-medium">Club Image:</label>
          <div className="flex gap-4 mb-3">
            <button
              type="button"
              onClick={() => setImageMode("url")}
              className={`px-4 py-2 rounded transition-all ${
                imageMode === "url"
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              Image URL
            </button>
            <button
              type="button"
              onClick={() => setImageMode("file")}
              className={`px-4 py-2 rounded transition-all ${
                imageMode === "file"
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              Upload File
            </button>
          </div>

          {imageMode === "url" ? (
            <input
              type="url"
              value={updatedClub.imageUrl}
              onChange={handleImageUrlChange}
              placeholder="Enter image URL"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg placeholder-gray-400 text-white"
            />
          ) : (
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          )}

          {imagePreview && (
            <div className="mt-3">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded shadow-md border border-cyan-500/20"
              />
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleUpdateClub}
            className="bg-gradient-to-r from-cyan-500 to-blue-700 hover:from-cyan-600 hover:to-blue-800 text-white px-4 py-2 rounded shadow-md shadow-cyan-500/30 transition-all"
          >
            ✅ Save
          </button>
          <button
            onClick={() => setEditMode(false)}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded shadow-md"
          >
            ❌ Cancel
          </button>
        </div>
      </div>
    ) : (
      <div className="backdrop-blur-xl bg-white/5 border border-cyan-400 rounded-xl p-6 shadow-2xl shadow-cyan-400/40 hover:shadow-cyan-400/80 hover:scale-105 transition-all duration-300 mb-6">

        {club.imageUrl && (
          <div className="w-full h-48 rounded-lg overflow-hidden mb-4 border border-cyan-500/20 bg-white/5 backdrop-blur-lg shadow-md shadow-cyan-500/10">
            <img
              src={club.imageUrl}
              alt={club.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h2 className="text-2xl font-bold mb-2 text-cyan-400">{club.name}</h2>
        <p className="mb-2 text-gray-300">{club.description}</p>
        <p><strong>Faculty Coordinator:</strong> {club.facultyCoordinator?.name}</p>
        <p><strong>Email:</strong> {club.facultyCoordinator?.email}</p>
        <p><strong>Department:</strong> {club.facultyCoordinator?.department}</p>
        <button
          onClick={() => setEditMode(true)}
          className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded shadow-md"
        >
          ✏️ Update Club
        </button>
      </div>
    )}

    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-4 text-purple-400 drop-shadow-[0_0_6px_rgba(192,132,252,0.4)]">👥 Members ({club.memberCount})</h3>
      <div className="space-y-3">
        {club.members.map((member) => (
          <div
            key={member._id}
            className="flex justify-between items-center bg-white/5 backdrop-blur-md p-3 rounded-lg border border-purple-400  shadow-purple-400/40  hover:scale-[1.03] transition-all duration-300"
          >
            <div>
              <p className="font-medium text-white">
                {member.name}
                {member._id === club.facultyCoordinator?._id && (
                  <span className="ml-2 text-yellow-400 text-sm">👨‍🏫 Faculty Coordinator</span>
                )}
              </p>
              <p className="text-sm text-gray-300">{member.email}</p>
            </div>

            {member._id !== club.facultyCoordinator?._id && (
              <button
                onClick={() => handleRemoveMember(member._id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded shadow-sm"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>

    <div className="backdrop-blur-xl bg-white/5 border border-emerald-400 rounded-xl p-6 shadow-2xl   hover:scale-105 transition-all duration-300 mb-6">

      <h3 className="text-xl font-semibold mb-2 text-emerald-300 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]">
        ➕ Add Member (by User ID)
      </h3>
      <div className="flex gap-3">
        <input
          type="text"
          value={newMemberId}
          onChange={(e) => setNewMemberId(e.target.value)}
          placeholder="Enter User ID"
          className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
        />
        <button
          onClick={handleAddMember}
          className="bg-gradient-to-r from-emerald-400 to-green-600 hover:from-emerald-500 hover:to-green-700 text-white px-4 py-2 rounded shadow-md shadow-emerald-400/30 transition-all"
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

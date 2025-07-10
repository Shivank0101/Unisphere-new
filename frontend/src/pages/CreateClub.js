import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Base URL - Change this to switch between development and production
// const BASE_URL = "https://unisphere-backend-o6o2.onrender.com"; // Production
 const BASE_URL = "http://localhost:5001"; // Development

const CreateClub = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clubType, setClubType] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageUploadMode, setImageUploadMode] = useState("url"); // "url" or "file"
  const [imageError, setImageError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const clubTypes = [
    { value: 'cultural', label: 'Cultural', limit: '1 allowed' },
    { value: 'dance', label: 'Dance', limit: '1 allowed' },
    { value: 'singing', label: 'Singing', limit: '1 allowed' },
    { value: 'robotics', label: 'Robotics', limit: '1 allowed' },
    { value: 'tech', label: 'Tech', limit: '2 allowed' },
    { value: 'sports', label: 'Sports', limit: '1 allowed' }
  ];

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
    setImageUrl(url);
    
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
      setImageUrl("");
    }
  };

  const handleImageModeChange = (mode) => {
    setImageUploadMode(mode);
    setSelectedFile(null);
    setImageError("");
    setImageUrl("");
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!clubType) {
      setError('Please select a club type.');
      return;
    }

    // Validate image URL if provided (only for URL mode)
    if (imageUploadMode === "url" && imageUrl && !isValidImageUrl(imageUrl)) {
      setError("Please enter a valid image URL. Use direct links to images (e.g., https://example.com/image.jpg)");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in as faculty to create a club.');
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('clubType', clubType);
      
      // Add image - either file or URL
      if (imageUploadMode === "file" && selectedFile) {
        formData.append('image', selectedFile);
      } else if (imageUploadMode === "url" && imageUrl) {
        formData.append('imageUrl', imageUrl);
      }

      // Debug: Log the formData contents
      console.log("Creating club with FormData");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await axios.post(
        `${BASE_URL}/api/v1/clubs`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // ✅ Club created
      if (response.status === 201 || response.status === 200) {
        setSuccess('🎉 Club created successfully!');
        setName('');
        setDescription('');
        setClubType('');
        setImageUrl('');
        setSelectedFile(null);
        setImageUploadMode("url");
        setTimeout(() => navigate('/faculty/dashboard'), 1500);
      }
    } catch (err) {
      console.error('Create club error:', err);
      setError(err.response?.data?.message || 'Failed to create club.');
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-center text-indigo-700">➕ Create a New Club</h2>


      <form onSubmit={handleCreateClub} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
            Club Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
           className="w-full px-4 py-2 text-gray-800 placeholder-white/60 border border-purple-400 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
            placeholder="e.g. Coding Club"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 text-gray-800 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Tell something about the club..."
          ></textarea>
        </div>

        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Club Image (Optional)
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
                className="mr-2 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Image URL</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="imageMode"
                value="file"
                checked={imageUploadMode === "file"}
                onChange={() => handleImageModeChange("file")}
                className="mr-2 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Upload File</span>
            </label>
          </div>
          
          {/* URL Input */}
          {imageUploadMode === "url" && (
            <div>
              <input 
                type="url"
                value={imageUrl}
                onChange={handleImageUrlChange}
                className="w-full text-gray-800 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="https://example.com/club-image.jpg"
              />
            </div>
          )}
          
          {/* File Input */}
          {imageUploadMode === "file" && (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                 Tip: Upload images directly from your device (JPEG, PNG, GIF, WebP - max 5MB)
              </p>
              {selectedFile && (
                <p className="text-xs text-green-600 mt-1">
                  ✅ Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}
          
          {imageError && (
            <p className="text-xs text-red-500 mt-1">⚠️ {imageError}</p>
          )}
        </div>

        {/* Image Preview */}
        {((imageUploadMode === "url" && imageUrl) || (imageUploadMode === "file" && selectedFile)) && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Image Preview:</p>
            <img
              src={imageUploadMode === "url" ? imageUrl : URL.createObjectURL(selectedFile)}
              alt="Club preview"
              className="w-full max-w-sm h-32 object-cover rounded-md border border-gray-300"
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

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Club Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            {clubTypes.map((type) => (
              <label key={type.value} className="flex items-center space-x-3 p-2 border border-gray-200 rounded-md hover:bg-gray-50">
                <input
                  type="radio"
                  name="clubType"
                  value={type.value}
                  checked={clubType === type.value}
                  onChange={(e) => setClubType(e.target.value)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{type.label}</span>
                  <span className="text-xs text-gray-500">({type.limit})</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
  <button
    type="submit"
    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-md transition duration-300"
  >
    ✅ Create Club
  </button>
  <button
    type="button"
    onClick={() => navigate("/faculty/dashboard")}
    className="w-full sm:w-auto bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-md transition duration-300"
  >
    ❌ Cancel
  </button>
</div>


        {error && <p className="text-red-600 text-center">{error}</p>}
        {success && <p className="text-green-600 text-center">{success}</p>}
      </form>
      
      
    </div>
  );
};

export default CreateClub;

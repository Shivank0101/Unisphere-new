import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateClub = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleCreateClub = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in as faculty to create a club.');
        return;
      }

      // ✅ Updated API URL with correct port (backend is on 5001)
      const response = await axios.post(
        'http://localhost:5001/api/v1/clubs',
        { name, description },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // ✅ Club created
      if (response.status === 201 || response.status === 200) {
        setSuccess('🎉 Club created successfully!');
        setName('');
        setDescription('');
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Tell something about the club..."
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
        >
          ✅ Create Club
        </button>

        {error && <p className="text-red-600 text-center">{error}</p>}
        {success && <p className="text-green-600 text-center">{success}</p>}
      </form>
    </div>
  );
};

export default CreateClub;

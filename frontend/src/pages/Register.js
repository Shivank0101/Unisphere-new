import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Base URL - Change this to switch between development and production
const BASE_URL = "https://unisphere-backend-o6o2.onrender.com"; // Production
// const BASE_URL = "http://localhost:5001"; // Development

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    interests: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/api/v1/users/register`,
        {
          ...formData,
          interests: formData.interests.split(',').map(item => item.trim())
        },
        { withCredentials: true }
      );

      console.log('Registration successful:', response.data);
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white px-4">
      <form
        onSubmit={handleRegister}
        className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-xl p-8 rounded-2xl w-full max-w-md transition-all duration-300"
      >
        <h2 className="text-3xl font-extrabold text-center mb-6 text-white drop-shadow-lg">Create Account</h2>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        <input
          type="text"
          name="name"
          placeholder="Name"
          className="w-full mb-4 px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full mb-4 px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full mb-4 px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <select
          name="role"
          className="w-full mb-4 px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={formData.role}
          onChange={handleChange}
          required
        >
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
        </select>

        <input
          type="text"
          name="department"
          placeholder="Department"
          className="w-full mb-4 px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={formData.department}
          onChange={handleChange}
        />

        <input
          type="text"
          name="interests"
          placeholder="Interests (comma separated)"
          className="w-full mb-6 px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={formData.interests}
          onChange={handleChange}
        />

        <button
          type="submit"
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 rounded-xl transition duration-200 shadow-lg"
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;

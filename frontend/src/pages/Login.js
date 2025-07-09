import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Base URL - Change this to switch between development and production
const BASE_URL = "https://unisphere-backend-o6o2.onrender.com"; // Production
// const BASE_URL = "http://localhost:5001"; // Development

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  // Determine role
  const isStudent = location.pathname === '/login/student';
  const isFaculty = location.pathname === '/login/faculty';

  const heading = isStudent
    ? 'Student Login'
    : isFaculty
    ? 'Faculty Login'
    : 'Login';

  // Set theme color based on role
  const themeColor = isStudent ? 'blue' : 'green';
  const glowColor = isStudent ? '#3b82f6' : '#22c55e';

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${BASE_URL}/api/v1/users/login`,
        { email, password },
        { withCredentials: true }
      );

      const { accessToken, user } = res.data.data;

      login(user, accessToken);

      if (user.role === 'student') {
        navigate('/student/dashboard');
      } else if (user.role === 'faculty') {
        navigate('/faculty/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError('❌ Invalid credentials or user not found.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-4 py-10">
      <form
        onSubmit={handleLogin}
        className={`w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-[0_0_20px_rgba(0,0,0,0.3)] text-white hover:shadow-[0_0_30px_${glowColor}]`}
      >
        <h2 className={`text-3xl font-bold text-center mb-6 text-${themeColor}-400 drop-shadow-[0_0_6px_${glowColor}]`}>
          {heading}
        </h2>

        {error && (
          <p className="text-red-500 text-center mb-4 font-semibold drop-shadow">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 bg-white/20 text-white placeholder-slate-300 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 bg-white/20 text-white placeholder-slate-300 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className={`w-full py-3 rounded-lg bg-${themeColor}-500 hover:bg-${themeColor}-600 text-white font-semibold transition duration-300 shadow-[0_0_15px_${glowColor}] hover:shadow-[0_0_25px_${glowColor}]`}
        >
          🔐 Login
        </button>
      </form>
    </div>
  );
};

export default Login;

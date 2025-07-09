import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardRoute = () => {
    const role = localStorage.getItem('role');
    return role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard';
  };

  return (
    <nav className="bg-white/5 backdrop-blur-md border-b border-white/10 shadow-md text-white m-0 " >
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-3xl font-orbitron font-extrabold bg-gradient-to-r from-yellow-400 via-orange-300 to-yellow-100 bg-clip-text text-transparent drop-shadow-[0_0_6px_#fbbf24]">
  Unisphere
</span>
        </Link>

        {/* Right Menu */}
        <div className="flex items-center space-x-6">
          <Link
            to="/"
            className="transition duration-300 hover:text-blue-400 hover:drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]"
          >
            Home
          </Link>

          {user ? (
            <>
              <Link
                to={getDashboardRoute()}
                className="flex items-center transition duration-300 hover:text-blue-400 hover:drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]"
              >
                <UserIcon className="w-5 h-5 mr-1" />
                Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="bg-sky-500 text-white px-4 py-1.5 rounded-md transition duration-300 hover:bg-red-600 hover:shadow-[0_0_10px_#0ea5e9]"

              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login-selection"
                className="flex items-center text-white-400 transition-all duration-300 ease-in-out hover:text-purple-400 hover:drop-shadow-glow-purple"
              >
                <UserIcon className="w-5 h-5 mr-1" />
                Login
              </Link>

              <Link
                to="/signup"
                className="text-white-400 transition-all duration-300 ease-in-out hover:text-lime-400 hover:drop-shadow-glow-lime"
              >
                Sign-Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

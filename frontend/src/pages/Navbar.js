import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext'; // ✅ use context

const Navbar = () => {
  const { user, logout } = useAuth(); // ✅ get user and logout
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // calls logout API and clears state
    navigate('/login'); // redirect to login page
  };

  const getDashboardRoute = () => {
    const role = localStorage.getItem('role'); // or you can use user?.role
    return role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard';
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-bold font-satisfy text-yellow-300">UniSphere</span>
        </Link>

        {/* Right Menu */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="hover:text-yellow-300 transition duration-300">
            Home
          </Link>


          {user ? (
            <>
              <Link
                to={getDashboardRoute()}
                className="hover:text-yellow-300 transition duration-300 flex items-center"
              >
                <UserIcon className="w-6 h-6 mr-1" />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="hover:text-yellow-300 transition duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login-selection"
                className="hover:text-yellow-300 transition duration-300 flex items-center"
              >
                <UserIcon className="w-6 h-6 mr-1" />
                Login
              </Link>
              <Link
                to="/signup"
                className="hover:text-yellow-300 transition duration-300"
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

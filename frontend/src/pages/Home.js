import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex flex-col items-center justify-center px-6 py-16 text-center">
      
      <h1 className="text-5xl font-extrabold text-gray-800 mb-6 drop-shadow">
        🎓 Welcome to <span className="text-purple-600">Unisphere</span>
      </h1>

      <p className="text-lg text-gray-700 max-w-2xl mb-10">
        This project is a <span className="font-semibold">campus-focused event management system</span> designed for students and faculty.
        The platform allows users to <span className="font-semibold">post, manage, and register</span> for university events, club activities, and workshops with ease.
      </p>

      <div className="flex gap-6 flex-wrap justify-center">
        <Link to="/login-selection">
          <button className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-6 py-3 rounded-lg shadow-md transition duration-300">
            🚀 Get Started
          </button>
        </Link>

        <a href="#features" className="text-purple-600 hover:underline text-lg">
          📌 Learn More
        </a>
      </div>

      {/* Optional Features Section */}
      <div id="features" className="mt-20 max-w-4xl w-full">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">🔍 Key Features</h2>
        <ul className="text-left text-gray-700 space-y-4 text-lg">
          <li>📅 Browse and register for campus events & workshops</li>
          <li>🧑‍🏫 Faculty can create, edit, and manage events for clubs</li>
          <li>📲 Smart reminders & notifications for upcoming events</li>
          <li>📊 Attendance and registration tracking</li>
          <li>🤖 Personalized event suggestions for students</li>
        </ul>
      </div>
    </div>
  );
};

export default Home;

import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen  bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white flex flex-col items-center justify-center px-6 pt-0 mt-0 text-center">
      
      <h1 className="text-5xl font-extrabold text-white mb-6 drop-shadow-md">
        🎓 Welcome to <span className="text-purple-400 drop-shadow-[0_0_8px_#a855f7]">Unisphere</span>
      </h1>

      <p className="text-lg text-slate-300 max-w-2xl mb-10 leading-relaxed">
        This project is a <span className="font-semibold text-white">campus-focused event management system</span> designed for students and faculty.
        The platform allows users to <span className="font-semibold text-white">post, manage, and register</span> for university events, club activities, and workshops with ease.
      </p>

      <div className="flex gap-6 flex-wrap justify-center">
        <Link to="/login-selection">
          <button className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-6 py-3 rounded-lg transition duration-300 shadow-lg hover:shadow-[0_0_14px_#a855f7]">
            🚀 Get Started
          </button>
        </Link>

        <a
          href="#features"
          className="text-purple-400 hover:text-pink-400 text-lg transition duration-300 hover:drop-shadow-[0_0_8px_#ec4899]"
        >
          📌 Learn More
        </a>
      </div>

      {/* Features Section */}
      <div id="features" className="mt-20 max-w-4xl w-full">
        <h2 className="text-3xl font-bold mb-6 text-white drop-shadow-md">🔍 Key Features</h2>
        <ul className="text-left text-slate-300 space-y-4 text-lg">
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

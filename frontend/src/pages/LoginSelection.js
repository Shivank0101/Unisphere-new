import React from 'react';
import { useNavigate } from 'react-router-dom';

const LoginSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl w-full">

        {/* Student Card */}
        <div className="backdrop-blur-lg bg-white/10 border border-blue-400/30 rounded-3xl p-10 text-center shadow-[0_0_30px_#3b82f6] hover:scale-105 transition duration-300 hover:shadow-[0_0_40px_#3b82f6]">
          <h2 className="text-4xl font-bold text-blue-400 mb-4 drop-shadow-[0_0_8px_#3b82f6] animate-pulse">🧑‍🎓 Student</h2>
          <p className="text-slate-200 text-lg mb-6">
            Login as a student to explore events and register.
          </p>
          <button
            onClick={() => navigate('/login/student')}
            className="bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold py-3 px-6 rounded-lg transition duration-300 shadow-[0_0_15px_#3b82f6] hover:shadow-[0_0_25px_#3b82f6]"
          >
            Login as Student
          </button>
        </div>

        {/* Faculty Card */}
        <div className="backdrop-blur-lg bg-white/10 border border-green-400/30 rounded-3xl p-10 text-center shadow-[0_0_30px_#22c55e] hover:scale-105 transition duration-300 hover:shadow-[0_0_40px_#22c55e]">
          <h2 className="text-4xl font-bold text-green-400 mb-4 drop-shadow-[0_0_8px_#22c55e] animate-pulse">👨‍🏫 Teacher</h2>
          <p className="text-slate-200 text-lg mb-6">
            Login as a teacher to create events, edit them, and manage attendance.
          </p>
          <button
            onClick={() => navigate('/login/faculty')}
            className="bg-green-500 hover:bg-green-600 text-white text-lg font-semibold py-3 px-6 rounded-lg transition duration-300 shadow-[0_0_15px_#22c55e] hover:shadow-[0_0_25px_#22c55e]"
          >
            Login as Faculty
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;

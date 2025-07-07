import React from 'react';
import { useNavigate } from 'react-router-dom';

const LoginSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl w-full">
        {/* Student Card */}
        <div className="bg-white rounded-4xl shadow-4xl p-10 text-center transform transition duration-300 hover:scale-105">
          <h2 className="text-4xl font-bold text-blue-600 mb-4">🧑‍🎓 Student</h2>
          <p className="text-gray-700 text-lg mb-6">
            Login as a student to explore the events and register in events.
          </p>
          <button
            onClick={() => navigate('/login/student')}
            className="bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold py-3 px-6 rounded-lg"
          >
            Login as Student
          </button>
        </div>

        {/* Faculty Card */}
        <div className="bg-white rounded-4xl shadow-4xl p-10 text-center transform transition duration-300 hover:scale-105">
          <h2 className="text-4xl font-bold text-green-600 mb-4">👨‍🏫 Teacher</h2>
          <p className="text-gray-700 text-lg mb-6">
            Login as a teacher to create events, edit events and track student attendance.
          </p>
          <button
            onClick={() => navigate('/login/faculty')}
            className="bg-green-500 hover:bg-green-600 text-white text-lg font-semibold py-3 px-6 rounded-lg"
          >
            Login as Faculty
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;

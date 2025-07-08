import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { ToastContainer } from "react-toastify";

// Pages
import Home from './pages/Home';
import EditEvent from './pages/EditEvents';
import EventDetails from './pages/EventDetails';
import EventAttendanceManagement from './pages/EventAttendanceManagement';
import Navbar from './pages/Navbar';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import Login from './pages/Login';
import LoginSelection from './pages/LoginSelection';
import Register from './pages/Register';
import CreateClub from './pages/CreateClub';
import ClubDetails from './pages/ClubDetails';
import FacultyClubDetails from './pages/FacultyClubDetails';

// Route Guard for Faculty only
const FacultyRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user')); // Assuming you store user in localStorage
  return user?.role === "faculty" ? children : <div className="text-red-500 p-4">Unauthorized Access</div>;
};

function App() {
  return (
    <Router>
      <Navbar />
      
      <div className="container mx-auto p-4">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-selection" element={<LoginSelection />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/login/student" element={<Login />} />
          <Route path="/login/faculty" element={<Login />} />

          {/* Event Routes */}

          <Route path="/edit/:id" element={<EditEvent />} />
          <Route path="/event/:id" element={<EventDetails />} />

          {/* Faculty-only Route for Creating Clubs */}
          <Route path="/faculty/create-club" element={
            <FacultyRoute>
              <CreateClub />
            </FacultyRoute>
          } />

          {/* Faculty-only Route for Event Attendance Management */}
          <Route path="/faculty/event/:eventId/attendance" element={
            <FacultyRoute>
              <EventAttendanceManagement />
            </FacultyRoute>
          } />

          {/* Dashboards */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
          <Route path="/faculty" element={<FacultyDashboard />} />

          <Route path="/studentdashboard/clubdetails/:id" element={<ClubDetails />} />
          <Route path="/faculty/club/:clubId" element={<FacultyClubDetails />} />

          


        </Routes>
      </div>
      {/* ✅ Toast container for global toast support */}
      <ToastContainer position="top-right" autoClose={2500} />

    </Router>
  );
}

export default App;

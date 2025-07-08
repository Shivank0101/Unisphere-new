import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Base URL - Change this to switch between development and production
//const BASE_URL = "https://unisphere-backend-o6o2.onrender.com"; // Production
const BASE_URL = "http://localhost:5001"; // Development

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load user from localStorage on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Login: Save tokens, user in localStorage and context
  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    localStorage.setItem('role', userData.role);
    setUser(userData);
  };

  // Logout: Clear tokens, cookies and context
  const logout = async () => {
    try {
      await axios.post(
        `${BASE_URL}/api/v1/users/logout`,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
    } catch (err) {
      console.warn('Server logout failed:', err.message);
    } finally {
      localStorage.clear();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

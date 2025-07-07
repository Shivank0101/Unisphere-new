import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/auth/signup', { email, password });
      alert('Signup successful! Please login.');
      navigate('/login');
    } catch (err) {
      alert('Signup failed');
    }
  };

  return (
    <form onSubmit={handleSignup} className="p-4 max-w-md mx-auto bg-white shadow-md rounded">
      <h2 className="text-2xl font-bold mb-4">Signup</h2>
      <input className="border p-2 w-full mb-3" placeholder="Email" type="email" onChange={(e) => setEmail(e.target.value)} required />
      <input className="border p-2 w-full mb-3" placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} required />
      <button className="bg-green-500 text-white px-4 py-2 rounded" type="submit">Signup</button>
    </form>
  );
};

export default Signup;

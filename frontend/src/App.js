import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import TraderDashBoard from './components/Orders/TraderDashBoard';
import AdminDashBoard from './components/Orders/AdminDashBoard';
import { jwtDecode } from "jwt-decode";

function App() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [userType, setUserType] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    console.log("storedToken : ", storedToken)

    if (storedToken) {
      setAccessToken(storedToken);
      const payload = jwtDecode(storedToken);
      console.log("payload : ", payload)
      console.log("payload useType : ", payload.userType)
      setUserType(payload.userType)
    }

    console.log("userType : ", userType)
  }, []);

  const handleLogin = (token) => {
    setAccessToken(token);
    localStorage.setItem('accessToken', token); // Store the token in localStorage
    const payload = jwtDecode(token);
    setUserType(payload.userType)
  };

  const handleLogout = (token) => {
    setAccessToken(null);
    localStorage.removeItem('accessToken'); // Store the token in localStorage
  };

  return (
    <Router>
      <Routes>
        <Route path="/trader-dashboard" element={accessToken ? (userType == "TRADER" ? <TraderDashBoard token={accessToken} onLogout={handleLogout} /> : <Navigate to="/admin-dashboard"/>): <Navigate to="/" /> } /> 
        <Route path="/admin-dashboard" element={accessToken ? (userType == "ADMIN" ? <AdminDashBoard token={accessToken} onLogout={handleLogout} /> : <Navigate to="/trader-dashboard"/>): <Navigate to="/" /> } /> 
        <Route path="/" element={accessToken ? <Navigate to="/trader-dashboard" /> : <Login onLogin={handleLogin} />} />
        <Route path="/register" element={accessToken ? <Navigate to="/trader-dashboard" /> : <Register />} />
      </Routes>
    </Router>
  );
}

export default App;

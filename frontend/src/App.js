import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import SearchOwnOrders from './components/Orders/TraderDashBoard';

function App() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    console.log(storedToken)
    if (storedToken) {
      setAccessToken(storedToken);
    }
  }, []);

  const handleLogin = (token) => {
    setAccessToken(token);
    localStorage.setItem('accessToken', token); // Store the token in localStorage
  };

  const handleLogout = (token) => {
    setAccessToken(null);
    localStorage.removeItem('accessToken'); // Store the token in localStorage
  };

  return (
    <Router>
      <Routes>
        <Route path="/trader-dashboard" element={accessToken ? <SearchOwnOrders token={accessToken} onLogout={handleLogout} /> : <Navigate to="/" /> } /> 
        <Route path="/" element={accessToken ? <Navigate to="/trader-dashboard" /> : <Login onLogin={handleLogin} />} />
        <Route path="/register" element={accessToken ? <Navigate to="/trader-dashboard" /> : <Register />} />
      </Routes>
    </Router>
  );
}

export default App;

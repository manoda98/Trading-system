import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Home from './components/Home';
import CreateOrder from './components/Orders/CreateOrder';
import SearchOwnOrders from './components/Orders/SearchOwnOrders';

function App() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setAccessToken(storedToken);
    }
  }, []);

  const handleLogin = (token) => {
    setAccessToken(token);
    localStorage.setItem('accessToken', token); // Store the token in localStorage
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home token={accessToken} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create-order" element={<CreateOrder token={accessToken} />} />
        <Route path="/my-orders" element={<SearchOwnOrders token={accessToken} />} /> {/* My Orders page */}
      </Routes>
    </Router>
  );
}

export default App;

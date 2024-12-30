import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clearToken } from './LocalStorageUtils';

const Logout = ({ setToken }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    setToken('');
    navigate('/login');
  };

  return <button onClick={handleLogout}>Logout</button>;
};

export default Logout;

import React, { useState } from 'react';
import axios from 'axios';
import './styles.css';
const Register = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('http://localhost:5000/api/user/register', { userId, password });
      setMessage('User registered successfully!');
      setError('')
    } catch (err) {
      console.log(err)
      setError(`Error registering user. ${err.response.data.error}`);
      setMessage('')
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>User ID:</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
      {message && <pSuccess>{message}</pSuccess>}
      {error && <pError>{error}</pError>}
    </div>
  );
};

export default Register;

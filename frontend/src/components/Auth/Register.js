import React, { useState } from 'react';
import axios from 'axios';
import './styles.css';
import { Link} from 'react-router-dom';

const Register = () => {
  const [userType, setUserType] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('http://localhost:5000/api/user/register', { userType, userId, password });
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
          <label>User Type:</label>
          <input
            type="text"
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            required
          />
        </div>
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
      <p>
        Already have an account? <Link to="/">Login</Link>
      </p>
    </div>
  );
};

export default Register;

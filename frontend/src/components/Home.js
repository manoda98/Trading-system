import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = ({ token }) => {
  const navigate = useNavigate();

  const handleAction = (action) => {
    switch (action) {
      case 'search-own':
        navigate('/my-orders'); // Navigate to "My Orders" page
        break;
      case 'create':
        navigate('/create-order');
        break;
      case 'cancel':
        console.log('Cancelling order...');
        break;
      case 'modify':
        console.log('Modifying order...');
        break;
      case 'search':
        console.log('Searching order...');
        break;
      default:
        console.log('Unknown action');
    }
  };

  return (
    <div>
      <h1>Welcome, User</h1>
      <div>
        <button onClick={() => handleAction('search-own')}>My Orders</button>
        <button onClick={() => handleAction('create')}>Create Order</button>
        <button onClick={() => handleAction('cancel')}>Cancel Order</button>
        <button onClick={() => handleAction('modify')}>Modify Order</button>
        <button onClick={() => handleAction('search')}>Search Order</button>
      </div>
    </div>
  );
};

export default Home;

import React, { useState } from 'react';
import { searchOtherOrders } from '../../api';

const SearchOtherOrders = ({ token }) => {
  const [form, setForm] = useState({ symbol: '', side: '' });
  const [orders, setOrders] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await searchOtherOrders(form, token);
      setOrders(data.orders);
    } catch (error) {
      alert('Error searching orders.');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input name="symbol" placeholder="Symbol" onChange={handleChange} />
        <select name="side" onChange={handleChange}>
          <option value="">Select Side</option>
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
        <button type="submit">Search</button>
      </form>
      <h3>Other Orders</h3>
      <ul>
        {orders.map((order) => (
          <li key={order._id}>
            {order.symbol} - {order.side} - {order.size} @ {order.price}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchOtherOrders;

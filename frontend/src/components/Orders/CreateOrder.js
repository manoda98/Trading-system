import React, { useState, useEffect } from 'react';
import { createOrder } from '../../api'; // Import your API helper

const CreateOrder = ({ token }) => {
  const [form, setForm] = useState({
    side: '',
    size: '',
    price: '',
    symbol: '',
  });

  const [loading, setLoading] = useState(false);

  // Redirect to login if no token is available
  useEffect(() => {
    if (!token) {
      alert('You must be logged in to create an order.');
      window.location.href = '/login'; // Redirect to login page
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Show loading state

    try {
      if (!token) {
        alert('Authentication token is missing. Please log in.');
        return;
      }

      // Make API call to create the order
      const response = await createOrder(form, token);
      alert('Order created successfully!');
      setForm({
        side: '',
        size: '',
        price: '',
        symbol: '',
      });
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || 'Order creation failed.'));
    } finally {
      setLoading(false); // Hide loading state
    }
  };

  return (
    <div>
      <h2>Create Order</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="symbol"
          placeholder="Symbol"
          value={form.symbol}
          onChange={handleChange}
          required
        />
        <select
          name="side"
          value={form.side}
          onChange={handleChange}
          required
        >
          <option value="">Select Side</option>
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
        <input
          name="price"
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
          required
        />
        <input
          name="size"
          type="number"
          placeholder="Size"
          value={form.size}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Order'}
        </button>
      </form>
    </div>
  );
};

export default CreateOrder;

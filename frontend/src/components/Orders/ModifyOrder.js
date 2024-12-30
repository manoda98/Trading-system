import React, { useState } from 'react';
import { cancelOrder } from '../../api';

const ModifyOrder = ({ token }) => {
  const [orderId, setOrderId] = useState('');

  const handleChange = (e) => {
    setOrderId(e.target.value);
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    try {
      const response = await cancelOrder(orderId, token);
      alert(`Order canceled successfully: ${response.data.message}`);
    } catch (error) {
      alert('Error: ' + error.response?.data?.message || 'Failed to cancel order.');
    }
  };

  return (
    <div>
      <h3>Cancel Order</h3>
      <form onSubmit={handleCancel}>
        <input
          type="text"
          name="orderId"
          placeholder="Order ID"
          value={orderId}
          onChange={handleChange}
        />
        <button type="submit">Cancel Order</button>
      </form>
    </div>
  );
};

export default ModifyOrder;

import React, { useState, useEffect } from 'react';
import { searchOwnOrders, cancelOrder, modifyOrder, createOrder, searchOtherOrders, tradeOrders} from '../../api'; // Import API functions
import './styles.css';

const SearchOwnOrders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newSize, setNewSize] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [submittingNewOrder, setSubmittingNewOrder] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState('');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');

  const [searchSymbol, setSearchSymbol] = useState('');
  const [searchSide, setSearchSide] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const fetchOrders = async () => {
    try {
      const { data } = await searchOwnOrders(token);
      setOrders(data.orders);
    } catch (error) {
      alert('Error fetching your orders.');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleCancel = async (orderId) => {
    try {
      await cancelOrder(orderId, token); // Call cancel order API
      alert('Order canceled successfully!');
      fetchOrders();
    } catch (error) {
      alert('Error canceling the order.');
    }
  };

  const handleNewOrder = () => {
    setSubmittingNewOrder(true);
  };

  const handleNewOrderSubmit = async () => {
    try {
      if (!symbol || !side || !price || !size) {
        alert('All fields are required!');
        return;
      }
      await createOrder(
        {
          symbol,
          side,
          price,
          size,
        },
        token
      );
      setSubmittingNewOrder(false);
      alert('Order submitted successfully!');
      fetchOrders();
    } catch (error) {
      alert('Error submitting the order.');
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setNewSize(order.size);
    setNewPrice(order.price);
  };

  const handleUpdate = async () => {
    try {
      if (!newSize || !newPrice) {
        alert('Both size and price are required!');
        return;
      }
      await modifyOrder(editingOrder._id, { size: newSize, price: newPrice }, token);
      setEditingOrder(null);
      alert('Order updated successfully!');
      fetchOrders();
    } catch (error) {
      alert('Error updating the order.');
    }
  };

  // Handle search for other orders
  const searchOtherOrdersHandler = async () => {
    try {
      if (!searchSymbol || !searchSide) {
        alert('Please enter both Symbol and Side to search.');
        return;
      }

      const { data } = await searchOtherOrders({ symbol: searchSymbol, side: searchSide }, token);
      setSearchResults(data.orders); // Update state with search results
    } catch (error) {
      console.log(error);
      alert('Error fetching search results.');
    }
  };

  const handleTrading = async (orderId)=> {
    try {
      await tradeOrders(orderId, token); // Call cancel order API
      alert('Order traded successfully!');
    } catch (error) {
      console.log(error);
      alert('Error executing trade.');
    }
  };

  return (
    <div className="split-container">
      {/* Search Other Orders Section */}
      <div className="left-section">
        <div className="order-container">
          <div className="header-row">
            <h3>Market Orders</h3>
            <div className="input-group">
              <label>Enter Symbol: </label>
              <input
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Enter Side: </label>
              <input
                value={searchSide}
                onChange={(e) => setSearchSide(e.target.value)}
              />
            </div>
            <button className="new-order-btn" onClick={searchOtherOrdersHandler}>
              Search
            </button>
          </div>




          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results">
              <h4>Market Orders</h4>
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Size</th>
                    <th>Price</th>
                    <th>State</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((order) => (
                    <tr key={order._id}>
                      <td>{order.symbol}</td>
                      <td>{order.side}</td>
                      <td>{order.size}</td>
                      <td>{order.price}</td>
                      <td>{order.state}</td>
                      <button
                        className="trade-btn"
                        onClick={() => handleTrading(order._id)}
                      >
                        Trade
                      </button>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Left section: Your Orders */}
      <div className="right-section">
        <div className="order-container">
          <div className="header-row">
            <h3>Your Orders</h3>
            <button className="new-order-btn" onClick={() => handleNewOrder()}>
              New Order
            </button>
          </div>
          {orders.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Size</th>
                  <th>Price</th>
                  <th>State</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.symbol}</td>
                    <td>{order.side}</td>
                    <td>{order.size}</td>
                    <td>{order.price}</td>
                    <td>{order.state}</td>
                    <td>
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancel(order._id)}
                      >
                        Cancel
                      </button>
                      <button className="edit-btn" onClick={() => handleEdit(order)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Edit Order Form */}
          {editingOrder && (
            <div className="edit-order-form">
              <h4>Edit Order</h4>
              <div className="input-group">
                <label>New Size: </label>
                <input
                  type="number"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>New Price: </label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
              </div>
              <button className="update-btn" onClick={handleUpdate}>
                Update Order
              </button>
              <button
                className="cancel-edit-btn"
                onClick={() => setEditingOrder(null)}
              >
                Cancel Edit
              </button>
            </div>
          )}

          {/* New Order Form */}
          {submittingNewOrder && (
            <div className="new-order-form">
              <h4>New Order</h4>
              <div className="input-group">
                <label>Symbol: </label>
                <input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Side: </label>
                <input
                  value={side}
                  onChange={(e) => setSide(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Size: </label>
                <input
                  type="number"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Price: </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <button className="update-btn" onClick={handleNewOrderSubmit}>
                Submit Order
              </button>
              <button
                className="cancel-edit-btn"
                onClick={() => setSubmittingNewOrder(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOwnOrders;

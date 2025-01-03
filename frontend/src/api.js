import axios from 'axios';

// Create an Axios instance with base URL for backend API
const API = axios.create({
  baseURL: 'http://localhost:5000', // Replace with your backend URL
});

// Authentication APIs
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);

// Order APIs
export const createOrder = (data, token) =>
  API.post('/api/order/submit', data, { headers: { Authorization: `Bearer ${token}` } });

export const cancelOrder = (id, token) =>
  API.put(`/api/order/cancel/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });

export const modifyOrder = (id, data, token) =>
  API.put(`/api/order/update/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });

export const searchOwnOrders = (token) =>
  API.get('/api/order/search/own', { headers: { Authorization: `Bearer ${token}` } });

export const searchOtherOrders = (params, token) =>
  API.get('/api/order/search', { headers: { Authorization: `Bearer ${token}` }, params });

export const tradeOrders = (id, token) =>
  API.put(`/api/order/trade/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });

export const logout = (token) =>
  API.post('/api/user/logout', {} , { headers: { Authorization: `Bearer ${token}` } });


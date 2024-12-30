import React from 'react';
import ReactDOM from 'react-dom/client';  // Notice the change here
import App from './App';

// Use createRoot instead of render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

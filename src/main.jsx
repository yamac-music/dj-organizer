// src/main.jsx (または src/index.jsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Bootstrap の CSS をインポート
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

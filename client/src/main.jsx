import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#25252D',
              color: '#F4F1EA',
              border: '1px solid rgba(244,241,234,0.1)',
            },
            success: { iconTheme: { primary: '#C7FF3D', secondary: '#0B0B0F' } },
            error: { iconTheme: { primary: '#FF5C5C', secondary: '#0B0B0F' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { WidgetProvider } from './context/WidgetContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WidgetProvider>
          <App />
        </WidgetProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

/* frontend/src/main.jsx */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import './i18n';
import App from './App.jsx';
import ToastProvider from './contexts/ToastProvider.jsx';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error("Falta la variable VITE_GOOGLE_CLIENT_ID en el archivo .env del frontend");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <HelmetProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </HelmetProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
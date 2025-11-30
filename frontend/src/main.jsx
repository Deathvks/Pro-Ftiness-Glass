/* frontend/src/main.jsx */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ToastProvider from './contexts/ToastProvider.jsx';
import { HelmetProvider } from 'react-helmet-async';
import './i18n';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Obtenemos el ID desde las variables de entorno de Vite
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
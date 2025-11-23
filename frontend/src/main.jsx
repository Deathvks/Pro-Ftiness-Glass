/* frontend/src/main.jsx */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ToastProvider from './contexts/ToastProvider.jsx';
import { HelmetProvider } from 'react-helmet-async';
import './i18n'; 
// --- INICIO DE LA MODIFICACIÓN ---
import { GoogleOAuthProvider } from '@react-oauth/google';
// --- FIN DE LA MODIFICACIÓN ---

// --- INICIO DE LA MODIFICACIÓN ---
// Obtenemos el ID desde las variables de entorno de Vite
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error("Falta la variable VITE_GOOGLE_CLIENT_ID en el archivo .env del frontend");
}
// --- FIN DE LA MODIFICACIÓN ---

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* --- INICIO DE LA MODIFICACIÓN --- */}
    <GoogleOAuthProvider clientId={googleClientId}>
      <HelmetProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </HelmetProvider>
    </GoogleOAuthProvider>
    {/* --- FIN DE LA MODIFICACIÓN --- */}
  </StrictMode>,
);
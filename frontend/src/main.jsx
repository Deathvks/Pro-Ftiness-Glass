/* frontend/src/main.jsx */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import './i18n';
import App from './App.jsx';
import ToastProvider from './contexts/ToastProvider.jsx';
// --- INICIO DE LA MODIFICACIÓN ---
import ErrorBoundary from './components/ErrorBoundary';
// --- FIN DE LA MODIFICACIÓN ---

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error("Falta la variable VITE_GOOGLE_CLIENT_ID en el archivo .env del frontend");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* --- INICIO DE LA MODIFICACIÓN: Envolvemos todo con ErrorBoundary --- */}
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={googleClientId}>
        <HelmetProvider>
          {/* Envolvemos la aplicación con BrowserRouter para habilitar useLocation y la navegación */}
          <BrowserRouter>
            <ToastProvider>
              <App />
            </ToastProvider>
          </BrowserRouter>
        </HelmetProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
    {/* --- FIN DE LA MODIFICACIÓN --- */}
  </StrictMode>,
);
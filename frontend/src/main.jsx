import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ToastProvider from './contexts/ToastProvider.jsx';
// --- INICIO DE LA MODIFICACIÓN ---
import { HelmetProvider } from 'react-helmet-async'; // Importamos HelmetProvider
// --- FIN DE LA MODIFICACIÓN ---

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* --- INICIO DE LA MODIFICACIÓN --- */}
    {/* Envolvemos la app con HelmetProvider */}
    <HelmetProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </HelmetProvider>
    {/* --- FIN DE LA MODIFICACIÓN --- */}
  </StrictMode>,
);
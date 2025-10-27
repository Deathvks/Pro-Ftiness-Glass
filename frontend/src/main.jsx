/* frontend/src/main.jsx */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ToastProvider from './contexts/ToastProvider.jsx';
import { HelmetProvider } from 'react-helmet-async';
import './i18n'; // <-- Añadido: Importa la configuración de i18next

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </HelmetProvider>
  </StrictMode>,
);
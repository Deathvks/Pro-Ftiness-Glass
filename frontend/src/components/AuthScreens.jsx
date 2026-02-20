/* frontend/src/components/AuthScreens.jsx */
import React, { Suspense, lazy, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Spinner from './Spinner';

// Lazy loading para optimizar carga inicial
const LoginScreen = lazy(() => import('../pages/LoginScreen'));
const RegisterScreen = lazy(() => import('../pages/RegisterScreen'));
const ForgotPasswordScreen = lazy(() => import('../pages/ForgotPasswordScreen'));
// ResetPasswordScreen se maneja independientemente en App.jsx por ruta directa,
// pero lo mantenemos aquí como fallback de seguridad.
const ResetPasswordScreen = lazy(() => import('../pages/ResetPasswordScreen'));

/**
 * Componente que gestiona qué pantalla de autenticación mostrar.
 * Ahora actúa principalmente como un renderizador condicional basado en la prop 'authView'.
 */
const AuthScreens = ({ authView, setAuthView }) => {

  useEffect(() => {
    // Depuración: Verifica qué vista está solicitando el router
    console.debug("AuthScreens renderizando vista:", authView);
  }, [authView]);

  // Funciones de navegación que invocan la actualización de ruta en App.jsx
  const showLogin = () => setAuthView('login');
  const showRegister = () => setAuthView('register');
  const showForgotPassword = () => setAuthView('forgotPassword');

  // Función auxiliar para renderizar el componente correcto
  const renderContent = () => {
    switch (authView) {
      case 'register':
        return <RegisterScreen showLogin={showLogin} />;

      case 'forgotPassword':
        return <ForgotPasswordScreen showLogin={showLogin} />;

      case 'resetPassword':
        return <ResetPasswordScreen showLogin={showLogin} />;

      case 'login':
      default:
        return (
          <LoginScreen
            showRegister={showRegister}
            showForgotPassword={showForgotPassword}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary animate-fade-in">
      <div className="flex-grow flex flex-col">
        <Suspense
          fallback={
            <div className="flex h-screen w-full items-center justify-center bg-bg-primary">
              <Spinner size={40} />
            </div>
          }
        >
          {renderContent()}
        </Suspense>
      </div>

      {/* Links Legales - Usamos Link para evitar recarga completa */}
      <footer className="py-6 text-center bg-bg-primary z-10">
        <div className="flex justify-center space-x-6">
          <Link 
            to="/privacy" 
            className="text-xs text-text-secondary hover:text-accent transition-colors"
          >
            Política de Privacidad
          </Link>
          <Link 
            to="/terms" 
            className="text-xs text-text-secondary hover:text-accent transition-colors"
          >
            Términos del Servicio
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default AuthScreens;
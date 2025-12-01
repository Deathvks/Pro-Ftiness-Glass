/* frontend/src/components/AuthScreens.jsx */
import React, { Suspense, lazy } from 'react';
import Spinner from './Spinner';

// --- INICIO DE LA MODIFICACIÓN: Lazy Loading ---
// En lugar de importar todo al principio, importamos bajo demanda.
// Esto evita que el usuario descargue código de pantallas que no está viendo.
const LoginScreen = lazy(() => import('../pages/LoginScreen'));
const RegisterScreen = lazy(() => import('../pages/RegisterScreen'));
const ForgotPasswordScreen = lazy(() => import('../pages/ForgotPasswordScreen'));
const ResetPasswordScreen = lazy(() => import('../pages/ResetPasswordScreen'));
// --- FIN DE LA MODIFICACIÓN ---

/**
 * Componente que gestiona qué pantalla de autenticación mostrar.
 * Utiliza Lazy Loading para mejorar el rendimiento inicial.
 */
const AuthScreens = ({ authView, setAuthView }) => {

  const showLogin = () => setAuthView('login');
  const showRegister = () => setAuthView('register');
  const showForgotPassword = () => setAuthView('forgotPassword');

  const showLoginFromReset = () => {
    window.history.pushState({}, '', '/');
    setAuthView('login');
  };

  // Función auxiliar para renderizar el componente correcto
  const renderContent = () => {
    switch (authView) {
      case 'register':
        return <RegisterScreen showLogin={showLogin} />;

      case 'forgotPassword':
        return <ForgotPasswordScreen showLogin={showLogin} />;

      case 'resetPassword':
        return <ResetPasswordScreen showLogin={showLoginFromReset} />;

      default:
        return (
          <LoginScreen
            showRegister={showRegister}
            showForgotPassword={showForgotPassword}
          />
        );
    }
  };

  // Envolvemos todo en Suspense para manejar la carga asíncrona
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-bg-primary">
          <Spinner size={40} />
        </div>
      }
    >
      {renderContent()}
    </Suspense>
  );
};

export default AuthScreens;
/* frontend/src/components/AuthScreens.jsx */
import React from 'react';
import LoginScreen from '../pages/LoginScreen';
import RegisterScreen from '../pages/RegisterScreen';
import ForgotPasswordScreen from '../pages/ForgotPasswordScreen';
import ResetPasswordScreen from '../pages/ResetPasswordScreen';

/**
 * Componente que gestiona qué pantalla de autenticación mostrar
 * (Login, Registro, Olvidé Contraseña, Resetear Contraseña).
 * Es utilizado como "guard" en App.jsx cuando el usuario NO está autenticado.
 *
 * @param {object} props
 * @param {string} props.authView - El estado que define qué vista mostrar ('login', 'register', etc.)
 * @param {function} props.setAuthView - El setter para cambiar el estado 'authView'.
 */
const AuthScreens = ({ authView, setAuthView }) => {
  
  // Callbacks para navegar entre pantallas de autenticación
  const showLogin = () => setAuthView('login');
  const showRegister = () => setAuthView('register');
  const showForgotPassword = () => setAuthView('forgotPassword');
  
  // Callback específico para ResetPassword, que también limpia la URL
  const showLoginFromReset = () => {
    window.history.pushState({}, '', '/'); // Limpia el token de la URL
    setAuthView('login');
  };

  switch (authView) {
    case 'register':
      return <RegisterScreen showLogin={showLogin} />;
    
    case 'forgotPassword':
      return <ForgotPasswordScreen showLogin={showLogin} />;
    
    case 'resetPassword':
      return <ResetPasswordScreen showLogin={showLoginFromReset} />;
    
    // 'login' es el caso por defecto
    default:
      return (
        <LoginScreen
          showRegister={showRegister}
          showForgotPassword={showForgotPassword}
        />
      );
  }
};

export default AuthScreens;
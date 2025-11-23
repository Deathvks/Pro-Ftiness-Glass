/* backend/services/emailService.js */
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Configurar transporter - Usar createTransport (sin 'er' al final)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // tu-email@gmail.com
    pass: process.env.EMAIL_PASS  // contraseña de aplicación
  }
});

// Generar código de verificación
export const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Enviar código de verificación
export const sendVerificationEmail = async (email, code) => {
  const resetUrl = `${process.env.FRONTEND_URL}/forgot-password`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Código de verificación - Pro Fitness Glass',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">¡Bienvenido a Pro Fitness Glass!</h2>
        <p>Tu código de verificación es:</p>
        <div style="background: #F3F4F6; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #1F2937; font-size: 32px; margin: 0;">${code}</h1>
        </div>
        <p>Este código expira en 10 minutos.</p>
        <p>Si no solicitaste este código, puedes ignorar este email.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="font-size: 14px; color: #555;">
          <strong>¿No has sido tú?</strong><br>
          Si no has intentado iniciar sesión, es posible que alguien esté usando tu correo. 
          <a href="${resetUrl}" style="color: #4F46E5; text-decoration: none; font-weight: bold;">
            Haz clic aquí para restablecer tu contraseña
          </a>.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Código enviado correctamente' };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { success: false, message: 'Error enviando código' };
  }
};

// Enviar email para resetear contraseña
export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Restablecimiento de Contraseña - Pro Fitness Glass',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Restablecimiento de Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a 
            href="${resetUrl}" 
            style="background-color: #4F46E5; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;"
          >
            Restablecer Contraseña
          </a>
        </div>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste esto, puedes ignorar este email de forma segura.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email de restablecimiento enviado.' };
  } catch (error) {
    console.error('Error enviando email de reseteo:', error);
    return { success: false, message: 'Error al enviar el email.' };
  }
};

// --- NUEVA FUNCIÓN: Alerta de inicio de sesión ---
export const sendLoginAlertEmail = async (email, { ip, userAgent, token }) => {
  // Usamos el token generado para ir directo al reset
  const changePasswordUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Alerta de seguridad: Nuevo inicio de sesión - Pro Fitness Glass',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Nuevo inicio de sesión detectado</h2>
        <p>Se ha iniciado sesión correctamente en tu cuenta con Autenticación en Dos Pasos.</p>
        
        <div style="background: #F9FAFB; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Dispositivo/Navegador:</strong> ${userAgent}</p>
          <p style="margin: 5px 0;"><strong>Dirección IP:</strong> ${ip}</p>
          <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <p>Si has sido tú, puedes ignorar este mensaje.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #DC2626; font-weight: bold;">¿No has sido tú?</p>
        <p>Alguien podría tener acceso a tu contraseña y a tus códigos de verificación.</p>
        <p>
          <a href="${changePasswordUrl}" style="background-color: #DC2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Cambiar contraseña ahora
          </a>
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Alerta de login enviada.' };
  } catch (error) {
    console.error('Error enviando alerta de login:', error);
    // No retornamos false para no bloquear el login si el email falla, solo logueamos
    return { success: false, message: 'Error al enviar alerta.' };
  }
};
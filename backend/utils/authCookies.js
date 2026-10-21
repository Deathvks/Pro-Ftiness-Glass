/* backend/utils/authCookies.js */

export const getAuthCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.MYSQL_HOST;
  return {
    httpOnly: true,
    secure: isProduction, // Obligatorio en HTTPS (Zeabur / producción)
    sameSite: isProduction ? 'none' : 'lax', // 'none' permite enviar la cookie entre frontend y backend en Zeabur
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    path: '/'
  };
};

export const setAuthCookie = (res, token) => {
  if (!res || !token) return;
  res.cookie('token', token, getAuthCookieOptions());
};

export const clearAuthCookie = (res) => {
  if (!res) return;
  const options = getAuthCookieOptions();
  delete options.maxAge;
  res.clearCookie('token', options);
};

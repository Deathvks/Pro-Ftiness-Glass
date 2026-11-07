export const smtpHost = process.env.EMAIL_HOST?.trim();
export const smtpPort = Number(process.env.EMAIL_PORT?.trim() || 587);
export const publicApiOrigin = new URL(process.env.PUBLIC_API_URL || 'https://api.profitnessglass.es').origin;

export const domainMailboxes = {
  notifications: 'notificaciones@profitnessglass.es',
  support: 'soporte@profitnessglass.es',
  privacy: 'privacidad@profitnessglass.es'
};

export const isDomainSmtpConfigured = smtpHost?.toLowerCase() === 'smtp.dondominio.com'
  && process.env.EMAIL_USER?.trim().toLowerCase() === domainMailboxes.notifications
  && Boolean(process.env.EMAIL_PASS?.trim())
  && Number.isInteger(smtpPort) && smtpPort >= 1 && smtpPort <= 65535;

export const supportContact = domainMailboxes.support;
export const privacyContact = domainMailboxes.privacy;

export const smtpHost = process.env.EMAIL_HOST?.trim();

export const domainMailboxes = {
  notifications: 'notificaciones@profitnessglass.es',
  support: 'soporte@profitnessglass.es',
  privacy: 'privacidad@profitnessglass.es'
};

export const usesDomainMailbox = smtpHost?.toLowerCase() === 'smtp.dondominio.com'
  && process.env.EMAIL_USER?.trim().toLowerCase() === domainMailboxes.notifications;
const currentContact = 'profitnessglass@gmail.com';

export const supportReplyTo = usesDomainMailbox ? domainMailboxes.support : undefined;
export const supportContact = supportReplyTo ?? currentContact;
export const privacyContact = usesDomainMailbox ? domainMailboxes.privacy : currentContact;

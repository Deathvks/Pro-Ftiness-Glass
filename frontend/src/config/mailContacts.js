const usesDonDominio = import.meta.env.VITE_MAIL_PROVIDER === 'dondominio';
const currentContact = 'profitnessglass@gmail.com';

export const supportEmail = usesDonDominio ? 'soporte@profitnessglass.es' : currentContact;
export const privacyEmail = usesDonDominio ? 'privacidad@profitnessglass.es' : currentContact;
export const mailProvider = usesDonDominio ? 'DonDominio (Soluciones Corporativas IP, S.L.)' : 'Google (Gmail)';

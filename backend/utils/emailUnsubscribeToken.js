import crypto from 'crypto';

const getSecret = () => {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('EMAIL_UNSUBSCRIBE_SECRET o JWT_SECRET debe estar configurado');
  return secret;
};

export const createEmailUnsubscribeToken = ({ userId, email }) => {
  const payload = Buffer.from(JSON.stringify({ purpose: 'optional-email-unsubscribe', userId, email }))
    .toString('base64url');
  const signature = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

export const verifyEmailUnsubscribeToken = (token) => {
  if (typeof token !== 'string') return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) return null;

  try {
    const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest();
    const provided = Buffer.from(signature, 'base64url');
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded?.purpose !== 'optional-email-unsubscribe') return null;
    if (!Number.isInteger(Number(decoded.userId)) || typeof decoded.email !== 'string') return null;
    return { userId: Number(decoded.userId), email: decoded.email };
  } catch {
    return null;
  }
};

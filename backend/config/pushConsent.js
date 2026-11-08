export const PUSH_CONSENT_VERSION = '2026-11-06';
export const PUSH_PURPOSES = ['training', 'coaching', 'news'];

export const hasPushConsent = (consents, purpose) => {
  const consent = consents?.[purpose];
  return Boolean(consent?.grantedAt && consent.version === PUSH_CONSENT_VERSION && !consent.withdrawnAt);
};

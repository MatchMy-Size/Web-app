const DEFAULT_PHONE_AUTH_DOMAIN = 'phone.whatmysize.app';
const PHONE_E164_REGEX = /^\+[1-9]\d{7,14}$/;

export const normalizePhoneForAuth = (phoneNumber: string) => phoneNumber.trim().replace(/\s+/g, '');

export const isValidE164Phone = (phoneNumber: string) => {
  const normalized = normalizePhoneForAuth(phoneNumber);
  return PHONE_E164_REGEX.test(normalized);
};

export const getPhonePasswordEmail = (phoneNumber: string) => {
  const normalized = normalizePhoneForAuth(phoneNumber);

  if (!PHONE_E164_REGEX.test(normalized)) {
    throw new Error('Phone number must be in E.164 format, e.g. +9477xxxxxxx.');
  }

  const digits = normalized.slice(1);
  const domain = import.meta.env.VITE_PHONE_PASSWORD_DOMAIN?.trim() || DEFAULT_PHONE_AUTH_DOMAIN;

  return `phone${digits}@${domain}`;
};

const PHONE_E164_REGEX = /^\+[1-9]\d{7,14}$/;
export const DEFAULT_PHONE_COUNTRY_CODE = '+94';
export const SRI_LANKA_LOCAL_PHONE_LENGTH = 9;

export const getSriLankaLocalPhoneInput = (phoneNumber: string) => {
  const digits = phoneNumber.replace(/\D/g, '');

  if (!digits) return '';
  if (digits.startsWith('94')) return digits.slice(2, 2 + SRI_LANKA_LOCAL_PHONE_LENGTH);
  if (digits.startsWith('0')) return digits.slice(1, 1 + SRI_LANKA_LOCAL_PHONE_LENGTH);
  return digits.slice(0, SRI_LANKA_LOCAL_PHONE_LENGTH);
};

export const normalizePhoneForAuth = (phoneNumber: string) => {
  const compact = phoneNumber.trim().replace(/[^\d+]/g, '');
  if (!compact) return '';

  if (compact.startsWith('+')) {
    const digits = compact.slice(1).replace(/\D/g, '');
    return digits ? `+${digits}` : '';
  }

  const localNumber = getSriLankaLocalPhoneInput(compact);
  return localNumber ? `${DEFAULT_PHONE_COUNTRY_CODE}${localNumber}` : '';
};

export const isValidE164Phone = (phoneNumber: string) => {
  const normalized = normalizePhoneForAuth(phoneNumber);
  return PHONE_E164_REGEX.test(normalized);
};

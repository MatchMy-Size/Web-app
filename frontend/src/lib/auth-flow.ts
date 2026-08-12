import type { ClothingChoice, CustomerGender, MeasurementFieldKey } from '@/lib/measurement';

export type OtpPurpose = 'signup' | 'changePassword' | 'passwordReset';
export type OtpSession = {
  sessionId: string;
  purpose: OtpPurpose;
  phoneNumber: string;
  expiresAt: number;
  resendCount?: number;
};

export type PendingRegistration = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  gender: CustomerGender;
  preferredClothing: ClothingChoice;
  preferredClothingLabel: string;
  measurementProfileKey: string;
  unit: 'cm' | 'in';
  measurements: Partial<Record<MeasurementFieldKey, string>>;
  primaryMeasurementKeys: MeasurementFieldKey[];
  measurementDisplayNames: Partial<Record<MeasurementFieldKey, string>>;
};

const OTP_KEY = 'matchmysize.otpSession';
const REG_KEY = 'matchmysize.pendingRegistration';

const read = <T,>(key: string): T | null => {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const write = (key: string, value: unknown | null) => {
  try {
    if (value === null) {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Ignore storage errors.
  }
};

export const getOtpSession = () => read<OtpSession>(OTP_KEY);
export const setOtpSession = (session: OtpSession | null) => write(OTP_KEY, session);
export const clearOtpSession = () => write(OTP_KEY, null);
export const getPendingRegistration = () => read<PendingRegistration>(REG_KEY);
export const setPendingRegistration = (registration: PendingRegistration | null) => write(REG_KEY, registration);
export const clearPendingRegistration = () => write(REG_KEY, null);

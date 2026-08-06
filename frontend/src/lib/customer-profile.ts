import { apiRequest } from '@/lib/api-client';
import type {
  ClothingChoice,
  CustomerGender,
  MeasurementFieldKey,
} from '@/lib/measurement';

type CustomerProfileInput = {
  uid: string;
  phoneNumber?: string | null;
  email?: string | null;
  firstName: string;
  lastName: string;
  gender: CustomerGender | null;
  preferredClothing?: ClothingChoice | null;
  preferredClothingLabel?: string | null;
  measurementProfileKey?: string | null;
  unit: 'cm' | 'in';
  measurements: Record<string, unknown>;
  primaryMeasurementKeys?: MeasurementFieldKey[];
  measurementDisplayNames?: Record<string, string>;
  photoURL?: string | null;
};

type CustomerMeasurementProfileInput = {
  uid: string;
  gender: CustomerGender | null;
  preferredClothing: ClothingChoice;
  preferredClothingLabel?: string | null;
  measurementProfileKey?: string | null;
  unit: 'cm' | 'in';
  measurements: Record<string, unknown>;
  primaryMeasurementKeys?: MeasurementFieldKey[];
  measurementDisplayNames?: Record<string, string>;
  setAsActive?: boolean;
};

const PROFILE_CHANGED_EVENT = 'matchmysize:profile-changed';

export const notifyProfileChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
  }
};

export const saveCustomerProfile = async ({ uid: _uid, ...profile }: CustomerProfileInput) => {
  await apiRequest('/api/profile/me', {
    method: 'PUT',
    body: profile,
  });
  notifyProfileChanged();
};

export const updateCustomerProfile = async (profile: Record<string, unknown>) => {
  await apiRequest('/api/profile/me', {
    method: 'PATCH',
    body: profile,
  });
  notifyProfileChanged();
};

export const saveCustomerMeasurementProfile = async ({
  uid: _uid,
  ...profile
}: CustomerMeasurementProfileInput) => {
  await apiRequest('/api/profile/me/measurement-profiles', {
    method: 'POST',
    body: profile,
  });
  notifyProfileChanged();
};

export const setCustomerActiveMeasurementProfile = async (
  profileKey: string,
  preferredClothing: string | null,
  preferredClothingLabel: string,
) => {
  await apiRequest(`/api/profile/me/measurement-profiles/${encodeURIComponent(profileKey)}/active`, {
    method: 'PUT',
    body: { preferredClothing, preferredClothingLabel },
  });
  notifyProfileChanged();
};

export const getCustomerProfile = async (_uid?: string) =>
  apiRequest<Record<string, unknown> | null>('/api/profile/me');

export const subscribeCustomerProfile = (
  _uid: string,
  onData: (data: Record<string, unknown> | null) => void,
  onError?: (error: Error) => void,
) => {
  let active = true;

  const refresh = async () => {
    try {
      const data = await getCustomerProfile();
      if (active) onData(data);
    } catch (error) {
      if (active) onError?.(error instanceof Error ? error : new Error('Unable to load profile.'));
    }
  };

  const handleChange = () => void refresh();
  void refresh();

  if (typeof window !== 'undefined') {
    window.addEventListener(PROFILE_CHANGED_EVENT, handleChange);
  }
  const pollId = typeof window !== 'undefined' ? window.setInterval(refresh, 30_000) : null;

  return () => {
    active = false;
    if (typeof window !== 'undefined') {
      window.removeEventListener(PROFILE_CHANGED_EVENT, handleChange);
      if (pollId !== null) window.clearInterval(pollId);
    }
  };
};

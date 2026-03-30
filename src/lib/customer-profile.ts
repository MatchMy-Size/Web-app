import { doc, serverTimestamp, setDoc } from '@/lib/firebase-db';
import { db, getDocById, subscribeDocById } from '@/lib/firebase-db';
import { normalizePhoneForAuth } from '@/lib/phone-auth';

import type {
  ClothingChoice,
  CustomerGender,
  MeasurementFieldKey,
} from '@/lib/measurement';

type FirestoreRecord = Record<string, unknown>;

type MeasurementNumbers = Record<string, number>;

type MeasurementDisplayNames = Record<string, string>;

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

const toNumberMap = (measurements: Record<string, unknown>): MeasurementNumbers => {
  const entries = Object.entries(measurements)
    .map(([key, value]) => [key, Number.parseFloat(String(value))] as const)
    .filter(([, value]) => Number.isFinite(value) && value > 0);

  return Object.fromEntries(entries);
};

const computeAveragePoint = (measurements: MeasurementNumbers) => {
  const values = Object.values(measurements);
  if (!values.length) return null;

  const sum = values.reduce((total, value) => total + value, 0);
  return Number((sum / values.length).toFixed(2));
};

const sanitizeDisplayNames = (names?: Record<string, string>) => {
  if (!names) return {};

  const entries = Object.entries(names)
    .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : ''] as const)
    .filter(([, value]) => !!value);

  return Object.fromEntries(entries) as MeasurementDisplayNames;
};

const sanitizeStringArray = (values: unknown) => {
  if (!Array.isArray(values)) return [] as string[];

  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
};

const getActiveProfile = (
  measurement: FirestoreRecord | null,
  activeProfileKey: string | null
): FirestoreRecord | null => {
  if (!measurement || !activeProfileKey) return null;

  const profiles = measurement.profiles;
  if (!profiles || typeof profiles !== 'object') return null;

  const profile = (profiles as FirestoreRecord)[activeProfileKey];
  if (!profile || typeof profile !== 'object') return null;

  return profile as FirestoreRecord;
};

const mergeProfileAndMeasurements = (
  profile: FirestoreRecord | null,
  measurement: FirestoreRecord | null
) => {
  if (!profile && !measurement) return null;

  const activeProfileKey =
    (measurement?.activeProfileKey as string | undefined) ??
    (profile?.activeMeasurementProfileKey as string | undefined) ??
    null;

  const activeProfile = getActiveProfile(measurement, activeProfileKey);

  const preferredClothing =
    (profile?.preferredClothing as string | undefined) ??
    (measurement?.preferredClothing as string | undefined) ??
    (activeProfile?.preferredClothing as string | undefined) ??
    null;

  const measurements =
    (activeProfile?.measurements as Record<string, number> | undefined) ??
    (measurement?.measurements as Record<string, number> | undefined) ??
    (profile?.measurements as Record<string, number> | undefined) ??
    {};

  const unit =
    (activeProfile?.unit as 'cm' | 'in' | undefined) ??
    (measurement?.unit as 'cm' | 'in' | undefined) ??
    (profile?.unit as 'cm' | 'in' | undefined);

  const averagePoint =
    (activeProfile?.averagePoint as number | null | undefined) ??
    (measurement?.averagePoint as number | null | undefined) ??
    (profile?.averagePoint as number | null | undefined) ??
    null;

  const activePrimaryKeys = sanitizeStringArray(activeProfile?.primaryMeasurementKeys);
  const primaryMeasurementKeys = activePrimaryKeys.length
    ? activePrimaryKeys
    : sanitizeStringArray(measurement?.primaryMeasurementKeys);

  const activeMeasurementKeys = sanitizeStringArray(activeProfile?.measurementKeys);
  const fallbackMeasurementKeys = sanitizeStringArray(measurement?.measurementKeys);
  const measurementKeys = activeMeasurementKeys.length
    ? activeMeasurementKeys
    : fallbackMeasurementKeys.length
      ? fallbackMeasurementKeys
      : Object.keys(measurements);

  const measurementDisplayNames =
    (activeProfile?.measurementDisplayNames as Record<string, string> | undefined) ??
    (measurement?.measurementDisplayNames as Record<string, string> | undefined) ??
    {};

  return {
    ...(profile ?? {}),
    measurements,
    unit,
    averagePoint,
    preferredClothing,
    preferredClothingLabel:
      (measurement?.preferredClothingLabel as string | undefined) ??
      (profile?.preferredClothingLabel as string | undefined) ??
      (activeProfile?.preferredClothingLabel as string | undefined) ??
      null,
    activeMeasurementProfileKey: activeProfileKey,
    primaryMeasurementKeys,
    measurementKeys,
    measurementDisplayNames,
    measurementProfiles:
      (measurement?.profiles as Record<string, unknown> | undefined) ?? null,
    measurementsUpdatedAt: measurement?.updatedAt ?? null,
  };
};

const resolveProfileKey = (profile: CustomerProfileInput) => {
  const explicitKey = profile.measurementProfileKey?.trim();
  if (explicitKey) return explicitKey;

  if (profile.gender && profile.preferredClothing) {
    return `${profile.gender}_${profile.preferredClothing}`;
  }

  return 'default';
};

export const saveCustomerProfile = async (profile: CustomerProfileInput) => {
  const measurementNumbers = toNumberMap(profile.measurements ?? {});
  const averagePoint = computeAveragePoint(measurementNumbers);
  const measurementKeys = Object.keys(measurementNumbers);
  const primaryMeasurementKeys = sanitizeStringArray(profile.primaryMeasurementKeys ?? []);
  const measurementDisplayNames = sanitizeDisplayNames(profile.measurementDisplayNames);
  const normalizedPhoneNumber =
    typeof profile.phoneNumber === 'string' && profile.phoneNumber.trim()
      ? normalizePhoneForAuth(profile.phoneNumber)
      : null;

  const profileKey = resolveProfileKey(profile);

  await Promise.all([
    setDoc(
      doc(db, 'users', profile.uid),
      {
        role: 'customer',
        phoneNumber: normalizedPhoneNumber,
        email: profile.email ?? null,
        firstName: profile.firstName,
        lastName: profile.lastName,
        gender: profile.gender,
        unit: profile.unit,
        preferredClothing: profile.preferredClothing ?? null,
        preferredClothingLabel: profile.preferredClothingLabel ?? null,
        activeMeasurementProfileKey: profileKey,
        photoURL: profile.photoURL ?? null,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    ),
    setDoc(
      doc(db, 'customerMeasurements', profile.uid),
      {
        userId: profile.uid,
        gender: profile.gender,
        unit: profile.unit,
        preferredClothing: profile.preferredClothing ?? null,
        preferredClothingLabel: profile.preferredClothingLabel ?? null,
        activeProfileKey: profileKey,
        profiles: {
          [profileKey]: {
            key: profileKey,
            gender: profile.gender,
            preferredClothing: profile.preferredClothing ?? null,
            preferredClothingLabel: profile.preferredClothingLabel ?? null,
            unit: profile.unit,
            measurements: measurementNumbers,
            averagePoint,
            primaryMeasurementKeys,
            measurementKeys,
            measurementDisplayNames,
          },
        },
        // Backward-compatible fields used by current recommendation and profile screens.
        measurements: measurementNumbers,
        averagePoint,
        primaryMeasurementKeys,
        measurementKeys,
        measurementDisplayNames,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    ),
  ]);
};

export const saveCustomerMeasurementProfile = async (
  profile: CustomerMeasurementProfileInput
) => {
  const measurementNumbers = toNumberMap(profile.measurements ?? {});
  const averagePoint = computeAveragePoint(measurementNumbers);
  const measurementKeys = Object.keys(measurementNumbers);
  const primaryMeasurementKeys = sanitizeStringArray(profile.primaryMeasurementKeys ?? []);
  const measurementDisplayNames = sanitizeDisplayNames(profile.measurementDisplayNames);
  const preferredClothingLabel = profile.preferredClothingLabel ?? null;
  const profileKey =
    profile.measurementProfileKey?.trim() ||
    `${profile.gender ?? 'default'}_${profile.preferredClothing}`;
  const setAsActive = profile.setAsActive === true;

  const userPayload: Record<string, unknown> = {
    role: 'customer',
    gender: profile.gender,
    unit: profile.unit,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  if (setAsActive) {
    userPayload.preferredClothing = profile.preferredClothing;
    userPayload.preferredClothingLabel = preferredClothingLabel;
    userPayload.activeMeasurementProfileKey = profileKey;
  }

  const measurementPayload: Record<string, unknown> = {
    userId: profile.uid,
    gender: profile.gender,
    unit: profile.unit,
    profiles: {
      [profileKey]: {
        key: profileKey,
        gender: profile.gender,
        preferredClothing: profile.preferredClothing,
        preferredClothingLabel,
        unit: profile.unit,
        measurements: measurementNumbers,
        averagePoint,
        primaryMeasurementKeys,
        measurementKeys,
        measurementDisplayNames,
      },
    },
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  if (setAsActive) {
    measurementPayload.preferredClothing = profile.preferredClothing;
    measurementPayload.preferredClothingLabel = preferredClothingLabel;
    measurementPayload.activeProfileKey = profileKey;
    measurementPayload.measurements = measurementNumbers;
    measurementPayload.averagePoint = averagePoint;
    measurementPayload.primaryMeasurementKeys = primaryMeasurementKeys;
    measurementPayload.measurementKeys = measurementKeys;
    measurementPayload.measurementDisplayNames = measurementDisplayNames;
  }

  await Promise.all([
    setDoc(doc(db, 'users', profile.uid), userPayload, { merge: true }),
    setDoc(doc(db, 'customerMeasurements', profile.uid), measurementPayload, { merge: true }),
  ]);
};

export const getCustomerProfile = async (uid: string) => {
  const [profile, measurement] = await Promise.all([
    getDocById('users', uid),
    getDocById('customerMeasurements', uid),
  ]);
  return mergeProfileAndMeasurements(profile, measurement);
};

export const subscribeCustomerProfile = (
  uid: string,
  onData: (data: Record<string, unknown> | null) => void,
  onError?: (error: Error) => void
) => {
  let profileData: FirestoreRecord | null = null;
  let measurementData: FirestoreRecord | null = null;

  const notify = () => {
    onData(mergeProfileAndMeasurements(profileData, measurementData));
  };

  const unsubscribeProfile = subscribeDocById(
    'users',
    uid,
    (data) => {
      profileData = data;
      notify();
    },
    onError
  );

  const unsubscribeMeasurement = subscribeDocById(
    'customerMeasurements',
    uid,
    (data) => {
      measurementData = data;
      notify();
    },
    onError
  );

  return () => {
    unsubscribeProfile?.();
    unsubscribeMeasurement?.();
  };
};


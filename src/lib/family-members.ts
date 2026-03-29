import { updateDoc } from 'firebase/firestore';

import { collection, db, doc, getDocById, serverTimestamp, setDoc } from '@/lib/firebase-db';
import type {
  ClothingChoice,
  CustomerGender,
  MeasurementFieldKey,
} from '@/lib/measurement';
import type { CustomerProfileData } from '@/lib/recommendation-view';

type FirestoreRecord = Record<string, unknown>;
type MeasurementNumbers = Record<string, number>;
type MeasurementDisplayNames = Record<string, string>;

type FamilyMemberInput = {
  ownerUid: string;
  firstName: string;
  relation: string;
};

type FamilyMemberMeasurementProfileInput = {
  ownerUid: string;
  familyMemberId: string;
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

type SetFamilyMemberActiveProfileInput = {
  ownerUid: string;
  familyMemberId: string;
  profileKey: string;
  preferredClothing: string | null;
  preferredClothingLabel: string;
};

export type FamilyMemberProfile = CustomerProfileData & {
  id: string;
  ownerUid: string;
  firstName: string;
  lastName?: string | null;
  relation: string;
  role: 'family_member';
  subjectType: 'family';
};

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toNumberMap = (measurements: Record<string, unknown>): MeasurementNumbers => {
  const entries = Object.entries(measurements)
    .map(([key, value]) => [key, Number.parseFloat(String(value))] as const)
    .filter(([, value]) => Number.isFinite(value) && value > 0);

  return Object.fromEntries(entries);
};

const sanitizeStringArray = (values: unknown) => {
  if (!Array.isArray(values)) return [] as string[];

  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
};

const sanitizeDisplayNames = (names?: Record<string, string>) => {
  if (!names) return {} as MeasurementDisplayNames;

  const entries = Object.entries(names)
    .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : ''] as const)
    .filter(([, value]) => !!value);

  return Object.fromEntries(entries) as MeasurementDisplayNames;
};

const computeAveragePoint = (measurements: MeasurementNumbers) => {
  const values = Object.values(measurements);
  if (!values.length) return null;

  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
};

const asRecord = (value: unknown): FirestoreRecord =>
  value && typeof value === 'object' ? (value as FirestoreRecord) : {};

const extractFamilyMemberMap = (value: unknown) =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const getUserRecord = async (ownerUid: string) => {
  const userDoc = (await getDocById('users', ownerUid)) as FirestoreRecord | null;
  if (!userDoc) {
    throw new Error('Unable to find the account profile.');
  }
  return userDoc;
};

const getStoredMember = async (ownerUid: string, familyMemberId: string) => {
  const userDoc = await getUserRecord(ownerUid);
  const familyMembers = extractFamilyMemberMap(userDoc.familyMembers);
  const member = asRecord(familyMembers[familyMemberId]);

  if (!Object.keys(member).length) {
    throw new Error('Unable to find that family member profile.');
  }

  return member;
};

const buildMemberId = (ownerUid: string) => {
  try {
    return doc(collection(db, 'users', ownerUid, 'familyMembers')).id;
  } catch {
    const random = Math.random().toString(36).slice(2, 10);
    return `fm_${Date.now().toString(36)}_${random}`;
  }
};

export const extractFamilyMembers = (value: unknown): FamilyMemberProfile[] => {
  const rawMembers = extractFamilyMemberMap(value);

  return Object.entries(rawMembers)
    .map(([id, raw]) => {
      const member = asRecord(raw);
      const firstName = normalizeText(member.firstName);
      if (!firstName) return null;

      return {
        id,
        ownerUid: normalizeText(member.ownerUid),
        firstName,
        lastName: normalizeText(member.lastName) || null,
        relation: normalizeText(member.relation) || 'Family member',
        role: 'family_member' as const,
        subjectType: 'family' as const,
        phoneNumber: normalizeText(member.phoneNumber) || null,
        email: normalizeText(member.email) || null,
        photoURL: normalizeText(member.photoURL) || null,
        unit: member.unit === 'in' ? 'in' : member.unit === 'cm' ? 'cm' : 'cm',
        gender: normalizeText(member.gender) || null,
        preferredClothing: normalizeText(member.preferredClothing) || null,
        preferredClothingLabel: normalizeText(member.preferredClothingLabel) || null,
        measurements: asRecord(member.measurements),
        averagePoint: toNumber(member.averagePoint),
        primaryMeasurementKeys: sanitizeStringArray(member.primaryMeasurementKeys),
        measurementProfiles: asRecord(member.measurementProfiles),
        activeMeasurementProfileKey: normalizeText(member.activeMeasurementProfileKey) || null,
      };
    })
    .filter((member): member is FamilyMemberProfile => !!member)
    .sort((left, right) => {
      const byName = left.firstName.localeCompare(right.firstName);
      return byName !== 0 ? byName : left.relation.localeCompare(right.relation);
    });
};

export const createFamilyMember = async ({
  ownerUid,
  firstName,
  relation,
}: FamilyMemberInput) => {
  const trimmedName = firstName.trim();
  const trimmedRelation = relation.trim();

  if (!trimmedName || !trimmedRelation) {
    throw new Error('Name and relation are required.');
  }

  const memberId = buildMemberId(ownerUid);

  await setDoc(
    doc(db, 'users', ownerUid),
    {
      familyMembers: {
        [memberId]: {
          ownerUid,
          firstName: trimmedName,
          lastName: null,
          relation: trimmedRelation,
          role: 'family_member',
          subjectType: 'family',
          phoneNumber: null,
          email: null,
          photoURL: null,
          unit: 'cm',
          gender: null,
          preferredClothing: null,
          preferredClothingLabel: null,
          measurements: {},
          averagePoint: null,
          primaryMeasurementKeys: [],
          measurementKeys: [],
          measurementDisplayNames: {},
          measurementProfiles: {},
          activeMeasurementProfileKey: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return memberId;
};

export const saveFamilyMemberMeasurementProfile = async ({
  ownerUid,
  familyMemberId,
  gender,
  preferredClothing,
  preferredClothingLabel,
  measurementProfileKey,
  unit,
  measurements,
  primaryMeasurementKeys,
  measurementDisplayNames,
  setAsActive = false,
}: FamilyMemberMeasurementProfileInput) => {
  const existingMember = await getStoredMember(ownerUid, familyMemberId);
  const measurementNumbers = toNumberMap(measurements ?? {});
  const averagePoint = computeAveragePoint(measurementNumbers);
  const measurementKeys = Object.keys(measurementNumbers);
  const sanitizedPrimaryKeys = sanitizeStringArray(primaryMeasurementKeys ?? []);
  const sanitizedDisplayNames = sanitizeDisplayNames(measurementDisplayNames);
  const profileKey =
    measurementProfileKey?.trim() ||
    `${gender ?? 'default'}_${preferredClothing}`;
  const nextLabel = preferredClothingLabel ?? null;
  const existingProfiles = extractFamilyMemberMap(existingMember.measurementProfiles);

  await updateDoc(doc(db, 'users', ownerUid), {
    [`familyMembers.${familyMemberId}`]: {
      ...existingMember,
      ownerUid,
      firstName: normalizeText(existingMember.firstName) || 'Family member',
      relation: normalizeText(existingMember.relation) || 'Family member',
      role: 'family_member',
      subjectType: 'family',
      gender,
      unit,
      preferredClothing: setAsActive ? preferredClothing : existingMember.preferredClothing ?? null,
      preferredClothingLabel: setAsActive ? nextLabel : existingMember.preferredClothingLabel ?? null,
      measurements: setAsActive ? measurementNumbers : asRecord(existingMember.measurements),
      averagePoint: setAsActive ? averagePoint : toNumber(existingMember.averagePoint),
      primaryMeasurementKeys: setAsActive
        ? sanitizedPrimaryKeys
        : sanitizeStringArray(existingMember.primaryMeasurementKeys),
      measurementKeys: setAsActive
        ? measurementKeys
        : sanitizeStringArray(existingMember.measurementKeys),
      measurementDisplayNames: setAsActive
        ? sanitizedDisplayNames
        : asRecord(existingMember.measurementDisplayNames),
      measurementProfiles: {
        ...existingProfiles,
        [profileKey]: {
          key: profileKey,
          gender,
          preferredClothing,
          preferredClothingLabel: nextLabel,
          unit,
          measurements: measurementNumbers,
          averagePoint,
          primaryMeasurementKeys: sanitizedPrimaryKeys,
          measurementKeys,
          measurementDisplayNames: sanitizedDisplayNames,
        },
      },
      activeMeasurementProfileKey: setAsActive
        ? profileKey
        : normalizeText(existingMember.activeMeasurementProfileKey) || null,
      createdAt: existingMember.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
};

export const setFamilyMemberActiveMeasurementProfile = async ({
  ownerUid,
  familyMemberId,
  profileKey,
  preferredClothing,
  preferredClothingLabel,
}: SetFamilyMemberActiveProfileInput) => {
  const existingMember = await getStoredMember(ownerUid, familyMemberId);
  const existingProfiles = extractFamilyMemberMap(existingMember.measurementProfiles);
  const activeProfile = asRecord(existingProfiles[profileKey]);

  await updateDoc(doc(db, 'users', ownerUid), {
    [`familyMembers.${familyMemberId}`]: {
      ...existingMember,
      preferredClothing,
      preferredClothingLabel,
      activeMeasurementProfileKey: profileKey,
      measurements: asRecord(activeProfile.measurements),
      averagePoint: toNumber(activeProfile.averagePoint),
      primaryMeasurementKeys: sanitizeStringArray(activeProfile.primaryMeasurementKeys),
      measurementKeys: sanitizeStringArray(activeProfile.measurementKeys),
      measurementDisplayNames: asRecord(activeProfile.measurementDisplayNames),
      measurementProfiles: existingProfiles,
      createdAt: existingMember.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
};

import { apiRequest } from '@/lib/api-client';
import { notifyProfileChanged } from '@/lib/customer-profile';
import type {
  ClothingChoice,
  CustomerGender,
  MeasurementFieldKey,
} from '@/lib/measurement';
import type { CustomerProfileData } from '@/lib/recommendation-view';

type JsonRecord = Record<string, unknown>;

type FamilyMemberInput = {
  ownerUid: string;
  firstName: string;
  gender: CustomerGender;
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

const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === 'object' ? (value as JsonRecord) : {};

const sanitizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && !!item.trim())
    : [];

export const extractFamilyMembers = (value: unknown): FamilyMemberProfile[] => {
  const rawMembers = asRecord(value);

  return Object.entries(rawMembers)
    .map<FamilyMemberProfile | null>(([id, raw]) => {
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
        unit: member.unit === 'in' ? 'in' : 'cm',
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
    .sort((left, right) => left.firstName.localeCompare(right.firstName));
};

export const createFamilyMember = async ({
  ownerUid: _ownerUid,
  firstName,
  gender,
  relation,
}: FamilyMemberInput) => {
  const result = await apiRequest<{ id: string }>('/api/profile/me/family-members', {
    method: 'POST',
    body: { firstName, gender, relation },
  });
  notifyProfileChanged();
  return result.id;
};

export const deleteFamilyMember = async ({
  ownerUid: _ownerUid,
  familyMemberId,
}: {
  ownerUid: string;
  familyMemberId: string;
}) => {
  await apiRequest(
    `/api/profile/me/family-members/${encodeURIComponent(familyMemberId)}`,
    { method: 'DELETE' },
  );
  notifyProfileChanged();
};

export const saveFamilyMemberMeasurementProfile = async ({
  ownerUid: _ownerUid,
  familyMemberId,
  ...profile
}: FamilyMemberMeasurementProfileInput) => {
  await apiRequest(
    `/api/profile/me/family-members/${encodeURIComponent(familyMemberId)}/measurement-profiles`,
    { method: 'POST', body: profile },
  );
  notifyProfileChanged();
};

export const setFamilyMemberActiveMeasurementProfile = async ({
  ownerUid: _ownerUid,
  familyMemberId,
  profileKey,
  preferredClothing,
  preferredClothingLabel,
}: SetFamilyMemberActiveProfileInput) => {
  await apiRequest(
    `/api/profile/me/family-members/${encodeURIComponent(familyMemberId)}/measurement-profiles/${encodeURIComponent(profileKey)}/active`,
    { method: 'PUT', body: { preferredClothing, preferredClothingLabel } },
  );
  notifyProfileChanged();
};

import {
  CLOTHING_OPTIONS_BY_GENDER,
  normalizeClothingChoice,
  type ClothingChoice,
  type ClothingOption,
} from '@/lib/measurement';
import type { BrandRecommendation, RecommendationStatus } from '@/lib/size-recommendation';
import type { SellerPublicProfile } from '@/lib/seller-public-profile';

export type CustomerProfileData = {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  photoURL?: string | null;
  role?: string | null;
  unit?: 'cm' | 'in' | null;
  measurements?: Record<string, unknown>;
  averagePoint?: number | null;
  gender?: string | null;
  preferredClothing?: string | null;
  preferredClothingLabel?: string | null;
  primaryMeasurementKeys?: string[] | null;
  measurementProfiles?: Record<string, unknown> | null;
  activeMeasurementProfileKey?: string | null;
  familyMembers?: Record<string, unknown> | null;
};

export type CustomerMeasurementProfile = {
  profileKey: string;
  gender: string | null;
  preferredClothing: ClothingChoice | null;
  preferredClothingLabel: string;
  unit: string;
  measurements: Record<string, unknown>;
  averagePoint: number | null;
  primaryMeasurementKeys: string[];
};

export type RecommendationSection = {
  profileKey: string;
  choice: ClothingChoice | null;
  label: string;
  recommendations: BrandRecommendation[];
  status: RecommendationStatus;
};

export type EnrichedRecommendation = BrandRecommendation & {
  brandDisplay: string;
  seller: SellerPublicProfile | null;
};

export type PairSuggestion = {
  id: string;
  score: number;
  left: EnrichedRecommendation;
  right: EnrichedRecommendation;
  sameBrand: boolean;
};

export type NormalizedGender = 'men' | 'women' | 'other' | 'unknown';

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toStringArray = (value: unknown): string[] =>
  !Array.isArray(value)
    ? []
    : value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean);

export const normalizeGenderOrCategory = (value: string | null | undefined): NormalizedGender => {
  if (!value) return 'unknown';
  const normalized = value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return 'unknown';
  if (/\b(women|woman|womens|female|girl|girls|lady|ladies)\b/.test(normalized)) return 'women';
  if (/\b(men|man|mens|male|boy|boys)\b/.test(normalized)) return 'men';
  if (/\b(other|unisex|neutral)\b/.test(normalized)) return 'other';
  return 'unknown';
};

const parseChoiceFromProfileKey = (key: string) => normalizeClothingChoice(key.split('_').slice(1).join('_'));

export const getChoiceLabel = (
  gender: NormalizedGender,
  choice: ClothingChoice | null,
  fallbackLabel?: string | null,
) => {
  if (fallbackLabel?.trim()) return fallbackLabel.trim();
  if (choice && (gender === 'men' || gender === 'women')) {
    const option = CLOTHING_OPTIONS_BY_GENDER[gender].find((item) => item.key === choice);
    if (option) return option.label;
  }
  return choice ? toTitleCase(choice) : 'Preferred item';
};

export const extractMeasurementProfiles = (customer: CustomerProfileData): CustomerMeasurementProfile[] => {
  const customerGender = normalizeGenderOrCategory(customer.gender);
  const profiles: CustomerMeasurementProfile[] = [];
  const profileMap =
    customer.measurementProfiles && typeof customer.measurementProfiles === 'object'
      ? (customer.measurementProfiles as Record<string, unknown>)
      : {};

  Object.entries(profileMap).forEach(([profileKey, profileRaw]) => {
    if (!profileRaw || typeof profileRaw !== 'object') return;
    const profile = profileRaw as Record<string, unknown>;
    const measurements =
      profile.measurements && typeof profile.measurements === 'object'
        ? (profile.measurements as Record<string, unknown>)
        : null;
    if (!measurements) return;

    const choice =
      normalizeClothingChoice(typeof profile.preferredClothing === 'string' ? profile.preferredClothing : null) ??
      parseChoiceFromProfileKey(profileKey);
    const profileGender = typeof profile.gender === 'string' ? profile.gender : customer.gender ?? null;
    const profileUnit = typeof profile.unit === 'string'
      ? profile.unit
      : typeof customer.unit === 'string' ? customer.unit : 'cm';

    profiles.push({
      profileKey,
      gender: profileGender,
      preferredClothing: choice,
      preferredClothingLabel: getChoiceLabel(
        normalizeGenderOrCategory(profileGender),
        choice,
        typeof profile.preferredClothingLabel === 'string' ? profile.preferredClothingLabel : null,
      ),
      unit: profileUnit,
      measurements,
      averagePoint: toNumber(profile.averagePoint),
      primaryMeasurementKeys: toStringArray(profile.primaryMeasurementKeys),
    });
  });

  if (!profiles.length && customer.measurements && typeof customer.measurements === 'object') {
    const choice = normalizeClothingChoice(customer.preferredClothing ?? null);
    profiles.push({
      profileKey:
        typeof customer.activeMeasurementProfileKey === 'string' && customer.activeMeasurementProfileKey.trim()
          ? customer.activeMeasurementProfileKey.trim()
          : 'default',
      gender: customer.gender ?? null,
      preferredClothing: choice,
      preferredClothingLabel: getChoiceLabel(customerGender, choice, customer.preferredClothingLabel ?? null),
      unit: typeof customer.unit === 'string' ? customer.unit : 'cm',
      measurements: customer.measurements,
      averagePoint: toNumber(customer.averagePoint),
      primaryMeasurementKeys: toStringArray(customer.primaryMeasurementKeys),
    });
  }

  const activeKey = typeof customer.activeMeasurementProfileKey === 'string' ? customer.activeMeasurementProfileKey.trim() : null;
  profiles.sort((left, right) => {
    if (left.profileKey === activeKey) return -1;
    if (right.profileKey === activeKey) return 1;
    return left.preferredClothingLabel.localeCompare(right.preferredClothingLabel);
  });

  return profiles;
};

export const buildFallbackOptions = (profiles: CustomerMeasurementProfile[]): ClothingOption[] => {
  const seen = new Set<ClothingChoice>();
  const options: ClothingOption[] = [];

  profiles.forEach((profile) => {
    if (!profile.preferredClothing || seen.has(profile.preferredClothing)) return;
    seen.add(profile.preferredClothing);
    options.push({
      key: profile.preferredClothing,
      label: profile.preferredClothingLabel,
      subtitle: 'Saved measurements',
    });
  });

  return options;
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export const resolveBrandDisplay = (brand: string, seller: SellerPublicProfile | null) => {
  const normalized = brand.trim().toLowerCase();
  if (
    (normalized === 'unknown brand' || normalized === 'unknown' || normalized === 'admin' || normalized === 'seller') &&
    seller?.businessName
  ) {
    return seller.businessName;
  }
  return brand;
};

const computePairScore = (left: EnrichedRecommendation, right: EnrichedRecommendation) => {
  const base = (left.matchScore + right.matchScore) / 2;
  const sameBrand = left.brandDisplay.toLowerCase() === right.brandDisplay.toLowerCase();
  const sameSeller = !!left.sellerUserId && !!right.sellerUserId && left.sellerUserId === right.sellerUserId;
  return Number(clamp(base + (sameBrand ? 8 : 0) + (sameSeller ? 4 : 0)).toFixed(1));
};

export const buildPairSuggestions = (
  left: RecommendationSection,
  right: RecommendationSection,
  sellers: Record<string, SellerPublicProfile>,
) => {
  const enrich = (item: BrandRecommendation): EnrichedRecommendation => {
    const seller = item.sellerUserId ? sellers[item.sellerUserId] ?? null : null;
    return {
      ...item,
      brandDisplay: resolveBrandDisplay(item.brand, seller),
      seller,
    };
  };

  const leftItems = left.recommendations.slice(0, 6).map(enrich);
  const rightItems = right.recommendations.slice(0, 6).map(enrich);
  const pairs: PairSuggestion[] = [];

  leftItems.forEach((leftItem) => {
    rightItems.forEach((rightItem) => {
      pairs.push({
        id: `${leftItem.id}__${rightItem.id}`,
        score: computePairScore(leftItem, rightItem),
        left: leftItem,
        right: rightItem,
        sameBrand: leftItem.brandDisplay.toLowerCase() === rightItem.brandDisplay.toLowerCase(),
      });
    });
  });

  return pairs.sort((a, b) => b.score - a.score).slice(0, 5);
};

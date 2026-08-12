import { apiRequest } from '@/lib/api-client';

export type SellerPublicProfile = {
  uid: string;
  businessName: string;
  displayName: string;
  photoURL: string | null;
  logoKey?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
};

const parseSellerUserId = (sellerRef: string | null | undefined): string | null => {
  if (!sellerRef) return null;

  const normalized = sellerRef.trim();
  if (!normalized) return null;

  const segments = normalized.split('/').filter(Boolean);
  if (!segments.length) return null;

  if (segments.length >= 2 && segments[segments.length - 2] === 'users') {
    return segments[segments.length - 1] ?? null;
  }

  return segments[segments.length - 1] ?? null;
};

const readBusinessName = (record: Record<string, unknown>) => {
  const candidates = [
    record.businessName,
    record.storeName,
    record.shopName,
    record.companyName,
    record.sellerName,
    record.brandName,
    record.displayName,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
};

const readDisplayName = (record: Record<string, unknown>) => {
  const direct =
    typeof record.displayName === 'string' && record.displayName.trim()
      ? record.displayName.trim()
      : null;

  if (direct) return direct;

  const firstName =
    typeof record.firstName === 'string' && record.firstName.trim()
      ? record.firstName.trim()
      : '';
  const lastName =
    typeof record.lastName === 'string' && record.lastName.trim()
      ? record.lastName.trim()
      : '';
  const combined = `${firstName} ${lastName}`.trim();

  if (combined) return combined;

  if (typeof record.email === 'string' && record.email.trim()) {
    return record.email.trim();
  }

  return 'Seller';
};

const readPhotoUrl = (record: Record<string, unknown>) => {
  const candidates = [
    record.photoURL,
    record.photoUrl,
    record.imageUrl,
    record.imageURL,
    record.profilePhoto,
    record.profileImage,
    record.logoUrl,
    record.logoURL,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
};

export const getSellerPublicProfiles = async (
  sellerRefs: (string | null | undefined)[]
): Promise<Record<string, SellerPublicProfile>> => {
  const uniqueUserIds = Array.from(
    new Set(
      sellerRefs
        .map((item) => parseSellerUserId(item))
        .filter((item): item is string => !!item)
    )
  );

  if (!uniqueUserIds.length) {
    return {};
  }

  const result = await apiRequest<{ sellers: Record<string, SellerPublicProfile> }>(
    '/api/catalog/bootstrap',
  );
  return Object.fromEntries(
    uniqueUserIds
      .filter((uid) => !!result.sellers[uid])
      .map((uid) => [uid, result.sellers[uid]]),
  );
};

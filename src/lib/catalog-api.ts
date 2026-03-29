import { auth } from '@/lib/firebase-client';
import type { BrandSizeMeasurementRecord } from '@/lib/brand-size-measurements';
import type { SellerPublicProfile } from '@/lib/seller-public-profile';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '';

type CatalogBootstrapResponse = {
  brandRows: BrandSizeMeasurementRecord[];
  sellers: Record<string, SellerPublicProfile>;
};

export const fetchCatalogBootstrap = async (): Promise<CatalogBootstrapResponse> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('You must be signed in to load catalog data.');
  }

  const token = await user.getIdToken();
  const response = await fetch(`${API_BASE_URL}/api/catalog/bootstrap`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    status?: string;
    message?: string;
    data?: CatalogBootstrapResponse;
  };

  if (!response.ok || payload.status === 'error' || !payload.data) {
    throw new Error(payload.message || 'Unable to load catalog data.');
  }

  return payload.data;
};

import { apiRequest } from '@/lib/api-client';
import type { BrandSizeMeasurementRecord } from '@/lib/brand-size-measurements';
import type { SellerPublicProfile } from '@/lib/seller-public-profile';

type CatalogBootstrapResponse = {
  brandRows: BrandSizeMeasurementRecord[];
  sellers: Record<string, SellerPublicProfile>;
};

export const fetchCatalogBootstrap = async (): Promise<CatalogBootstrapResponse> => {
  return apiRequest<CatalogBootstrapResponse>('/api/catalog/bootstrap');
};

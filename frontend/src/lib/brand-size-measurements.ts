import { apiRequest } from '@/lib/api-client';

export type BrandSizeMeasurementRecord = {
  id: string;
  brandName?: string;
  brand?: string;
  sellerName?: string;
  sellerBusinessName?: string;
  businessName?: string;
  companyName?: string;
  title?: string;
  name?: string;
  productName?: string;
  clothingType?: string | null;
  gender?: string | null;
  category?: string | null;
  subCategory?: string | null;
  sizeLabels?: string | null;
  sizeLabel?: string | null;
  size?: string | number | null;
  sizeKey?: number | null;
  label?: string | null;
  sizeName?: string | null;
  unit?: string | null;
  averagePoint?: number | null;
  primaryMeasurementKeys?: string[] | null;
  measurementKeys?: string[] | null;
  sellerUid?: string | null;
  sellerRef?: unknown;
  sellerId?: unknown;
  isActive?: boolean;
  measurements?: Record<string, unknown>;
  imageUrl?: string | null;
  imageURL?: string | null;
  image?: string | null;
  thumbnailUrl?: string | null;
  photoURL?: string | null;
  photoUrl?: string | null;
  logoUrl?: string | null;
  logoURL?: string | null;
  brandImage?: string | null;
  secureUrl?: string | null;
  secure_url?: string | null;
  images?: unknown[];
  qrCode?: string | number | null;
  code?: string | number | null;
};

export const getBrandSizeMeasurements = async (): Promise<BrandSizeMeasurementRecord[]> => {
  const result = await apiRequest<{ brandRows: BrandSizeMeasurementRecord[] }>(
    '/api/catalog/bootstrap',
  );
  return result.brandRows;
};

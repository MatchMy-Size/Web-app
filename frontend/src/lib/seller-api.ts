import { apiRequest } from '@/lib/api-client';

export type SellerProfile = {
  businessName: string;
  contactName: string;
  email: string;
  phoneNumber: string;
  address: string;
  photoUrl: string;
  role: string;
  status: string;
};

export type SellerDashboard = {
  profile: SellerProfile;
  categoryCount: number;
  sizeCount: number;
};

export type SellerSizeRow = {
  catalogId?: string;
  sizeLabel: string;
  sizeKey?: number;
  averagePoint?: number;
  measurements: Record<string, number>;
};

export type SellerSizeChart = {
  id: string;
  brandName: string;
  department: 'MEN' | 'WOMEN' | 'CHILDREN' | 'UNISEX';
  mainCategory: string;
  subcategory?: string | null;
  unit: 'cm';
  measurementBasis: 'BODY' | 'GARMENT';
  measurementKeys: string[];
  primaryMeasurementKeys: string[];
  sizes: SellerSizeRow[];
};

export type SaveSellerSizeChart = {
  department: string;
  mainCategory: string;
  subcategory?: string;
  unit: 'cm' | 'in';
  measurementBasis: 'BODY' | 'GARMENT';
  sizes: SellerSizeRow[];
};

export const getSellerDashboard = () =>
  apiRequest<SellerDashboard>('/api/seller/dashboard');

export const updateSellerProfile = (profile: Omit<SellerProfile, 'role' | 'status'>) =>
  apiRequest<SellerProfile>('/api/seller/profile', { method: 'PATCH', body: profile });

export const getSellerSizeCharts = () =>
  apiRequest<SellerSizeChart[]>('/api/seller/categories');

export const createSellerSizeChart = (chart: SaveSellerSizeChart) =>
  apiRequest<SellerSizeChart>('/api/seller/categories', { method: 'POST', body: chart });

export const updateSellerSizeChart = (chartId: string, chart: SaveSellerSizeChart) =>
  apiRequest<SellerSizeChart>(`/api/seller/categories/${chartId}`, { method: 'PUT', body: chart });

export const archiveSellerSizeChart = (chartId: string) =>
  apiRequest<{ archived: true }>(`/api/seller/categories/${chartId}`, { method: 'DELETE' });

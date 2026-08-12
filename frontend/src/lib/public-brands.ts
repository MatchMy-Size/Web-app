import { apiRequest } from '@/lib/api-client';
import { BRAND_LOGOS, getBrandLogo } from '@/lib/brand-logos';

type PublicSellerBrand = {
  key: string;
  name: string;
  logoUrl: string | null;
};

export type LandingBrand = {
  key: string;
  name: string;
  src: string | null;
};

export const LOCAL_LANDING_BRANDS: LandingBrand[] = BRAND_LOGOS.map(brand => ({
  key: `local-${brand.key}`,
  name: brand.name,
  src: brand.src,
}));

const cleanUrl = (value: string | null | undefined) => value?.trim() || null;

export const fetchPublicBrands = async (): Promise<LandingBrand[]> => {
  const sellers = await apiRequest<PublicSellerBrand[]>('/api/catalog/brands', {
    authenticated: false,
  });
  const representedLocalLogos = new Set<string>();
  const sellerBrands = sellers.map(seller => {
    const local = getBrandLogo(seller.name);
    if (local) representedLocalLogos.add(local.key);
    return {
      key: seller.key,
      name: seller.name,
      src: cleanUrl(seller.logoUrl) ?? local?.src ?? null,
    };
  });
  const remainingLocalBrands = BRAND_LOGOS
    .filter(brand => !representedLocalLogos.has(brand.key))
    .map(brand => ({ key: `local-${brand.key}`, name: brand.name, src: brand.src }));

  return [...sellerBrands, ...remainingLocalBrands];
};

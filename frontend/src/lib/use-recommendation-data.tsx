import { useEffect, useMemo, useState } from 'react';

import { useProfileSubject } from '@/context/profile-subject-context';
import { CLOTHING_OPTIONS_BY_GENDER, normalizeGender, type ClothingOption } from '@/lib/measurement';
import { fetchCatalogBootstrap } from '@/lib/catalog-api';
import { buildBrandRecommendationResult } from '@/lib/size-recommendation';
import type { SellerPublicProfile } from '@/lib/seller-public-profile';
import {
  buildFallbackOptions,
  extractMeasurementProfiles,
  getChoiceLabel,
  normalizeGenderOrCategory,
  type CustomerMeasurementProfile,
  type CustomerProfileData,
  type RecommendationSection,
} from '@/lib/recommendation-view';

type UseRecommendationDataOptions = {
  subject?: 'selected' | 'self';
};

export function useRecommendationData(
  userId: string | null | undefined,
  options: UseRecommendationDataOptions = {}
) {
  const { selfProfile, selectedSubject, profilesLoading, profilesError } = useProfileSubject();
  const [brandRows, setBrandRows] = useState<any[]>([]);
  const [sellers, setSellers] = useState<Record<string, SellerPublicProfile>>({});
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const profile = useMemo<CustomerProfileData | null>(() => {
    if (options.subject === 'self') {
      return selfProfile;
    }

    return (selectedSubject?.profile as CustomerProfileData | null) ?? null;
  }, [options.subject, selectedSubject?.profile, selfProfile]);

  useEffect(() => {
    if (!userId) {
      setCatalogLoading(false);
      setCatalogError(null);
      setBrandRows([]);
      setSellers({});
      return;
    }

    let active = true;
    setCatalogLoading(true);
    setCatalogError(null);

    fetchCatalogBootstrap()
      .then(({ brandRows: rows, sellers: sellerMap }) => {
        if (!active) return;
        setBrandRows(rows);
        setSellers(sellerMap);
        setCatalogError(null);
        setCatalogLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setCatalogError(err instanceof Error ? err.message : 'Unable to load brand sizes.');
        setCatalogLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const measurementProfiles = useMemo<CustomerMeasurementProfile[]>(() => {
    return profile ? extractMeasurementProfiles(profile) : [];
  }, [profile]);

  const activeProfileKey =
    typeof profile?.activeMeasurementProfileKey === 'string' ? profile.activeMeasurementProfileKey : null;

  const effectiveGender = useMemo(() => {
    const activeProfileGender = normalizeGender(
      measurementProfiles.find((entry) => entry.profileKey === activeProfileKey)?.gender,
    );

    if (activeProfileGender) return activeProfileGender;

    const topLevelGender = normalizeGender(profile?.gender);
    if (topLevelGender) return topLevelGender;

    const savedGenders = Array.from(
      new Set(
        measurementProfiles
          .map((entry) => normalizeGender(entry.gender))
          .filter((entry): entry is 'men' | 'women' => entry === 'men' || entry === 'women'),
      ),
    );

    return savedGenders.length === 1 ? savedGenders[0] : null;
  }, [activeProfileKey, measurementProfiles, profile?.gender]);

  const sections = useMemo<RecommendationSection[]>(() => {
    return measurementProfiles
      .map((profileEntry) => {
        const result = buildBrandRecommendationResult({
          customer: {
            measurements: profileEntry.measurements,
            unit: profileEntry.unit,
            averagePoint: profileEntry.averagePoint,
            gender: profileEntry.gender,
            preferredClothing: profileEntry.preferredClothing,
            primaryMeasurementKeys: profileEntry.primaryMeasurementKeys,
          },
          brandRows,
          limit: 12,
        });

        return {
          profileKey: profileEntry.profileKey,
          choice: profileEntry.preferredClothing,
          label: profileEntry.preferredClothingLabel,
          recommendations: result.recommendations,
          status: result.status,
        };
      });
  }, [brandRows, measurementProfiles]);

  const categoryOptions = useMemo<ClothingOption[]>(() => {
    const savedOptions = buildFallbackOptions(measurementProfiles);
    if (effectiveGender) {
      const merged = new Map<string, ClothingOption>();
      CLOTHING_OPTIONS_BY_GENDER[effectiveGender].forEach((option) => merged.set(option.key, option));
      savedOptions.forEach((option) => {
        if (!merged.has(option.key)) {
          merged.set(option.key, option);
        }
      });
      return Array.from(merged.values());
    }
    return savedOptions;
  }, [effectiveGender, measurementProfiles]);

  const normalizedGender = effectiveGender ?? normalizeGenderOrCategory(profile?.gender);
  const activeSectionKey = sections.find((section) => section.profileKey === activeProfileKey)?.profileKey ?? sections[0]?.profileKey ?? null;

  return {
    profile,
    subject: options.subject === 'self' ? null : selectedSubject,
    sellers,
    sections,
    categoryOptions,
    measurementProfiles,
    normalizedGender,
    activeSectionKey,
    loading: profilesLoading || catalogLoading,
    error: profilesError ?? catalogError,
  };
}

export const getCategoryBadge = (sections: RecommendationSection[], choice: string | null) => {
  const section = sections.find((entry) => entry.choice === choice);
  if (!section) return 'Add sizes';
  if (section.status === 'no-reliable-match') return 'No reliable fit';
  if (section.status === 'no-comparable-key-measurements') return 'Primary measurement unavailable';
  return `${section.recommendations.length} matches`;
};

export const resolveSectionLabel = (profile: CustomerMeasurementProfile) =>
  getChoiceLabel(normalizeGenderOrCategory(profile.gender), profile.preferredClothing, profile.preferredClothingLabel);

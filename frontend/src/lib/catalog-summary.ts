import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') || '';

export type CatalogSummary = {
  brandCount: number;
  catalogRowCount: number;
  sellerCount: number;
  brandNames: string[];
};

const fallbackSummary: CatalogSummary = {
  brandCount: 18,
  catalogRowCount: 295,
  sellerCount: 20,
  brandNames: [],
};

let cachedSummary: CatalogSummary | null = null;
let pendingSummary: Promise<CatalogSummary> | null = null;

export const fetchCatalogSummary = async (): Promise<CatalogSummary> => {
  if (cachedSummary) return cachedSummary;
  if (pendingSummary) return pendingSummary;

  pendingSummary = fetch(`${API_BASE_URL}/api/catalog/summary`, {
    headers: { Accept: 'application/json' },
  })
    .then(async (response) => {
      const payload = (await response.json().catch(() => ({}))) as {
        status?: string;
        data?: CatalogSummary;
      };
      if (!response.ok || payload.status === 'error' || !payload.data) {
        throw new Error('Unable to load catalog summary.');
      }
      cachedSummary = payload.data;
      return cachedSummary;
    })
    .finally(() => {
      pendingSummary = null;
    });

  return pendingSummary;
};

export const useCatalogSummary = () => {
  const [summary, setSummary] = useState<CatalogSummary>(cachedSummary ?? fallbackSummary);

  useEffect(() => {
    let active = true;
    void fetchCatalogSummary()
      .then((nextSummary) => {
        if (active) setSummary(nextSummary);
      })
      .catch(() => {
        // Keep the last known catalog values available if the public API is temporarily unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  return summary;
};

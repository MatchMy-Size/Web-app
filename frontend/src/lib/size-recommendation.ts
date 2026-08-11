import type { BrandSizeMeasurementRecord } from '@/lib/brand-size-measurements';
import { getBrandLogoSource } from '@/lib/brand-logos';

type NumericMeasurements = Record<string, number>;

type CustomerMeasurementProfile = {
  measurements?: Record<string, unknown>;
  unit?: string | null;
  averagePoint?: number | null;
  gender?: string | null;
  preferredClothing?: string | null;
  primaryMeasurementKeys?: string[] | null;
};

type RecommendationInput = {
  customer: CustomerMeasurementProfile;
  brandRows: BrandSizeMeasurementRecord[];
  limit?: number;
};

export type BrandRecommendation = {
  id: string;
  brand: string;
  title: string;
  recommendedSize: string | null;
  sizeLabel: string;
  sizeKey: number | null;
  category: string;
  subCategory: string;
  unit: string;
  averagePoint: number | null;
  score: number;
  matchScore: number;
  explanation: string;
  reasons: string[];
  missingMeasurements: string[];
  comparableMeasurements: string[];
  imageUrl: string | null;
  commonMeasurementCount: number;
  primaryMatchedCount: number;
  primaryExpectedCount: number;
  availability: 'recommended' | 'primary-measurement-unavailable';
  unavailablePrimaryMeasurementKeys: string[];
  confidence: 'high' | 'limited';
  confidenceExplanation: string;
  sellerUserId: string | null;
};

export type RecommendationStatus =
  | 'ready'
  | 'missing-measurements'
  | 'no-comparable-key-measurements'
  | 'no-reliable-match';

export type BrandRecommendationResult = {
  recommendations: BrandRecommendation[];
  status: RecommendationStatus;
};

type NormalizedGender = 'men' | 'women' | 'other' | 'unknown';
type ClothingChoice = 'shirt' | 'tshirt' | 'trouser' | 'short' | 'blouse' | 'dress' | 'unknown';

type KeyScore = {
  score: number | null;
  commonCount: number;
};

type PrimaryScoreResult = KeyScore & {
  expectedCount: number;
  coverage: number;
};

type RankedRecommendation = BrandRecommendation & {
  rankPrimaryCoverage: number;
  rankPrimaryScore: number;
};

// A size is never presented as a recommendation until it is sufficiently close
// to the customer's saved measurements. Scores below this are deliberately
// returned as "no reliable match", rather than a misleading lowest-ranked size.
export const MINIMUM_RELIABLE_MATCH_SCORE = 60;
const SHIRT_HIGH_CONFIDENCE_KEYS = new Set(['chest', 'shoulder']);

const CLOTHING_LABELS: Record<Exclude<ClothingChoice, 'unknown'>, string> = {
  shirt: 'Shirt',
  tshirt: 'T Shirt',
  trouser: 'Trouser',
  short: 'Short',
  blouse: 'Blouse',
  dress: 'Dress',
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const normalizeToken = (value: string | null | undefined) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const normalizeMeasurementKey = (key: string) => {
  const normalized = normalizeToken(key);

  switch (normalized) {
    case 'shoulder':
    case 'shoulders':
      return 'shoulder';
    case 'hip':
    case 'hips':
      return 'hip';
    case 'sleeve':
    case 'sleevlength':
    case 'sleevelength':
      return 'sleeve';
    case 'inseam':
    case 'inseamlength':
      return 'inseam';
    case 'outseam':
    case 'outseamlength':
      return 'outseam';
    case 'neck':
    case 'chest':
    case 'bust':
    case 'waist':
    case 'thigh':
    case 'length':
      return normalized;
    default:
      return normalized || key.toLowerCase().trim();
  }
};

const normalizeStringArray = (values: unknown): string[] => {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => normalizeMeasurementKey(value))
        .filter(Boolean)
    )
  );
};

const usesInches = (unit: unknown) =>
  typeof unit === 'string' && ['in', 'inch', 'inches', 'imperial'].includes(unit.trim().toLowerCase());

const toCentimetres = (value: number, unit: unknown) =>
  usesInches(unit) ? Number((value * 2.54).toFixed(2)) : value;

const toNumericMeasurements = (raw: unknown, sourceUnit?: unknown): NumericMeasurements => {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const normalizedMeasurements: NumericMeasurements = {};

  Object.entries(raw as Record<string, unknown>).forEach(([key, value]) => {
    const numericValue = toNumber(value);
    if (numericValue === null || numericValue <= 0) {
      return;
    }

    const normalizedKey = normalizeMeasurementKey(key);
    normalizedMeasurements[normalizedKey] = toCentimetres(numericValue, sourceUnit);
  });

  return normalizedMeasurements;
};

const calculateAveragePoint = (measurements: NumericMeasurements): number | null => {
  const values = Object.values(measurements);
  if (!values.length) {
    return null;
  }

  const sum = values.reduce((total, value) => total + value, 0);
  return Number((sum / values.length).toFixed(2));
};

const calculateFieldScore = (customerValue: number, brandValue: number) => {
  const denominator = Math.max(customerValue, brandValue, 1);
  const diffRatio = Math.abs(customerValue - brandValue) / denominator;
  return Math.max(0, 100 - diffRatio * 100);
};

const calculateAverageScore = (customerAverage: number, brandAverage: number) => {
  const denominator = Math.max(customerAverage, brandAverage, 1);
  const diffRatio = Math.abs(customerAverage - brandAverage) / denominator;
  return Math.max(0, 100 - diffRatio * 100);
};

const calculateScoreForKeys = (
  keys: string[],
  customerMeasurements: NumericMeasurements,
  brandMeasurements: NumericMeasurements
): KeyScore => {
  const uniqueKeys = Array.from(new Set(keys));
  const commonKeys = uniqueKeys.filter(
    (key) => key in customerMeasurements && key in brandMeasurements
  );

  if (!commonKeys.length) {
    return { score: null, commonCount: 0 };
  }

  const fieldScores = commonKeys.map((key) =>
    calculateFieldScore(customerMeasurements[key], brandMeasurements[key])
  );

  const avg = fieldScores.reduce((total, value) => total + value, 0) / fieldScores.length;

  return {
    score: Number(avg.toFixed(2)),
    commonCount: commonKeys.length,
  };
};

const calculatePrimaryMeasurementScore = (
  customerMeasurements: NumericMeasurements,
  brandMeasurements: NumericMeasurements,
  customerPrimaryKeys: string[],
  sellerPrimaryKeys: string[]
): PrimaryScoreResult => {
  const normalizedCustomerPrimary = customerPrimaryKeys
    .map((key) => normalizeMeasurementKey(key))
    .filter((key) => key in customerMeasurements);
  const normalizedSellerPrimary = sellerPrimaryKeys
    .map((key) => normalizeMeasurementKey(key))
    .filter((key) => key in customerMeasurements);

  const expectedKeys = normalizedCustomerPrimary.length
    ? Array.from(new Set(normalizedCustomerPrimary))
    : Array.from(new Set(normalizedSellerPrimary));

  if (!expectedKeys.length) {
    return {
      score: null,
      commonCount: 0,
      expectedCount: 0,
      coverage: 0,
    };
  }

  const keyScore = calculateScoreForKeys(expectedKeys, customerMeasurements, brandMeasurements);
  const coverage = keyScore.commonCount / expectedKeys.length;

  return {
    ...keyScore,
    expectedCount: expectedKeys.length,
    coverage: Number(coverage.toFixed(4)),
  };
};

const calculateSecondaryMeasurementScore = (
  customerMeasurements: NumericMeasurements,
  brandMeasurements: NumericMeasurements,
  excludedKeys: string[]
): KeyScore => {
  const excluded = new Set(excludedKeys.map((key) => normalizeMeasurementKey(key)));

  const commonKeys = Object.keys(customerMeasurements).filter(
    (key) => key in brandMeasurements && !excluded.has(key)
  );

  return calculateScoreForKeys(commonKeys, customerMeasurements, brandMeasurements);
};

const normalizeGenderOrCategory = (value: string | null | undefined): NormalizedGender => {
  if (!value) {
    return 'unknown';
  }

  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return 'unknown';
  }

  if (/\b(women|woman|womens|female|girl|girls|lady|ladies)\b/.test(normalized)) {
    return 'women';
  }

  if (/\b(men|man|mens|male|boy|boys)\b/.test(normalized)) {
    return 'men';
  }

  if (/\b(other|unisex|neutral)\b/.test(normalized)) {
    return 'other';
  }

  return 'unknown';
};

const normalizeClothingChoice = (value: string | null | undefined): ClothingChoice => {
  const normalized = normalizeToken(value);

  if (!normalized) return 'unknown';
  if (['shirt'].includes(normalized)) return 'shirt';
  if (['tshirt', 'tee', 'teeshirt'].includes(normalized)) return 'tshirt';
  if (['trouser', 'trousers', 'pant', 'pants'].includes(normalized)) return 'trouser';
  if (['short', 'shorts'].includes(normalized)) return 'short';
  if (['blouse', 'blouses'].includes(normalized)) return 'blouse';
  if (['dress', 'dresses'].includes(normalized)) return 'dress';

  return 'unknown';
};

const shouldIncludeByGender = (
  customerGender: string | null | undefined,
  sellerCategory: string | null | undefined,
  sellerGender: string | null | undefined
) => {
  const customer = normalizeGenderOrCategory(customerGender);
  const seller = normalizeGenderOrCategory(sellerGender ?? sellerCategory);

  if (customer === 'men') return seller === 'men';
  if (customer === 'women') return seller === 'women';

  return true;
};

const shouldIncludeByClothing = (
  customerPreferredClothing: string | null | undefined,
  sellerClothingType: string | null | undefined,
  sellerSubCategory: string | null | undefined,
  sellerName: string | null | undefined
) => {
  const customerChoice = normalizeClothingChoice(customerPreferredClothing);

  if (customerChoice === 'unknown') {
    return true;
  }

  const sellerChoice =
    normalizeClothingChoice(sellerClothingType) !== 'unknown'
      ? normalizeClothingChoice(sellerClothingType)
      : normalizeClothingChoice(sellerSubCategory) !== 'unknown'
        ? normalizeClothingChoice(sellerSubCategory)
        : normalizeClothingChoice(sellerName);

  return sellerChoice === customerChoice;
};

const parseUserIdFromPath = (path: string): string | null => {
  const segments = path.split('/').filter(Boolean);
  if (!segments.length) return null;

  if (segments.length >= 2 && segments[segments.length - 2] === 'users') {
    return segments[segments.length - 1] ?? null;
  }

  return segments[segments.length - 1] ?? null;
};

const parseSellerUserId = (sellerRef: unknown): string | null => {
  if (!sellerRef) {
    return null;
  }

  if (typeof sellerRef === 'string') {
    return parseUserIdFromPath(sellerRef);
  }

  if (typeof sellerRef !== 'object') {
    return null;
  }

  const ref = sellerRef as Record<string, unknown>;

  if (typeof ref.id === 'string' && ref.id.trim()) {
    return ref.id.trim();
  }

  if (typeof ref.path === 'string' && ref.path.trim()) {
    return parseUserIdFromPath(ref.path);
  }

  if (typeof ref._path === 'string' && ref._path.trim()) {
    return parseUserIdFromPath(ref._path);
  }

  const documentPath = ref._documentPath;
  if (documentPath && typeof documentPath === 'object') {
    const docPath = documentPath as Record<string, unknown>;

    if (Array.isArray(docPath.segments) && docPath.segments.length) {
      const last = docPath.segments[docPath.segments.length - 1];
      if (typeof last === 'string' && last.trim()) {
        return last;
      }
    }

    if (Array.isArray(docPath._parts) && docPath._parts.length) {
      const last = docPath._parts[docPath._parts.length - 1];
      if (typeof last === 'string' && last.trim()) {
        return last;
      }
    }
  }

  return null;
};

const firstText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
};

const isGenericAdminLabel = (value: string | null | undefined) => {
  const normalized = normalizeToken(value);
  return normalized === 'admin' || normalized === 'seller';
};

const formatDisplayLabel = (value: string | null | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const hasUppercase = /[A-Z]/.test(trimmed);
  if (hasUppercase) return trimmed;

  return trimmed
    .replace(/[_-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const getBrandName = (record: BrandSizeMeasurementRecord) =>
  firstText(
    record.businessName,
    record.sellerBusinessName,
    record.companyName,
    record.brand,
    isGenericAdminLabel(record.brandName) ? null : record.brandName,
    isGenericAdminLabel(record.sellerName) ? null : record.sellerName
  ) ?? 'Unknown brand';

const getTitle = (record: BrandSizeMeasurementRecord) =>
  formatDisplayLabel(
    firstText(record.title, record.name, record.productName, record.subCategory, record.clothingType)
  ) ??
  'Recommended item';

const getSizeLabel = (record: BrandSizeMeasurementRecord) =>
  firstText(record.sizeLabels, record.sizeLabel, record.size, record.label, record.sizeName) ??
  'N/A';

const getSizeKey = (record: BrandSizeMeasurementRecord) => {
  const numeric = toNumber(record.sizeKey);
  return numeric === null ? null : Math.trunc(numeric);
};

const formatMeasurementKey = (key: string) => {
  const normalized = normalizeMeasurementKey(key);
  if (normalized === 'inseam') return 'inseam';
  if (normalized === 'outseam') return 'outseam';
  return normalized.replace(/([a-z])([A-Z])/g, '$1 $2');
};

const formatMeasurementList = (keys: string[]) => {
  const labels = Array.from(new Set(keys.map(formatMeasurementKey))).filter(Boolean);
  if (!labels.length) return 'the available measurements';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
};

const capitalizeFirst = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const getImageUrl = (record: BrandSizeMeasurementRecord) => {
  const direct = firstText(
    record.imageUrl,
    record.imageURL,
    record.image,
    record.thumbnailUrl,
    record.photoURL,
    record.photoUrl,
    record.logoUrl,
    record.logoURL,
    record.brandImage,
    record.secureUrl,
    record.secure_url
  );

  if (direct) return direct;

  if (Array.isArray(record.images)) {
    const first = firstText(...record.images);
    if (first) return first;
  }

  return null;
};

const getCategoryLabel = (record: BrandSizeMeasurementRecord) => {
  const normalized = normalizeGenderOrCategory(firstText(record.gender, record.category, record.id));
  if (normalized === 'men') return 'Men';
  if (normalized === 'women') return 'Women';
  if (normalized === 'other') return 'Unisex';

  return record.category ?? 'Uncategorized';
};

const getSubCategoryLabel = (record: BrandSizeMeasurementRecord) => {
  const normalizedChoice = normalizeClothingChoice(
    firstText(record.clothingType, record.subCategory, record.name)
  );

  if (normalizedChoice !== 'unknown') {
    return CLOTHING_LABELS[normalizedChoice];
  }

  const idTokens = record.id.split('_').filter(Boolean);
  for (const token of idTokens) {
    const inferred = normalizeClothingChoice(token);
    if (inferred !== 'unknown') {
      return CLOTHING_LABELS[inferred];
    }
  }

  return record.subCategory ?? 'General';
};

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

const sortBySizeKeyAsc = (left: { sizeKey: number | null }, right: { sizeKey: number | null }) => {
  if (left.sizeKey === null && right.sizeKey === null) return 0;
  if (left.sizeKey === null) return 1;
  if (right.sizeKey === null) return -1;
  return left.sizeKey - right.sizeKey;
};

const sortBySizeKeyDesc = (
  left: { sizeKey: number | null },
  right: { sizeKey: number | null }
) => {
  if (left.sizeKey === null && right.sizeKey === null) return 0;
  if (left.sizeKey === null) return 1;
  if (right.sizeKey === null) return -1;
  return right.sizeKey - left.sizeKey;
};

const inferNormalizedGenderFromId = (id: string): NormalizedGender => {
  const tokens = id.split('_').filter(Boolean);
  for (const token of tokens) {
    const normalized = normalizeGenderOrCategory(token);
    if (normalized !== 'unknown') return normalized;
  }

  return 'unknown';
};

const inferNormalizedClothingFromId = (id: string): ClothingChoice => {
  const tokens = id.split('_').filter(Boolean);
  for (const token of tokens) {
    const normalized = normalizeClothingChoice(token);
    if (normalized !== 'unknown') return normalized;
  }

  return 'unknown';
};

const getExpectedPrimaryKeys = (
  customerMeasurements: NumericMeasurements,
  customerPrimaryKeys: string[],
  sellerPrimaryKeys: string[]
) => {
  const normalizedCustomerPrimary = customerPrimaryKeys
    .map((key) => normalizeMeasurementKey(key))
    .filter((key) => key in customerMeasurements);
  const normalizedSellerPrimary = sellerPrimaryKeys
    .map((key) => normalizeMeasurementKey(key))
    .filter((key) => key in customerMeasurements);

  return normalizedCustomerPrimary.length
    ? Array.from(new Set(normalizedCustomerPrimary))
    : Array.from(new Set(normalizedSellerPrimary));
};

export const buildBrandRecommendationResult = ({
  customer,
  brandRows,
  limit = 12,
}: RecommendationInput): BrandRecommendationResult => {
  const customerMeasurements = toNumericMeasurements(customer.measurements, customer.unit);

  if (!Object.keys(customerMeasurements).length) {
    return {
      recommendations: [],
      status: 'missing-measurements',
    };
  }

  const customerAverage = calculateAveragePoint(customerMeasurements);
  const customerPrimaryKeys = normalizeStringArray(customer.primaryMeasurementKeys);

  type Candidate = RankedRecommendation & {
    groupKey: string;
    fitsAllPrimary: boolean;
  };

  const sortByRank = (left: Candidate, right: Candidate) => {
    if (right.rankPrimaryCoverage !== left.rankPrimaryCoverage) {
      return right.rankPrimaryCoverage - left.rankPrimaryCoverage;
    }

    if (right.rankPrimaryScore !== left.rankPrimaryScore) {
      return right.rankPrimaryScore - left.rankPrimaryScore;
    }

    return right.matchScore - left.matchScore;
  };

  const candidates = brandRows
    .filter((entry) => entry.isActive !== false)
    .filter((entry) => {
      const inferredGender = inferNormalizedGenderFromId(entry.id);
      const genderHint =
        firstText(entry.gender, entry.category) ?? (inferredGender !== 'unknown' ? inferredGender : null);

      return shouldIncludeByGender(customer.gender, genderHint, undefined);
    })
    .filter((entry) => {
      const inferredClothing = inferNormalizedClothingFromId(entry.id);
      const clothingHint =
        firstText(entry.clothingType, entry.subCategory, entry.name) ??
        (inferredClothing !== 'unknown' ? inferredClothing : null);

      return shouldIncludeByClothing(
        customer.preferredClothing,
        clothingHint,
        firstText(entry.subCategory),
        firstText(entry.name)
      );
    })
    .map((entry) => {
      const brandMeasurements = toNumericMeasurements(entry.measurements, entry.unit);
      const brandAverage = calculateAveragePoint(brandMeasurements);
      const sellerPrimaryKeys = normalizeStringArray(entry.primaryMeasurementKeys ?? entry.measurementKeys);

      const primaryResult = calculatePrimaryMeasurementScore(
        customerMeasurements,
        brandMeasurements,
        customerPrimaryKeys,
        sellerPrimaryKeys
      );

      const secondaryResult = calculateSecondaryMeasurementScore(
        customerMeasurements,
        brandMeasurements,
        customerPrimaryKeys.length ? customerPrimaryKeys : sellerPrimaryKeys
      );

      const allCommonKeys = Object.keys(customerMeasurements).filter(
        (key) => key in brandMeasurements
      );
      const allCommonCount = allCommonKeys.length;
      const missingMeasurements = Object.keys(brandMeasurements).filter(
        (key) => !(key in customerMeasurements)
      );

      const averageScore =
        customerAverage !== null && brandAverage !== null
          ? calculateAverageScore(customerAverage, brandAverage)
          : null;

      const primaryScore = primaryResult.score ?? 0;
      const secondaryScore = secondaryResult.score ?? 0;
      const avgScore = averageScore ?? 0;

      // Main measurements get the highest weight, then secondary fields, then average point.
      let rawScore = primaryScore * 0.72 + secondaryScore * 0.18 + avgScore * 0.1;

      if (primaryResult.expectedCount > 0) {
        if (primaryResult.commonCount === 0) {
          rawScore *= 0.2;
        } else {
          const coveragePenalty = (1 - primaryResult.coverage) * 20;
          rawScore -= coveragePenalty;
        }
      }

      const sellerUserId =
        parseSellerUserId(entry.sellerUid) ??
        parseSellerUserId(entry.sellerId) ??
        parseSellerUserId(entry.sellerRef);

      const sizeKey = getSizeKey(entry);
      const brand = getBrandName(entry);
      const groupGender =
        normalizeGenderOrCategory(firstText(entry.gender, entry.category)) !== 'unknown'
          ? normalizeGenderOrCategory(firstText(entry.gender, entry.category))
          : inferNormalizedGenderFromId(entry.id);
      const groupClothing =
        normalizeClothingChoice(firstText(entry.clothingType, entry.subCategory, entry.name)) !==
        'unknown'
          ? normalizeClothingChoice(firstText(entry.clothingType, entry.subCategory, entry.name))
          : inferNormalizedClothingFromId(entry.id);
      const groupKey = `${sellerUserId ?? 'unknown'}|${groupGender}|${groupClothing}`;

      const expectedPrimaryKeys = getExpectedPrimaryKeys(
        customerMeasurements,
        customerPrimaryKeys,
        sellerPrimaryKeys
      );
      const comparablePrimaryKeys = expectedPrimaryKeys.filter((key) => key in brandMeasurements);
      const unavailablePrimaryMeasurementKeys = expectedPrimaryKeys.filter(
        (key) => !(key in brandMeasurements)
      );
      const fitsAllPrimary =
        comparablePrimaryKeys.length > 0 &&
        comparablePrimaryKeys.every((key) => brandMeasurements[key] >= customerMeasurements[key]);
      const hasHighConfidenceData =
        groupClothing === 'shirt'
          ? allCommonKeys.length >= 2 && allCommonKeys.some((key) => SHIRT_HIGH_CONFIDENCE_KEYS.has(key))
          : primaryResult.coverage === 1 && primaryResult.commonCount > 0;
      const primaryMeasurementUnavailable =
        primaryResult.expectedCount > 0 && primaryResult.commonCount === 0;
      const sizeLabel = getSizeLabel(entry);
      const matchScore = Number(clampScore(rawScore).toFixed(1));
      const confidence = hasHighConfidenceData ? 'high' as const : 'limited' as const;
      const confidenceExplanation = confidence === 'high'
        ? `${capitalizeFirst(formatMeasurementList(allCommonKeys))} ${allCommonKeys.length === 1 ? 'was' : 'were'} compared.`
        : primaryMeasurementUnavailable
          ? `${capitalizeFirst(formatMeasurementList(unavailablePrimaryMeasurementKeys))} ${unavailablePrimaryMeasurementKeys.length === 1 ? 'is' : 'are'} missing from this brand's chart.`
          : missingMeasurements.length
            ? `${capitalizeFirst(formatMeasurementList(missingMeasurements))} ${missingMeasurements.length === 1 ? 'is' : 'are'} missing from your profile.`
            : 'Not enough key measurements were available for a high-confidence result.';
      const explanation = primaryMeasurementUnavailable
        ? `No size can be recommended because this chart does not provide ${formatMeasurementList(unavailablePrimaryMeasurementKeys)}.`
        : `${sizeLabel} is the closest available size based on ${formatMeasurementList(allCommonKeys)}.`;
      const reasons = [
        allCommonKeys.length
          ? `Compared ${formatMeasurementList(allCommonKeys)} in centimetres.`
          : null,
        primaryMeasurementUnavailable
          ? `The chart is missing the required ${formatMeasurementList(unavailablePrimaryMeasurementKeys)} measurement.`
          : null,
        missingMeasurements.length
          ? `Add ${formatMeasurementList(missingMeasurements)} to improve recommendation confidence.`
          : null,
        !primaryMeasurementUnavailable && confidence === 'high'
          ? 'Confidence is high because the key fit measurements were comparable.'
          : null,
        !primaryMeasurementUnavailable && confidence === 'limited' && !missingMeasurements.length
          ? 'Confidence is limited because not every key fit measurement was comparable.'
          : null,
      ].filter((reason): reason is string => Boolean(reason));

      return {
        id: entry.id,
        brand,
        title: getTitle(entry),
        recommendedSize: primaryMeasurementUnavailable ? null : sizeLabel,
        sizeLabel,
        sizeKey,
        category: getCategoryLabel(entry),
        subCategory: getSubCategoryLabel(entry),
        unit: 'cm',
        averagePoint: brandAverage,
        score: matchScore,
        matchScore,
        explanation,
        reasons,
        missingMeasurements,
        comparableMeasurements: allCommonKeys,
        imageUrl: getImageUrl(entry) ?? getBrandLogoSource(entry.logoKey, brand),
        commonMeasurementCount: allCommonCount,
        primaryMatchedCount: primaryResult.commonCount,
        primaryExpectedCount: primaryResult.expectedCount,
        availability:
          primaryMeasurementUnavailable
            ? 'primary-measurement-unavailable'
            : 'recommended',
        unavailablePrimaryMeasurementKeys,
        confidence,
        confidenceExplanation,
        sellerUserId,
        rankPrimaryCoverage: primaryResult.coverage,
        rankPrimaryScore: primaryResult.score ?? 0,
        groupKey,
        fitsAllPrimary,
      } satisfies Candidate;
    })
    .filter((entry) => entry.groupKey !== undefined);

  // A chart with no comparable key cannot produce a size recommendation. It is
  // still returned as an informational card so the customer can see why the
  // specific brand is unavailable for their selected measurement profile.
  const comparableCandidates = candidates.filter(
    (entry) => entry.primaryExpectedCount > 0 && entry.primaryMatchedCount > 0
  );
  const unavailableCandidates = candidates.filter(
    (entry) => entry.primaryExpectedCount > 0 && entry.primaryMatchedCount === 0
  );

  // Never surface a "closest" result when its calculated fit is too weak to be
  // useful. A weak score must become a no-recommendation state instead.
  const reliableCandidates = comparableCandidates.filter(
    (entry) => entry.matchScore >= MINIMUM_RELIABLE_MATCH_SCORE
  );

  const selectChartWinners = (entries: Candidate[]) => {
    const grouped = new Map<string, Candidate[]>();
    for (const entry of entries) {
      const current = grouped.get(entry.groupKey);
      if (current) {
        current.push(entry);
      } else {
        grouped.set(entry.groupKey, [entry]);
      }
    }

    return Array.from(grouped.values()).map((group) => {
      const fitting = group.filter((entry) => entry.fitsAllPrimary);

      if (fitting.length) {
        return fitting
          .slice()
          .sort((left, right) => {
            const keyOrder = sortBySizeKeyAsc(left, right);
            if (keyOrder !== 0) return keyOrder;
            return sortByRank(left, right);
          })[0];
      }

      return group
        .slice()
        .sort((left, right) => {
          const rankOrder = sortByRank(left, right);
          if (rankOrder !== 0) return rankOrder;
          return sortBySizeKeyDesc(left, right);
        })[0];
    });
  };

  const rankedRecommendations = selectChartWinners(reliableCandidates)
    .slice()
    .sort(sortByRank)
    .map((entry) => ({ ...entry, availability: 'recommended' as const }));
  const unavailableNotices = selectChartWinners(unavailableCandidates)
    .slice()
    .sort(sortByRank)
    .map((entry) => ({ ...entry, availability: 'primary-measurement-unavailable' as const }));

  const visibleResults = [...rankedRecommendations, ...unavailableNotices].slice(0, limit);

  if (!visibleResults.length) {
    return {
      recommendations: [],
      status: comparableCandidates.length ? 'no-reliable-match' : 'no-comparable-key-measurements',
    };
  }

  return {
    recommendations: visibleResults.map(
      ({
        groupKey: _groupKey,
        fitsAllPrimary: _fits,
        rankPrimaryCoverage: _coverage,
        rankPrimaryScore: _score,
        ...item
      }) => item
    ),
    status: rankedRecommendations.length
      ? 'ready'
      : comparableCandidates.length
        ? 'no-reliable-match'
        : 'no-comparable-key-measurements',
  };
};

export const buildBrandRecommendations = (input: RecommendationInput): BrandRecommendation[] =>
  buildBrandRecommendationResult(input).recommendations;

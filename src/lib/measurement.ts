export type CustomerGender = 'men' | 'women';
export type ClothingChoice = 'shirt' | 'tshirt' | 'trouser' | 'short' | 'blouse' | 'dress';
export type MeasurementFieldKey =
  | 'neck'
  | 'chest'
  | 'bust'
  | 'shoulder'
  | 'sleeve'
  | 'length'
  | 'waist'
  | 'hip'
  | 'thigh'
  | 'inseam'
  | 'outseam';

export type MeasurementField = {
  key: MeasurementFieldKey;
  label: string;
  isPrimary: boolean;
  body: string;
  tip: string;
};

export type ClothingTemplate = {
  profileKey: string;
  gender: CustomerGender;
  choice: ClothingChoice;
  label: string;
  fields: MeasurementField[];
};

export type ClothingOption = {
  key: ClothingChoice;
  label: string;
  subtitle: string;
};

export const DEFAULT_MEASUREMENT_LABELS: Record<MeasurementFieldKey, string> = {
  neck: 'Neck',
  chest: 'Chest',
  bust: 'Bust',
  shoulder: 'Shoulder',
  sleeve: 'Sleeve length',
  length: 'Length',
  waist: 'Waist',
  hip: 'Hip',
  thigh: 'Thigh',
  inseam: 'Inseam length',
  outseam: 'Outseam length',
};

export const CLOTHING_OPTIONS_BY_GENDER: Record<CustomerGender, ClothingOption[]> = {
  men: [
    { key: 'shirt', label: 'Shirt', subtitle: 'Formal and casual shirts' },
    { key: 'tshirt', label: 'T-shirt', subtitle: 'Regular and slim T-shirts' },
    { key: 'trouser', label: 'Trouser', subtitle: 'Pants and denims' },
    { key: 'short', label: 'Short', subtitle: 'Casual shorts' },
  ],
  women: [
    { key: 'blouse', label: 'Blouse', subtitle: 'Blouses and tops' },
    { key: 'tshirt', label: 'T-shirt', subtitle: 'Regular and slim T-shirts' },
    { key: 'trouser', label: 'Trouser', subtitle: 'Pants and denims' },
    { key: 'short', label: 'Short', subtitle: 'Casual shorts' },
    { key: 'dress', label: 'Dress', subtitle: 'One-piece dresses' },
  ],
};

const templates: ClothingTemplate[] = [
  {
    profileKey: 'men_shirt',
    gender: 'men',
    choice: 'shirt',
    label: 'Shirt',
    fields: [
      { key: 'neck', label: 'Neck', isPrimary: true, body: 'Wrap the tape around the base of your neck where a collar sits.', tip: 'Keep one finger inside for comfort.' },
      { key: 'chest', label: 'Chest', isPrimary: false, body: 'Measure around the fullest part of your chest under your arms.', tip: 'Keep the tape level and snug.' },
      { key: 'sleeve', label: 'Sleeve length', isPrimary: false, body: 'Measure from shoulder seam down to your wrist bone.', tip: 'Keep your arm slightly bent.' },
      { key: 'shoulder', label: 'Shoulder', isPrimary: false, body: 'Measure straight across from one shoulder edge to the other.', tip: 'Stand naturally without lifting shoulders.' },
    ],
  },
  {
    profileKey: 'men_tshirt',
    gender: 'men',
    choice: 'tshirt',
    label: 'T-shirt',
    fields: [
      { key: 'chest', label: 'Chest', isPrimary: true, body: 'Measure around the fullest part of your chest.', tip: 'Tape should be parallel to the floor.' },
      { key: 'length', label: 'Length', isPrimary: true, body: 'Measure from highest shoulder point down to preferred hemline.', tip: 'Measure along the front body.' },
      { key: 'shoulder', label: 'Shoulder', isPrimary: false, body: 'Measure straight across from shoulder edge to shoulder edge.', tip: 'Relax posture for accurate width.' },
    ],
  },
  {
    profileKey: 'men_trouser',
    gender: 'men',
    choice: 'trouser',
    label: 'Trouser',
    fields: [
      { key: 'waist', label: 'Waist', isPrimary: true, body: 'Measure around your natural waist where trousers sit comfortably.', tip: 'Do not pull tape too tight.' },
      { key: 'inseam', label: 'Inseam length', isPrimary: false, body: 'Measure from crotch point to ankle along inner leg.', tip: 'Stand straight while measuring.' },
      { key: 'outseam', label: 'Outseam length', isPrimary: false, body: 'Measure from waistline down to ankle along outer leg.', tip: 'Keep tape close to the body.' },
    ],
  },
  {
    profileKey: 'men_short',
    gender: 'men',
    choice: 'short',
    label: 'Short',
    fields: [
      { key: 'waist', label: 'Waist', isPrimary: true, body: 'Measure around your natural waistline.', tip: 'Keep tape flat and level.' },
      { key: 'inseam', label: 'Inseam length', isPrimary: false, body: 'Measure from crotch to desired short hemline.', tip: 'Use a straight posture.' },
    ],
  },
  {
    profileKey: 'women_blouse',
    gender: 'women',
    choice: 'blouse',
    label: 'Blouse',
    fields: [
      { key: 'bust', label: 'Bust', isPrimary: true, body: 'Measure around the fullest part of your bust.', tip: 'Keep tape comfortably snug.' },
      { key: 'length', label: 'Length', isPrimary: true, body: 'Measure from shoulder top down to desired blouse length.', tip: 'Measure along the front line.' },
      { key: 'shoulder', label: 'Shoulder', isPrimary: false, body: 'Measure shoulder edge to shoulder edge.', tip: 'Do not curve the tape.' },
      { key: 'waist', label: 'Waist', isPrimary: false, body: 'Measure around the narrowest part of your waist.', tip: 'Stand naturally and breathe normally.' },
    ],
  },
  {
    profileKey: 'women_tshirt',
    gender: 'women',
    choice: 'tshirt',
    label: 'T-shirt',
    fields: [
      { key: 'bust', label: 'Bust', isPrimary: true, body: 'Measure around the fullest part of your bust.', tip: 'Keep tape level around your back.' },
      { key: 'length', label: 'Length', isPrimary: true, body: 'Measure from highest shoulder point to preferred hemline.', tip: 'Measure in front of the body.' },
      { key: 'shoulder', label: 'Shoulder', isPrimary: false, body: 'Measure shoulder edge to shoulder edge.', tip: 'Keep posture relaxed.' },
      { key: 'waist', label: 'Waist', isPrimary: false, body: 'Measure around your natural waistline.', tip: 'Do not tighten the tape.' },
    ],
  },
  {
    profileKey: 'women_trouser',
    gender: 'women',
    choice: 'trouser',
    label: 'Trouser',
    fields: [
      { key: 'waist', label: 'Waist', isPrimary: true, body: 'Measure around your natural waistline.', tip: 'Tape should sit flat on skin or light clothing.' },
      { key: 'hip', label: 'Hip', isPrimary: false, body: 'Measure around the fullest part of your hips.', tip: 'Keep your feet together.' },
      { key: 'thigh', label: 'Thigh', isPrimary: false, body: 'Measure around the fullest part of one thigh.', tip: 'Measure one leg only.' },
      { key: 'inseam', label: 'Inseam length', isPrimary: false, body: 'Measure from crotch to ankle along inner leg.', tip: 'Use a straight stance.' },
      { key: 'outseam', label: 'Outseam length', isPrimary: false, body: 'Measure from waistline to ankle along outer leg.', tip: 'Keep tape close to body line.' },
    ],
  },
  {
    profileKey: 'women_short',
    gender: 'women',
    choice: 'short',
    label: 'Short',
    fields: [
      { key: 'waist', label: 'Waist', isPrimary: true, body: 'Measure around your natural waistline.', tip: 'Stand naturally without holding breath.' },
      { key: 'hip', label: 'Hip', isPrimary: false, body: 'Measure around the fullest part of your hips.', tip: 'Keep tape horizontal.' },
      { key: 'thigh', label: 'Thigh', isPrimary: false, body: 'Measure around the fullest part of your thigh.', tip: 'Relax your leg muscles.' },
      { key: 'inseam', label: 'Inseam length', isPrimary: false, body: 'Measure from crotch to desired short hemline.', tip: 'Measure on inner leg.' },
    ],
  },
  {
    profileKey: 'women_dress',
    gender: 'women',
    choice: 'dress',
    label: 'Dress',
    fields: [
      { key: 'bust', label: 'Bust', isPrimary: true, body: 'Measure around the fullest part of your bust.', tip: 'Keep tape snug but comfortable.' },
      { key: 'shoulder', label: 'Shoulder', isPrimary: false, body: 'Measure shoulder edge to shoulder edge.', tip: 'Tape should be straight.' },
      { key: 'waist', label: 'Waist', isPrimary: false, body: 'Measure around your natural waistline.', tip: 'Keep tape level and relaxed.' },
      { key: 'length', label: 'Length', isPrimary: true, body: 'Measure from shoulder top to desired dress hemline.', tip: 'Measure vertically in front.' },
    ],
  },
];

const templateMap: Record<string, ClothingTemplate> = Object.fromEntries(
  templates.map((template) => [template.profileKey, template]),
);

export const normalizeGender = (value: string | null | undefined): CustomerGender | null => {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  if (/\b(women|woman|womens|female|girl|girls|lady|ladies)\b/.test(normalized)) return 'women';
  if (/\b(men|man|mens|male|boy|boys)\b/.test(normalized)) return 'men';
  return null;
};

export const normalizeClothingChoice = (value: string | null | undefined): ClothingChoice | null => {
  if (!value) return null;

  const normalized = value.toLowerCase().replace(/[^a-z]/g, '');
  if (normalized === 'tshirt' || normalized === 'tee' || normalized === 'teeshirt') return 'tshirt';
  if (normalized === 'trouser' || normalized === 'trousers' || normalized === 'pant') return 'trouser';
  if (normalized === 'short' || normalized === 'shorts') return 'short';
  if (normalized === 'shirt' || normalized === 'blouse' || normalized === 'dress') return normalized;
  return null;
};

export const getClothingTemplate = (
  gender: CustomerGender | null | undefined,
  choice: ClothingChoice | null | undefined,
): ClothingTemplate | null => {
  if (!gender || !choice) return null;
  return templateMap[`${gender}_${choice}`] ?? null;
};

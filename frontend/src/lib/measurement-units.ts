export type MeasurementUnit = 'cm' | 'in';

const roundForUnit = (value: number, unit: MeasurementUnit) =>
  Number(value.toFixed(unit === 'in' ? 2 : 1));

export function convertMeasurementValue(
  rawValue: string,
  from: MeasurementUnit,
  to: MeasurementUnit,
) {
  if (from === to || !rawValue.trim()) return rawValue;
  const value = Number.parseFloat(rawValue);
  if (!Number.isFinite(value)) return rawValue;
  const converted = from === 'cm' ? value / 2.54 : value * 2.54;
  return String(roundForUnit(converted, to));
}

export function convertMeasurementRecord<T extends Record<string, string | undefined>>(
  values: T,
  from: MeasurementUnit,
  to: MeasurementUnit,
) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, convertMeasurementValue(value ?? '', from, to)]),
  ) as T;
}

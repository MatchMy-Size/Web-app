import { apiRequest } from '@/lib/api-client';

export type MeasurementValidationWarning = {
  code: string;
  field: string;
  message: string;
  enteredValue: number;
  enteredUnit: string;
  suggestedValue: number;
  suggestedUnit: string;
  suggestedInputUnit: string;
};

export type MeasurementValidationResult = {
  valid: boolean;
  warnings: MeasurementValidationWarning[];
};

/**
 * Requests advisory measurement hints before a profile is persisted. This API is
 * intentionally public because it is also used during registration, before an
 * authenticated session exists.
 */
export const validateMeasurements = (input: {
  unit: 'cm' | 'in';
  measurements: Record<string, unknown>;
}) => apiRequest<MeasurementValidationResult>('/api/measurements/validate', {
  method: 'POST',
  authenticated: false,
  body: input,
});

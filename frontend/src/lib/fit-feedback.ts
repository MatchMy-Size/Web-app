import { apiRequest } from '@/lib/api-client';

export type FitExperience = 'TRIED' | 'BOUGHT';
export type FitOutcome = 'TOO_SMALL' | 'PERFECT' | 'TOO_LARGE';

export type FitFeedbackInput = {
  catalogId: string;
  measurementProfileKey: string;
  experience: FitExperience;
  outcome: FitOutcome;
  recommendationScore: number;
  confidence: 'high' | 'limited';
  note?: string | null;
};

export type SavedFitFeedback = {
  id: string;
  experience: FitExperience;
  outcome: FitOutcome;
  createdAt: string;
  updatedAt: string;
};

export const submitFitFeedback = (feedback: FitFeedbackInput) =>
  apiRequest<SavedFitFeedback>('/api/recommendations/feedback', {
    method: 'POST',
    body: feedback,
  });

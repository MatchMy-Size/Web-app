import { apiRequest } from '@/lib/api-client';

export type PublicSiteFeedback = {
  id: string;
  displayName: string;
  rating: number;
  message: string;
  updatedAt: string;
};

export const submitSiteFeedback = (rating: number, message: string) =>
  apiRequest<PublicSiteFeedback>('/api/feedback', {
    method: 'POST',
    body: { rating, message },
  });

export const getPublicSiteFeedback = () =>
  apiRequest<PublicSiteFeedback[]>('/api/feedback/public', {
    authenticated: false,
  });

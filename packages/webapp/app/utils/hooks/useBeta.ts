import { useLocation } from '@remix-run/react';

/**
 * Returns true if the beta query param is set to true.
 * 
 * Useful for testing new features in production without affecting users.
 */
export function useBeta(): boolean {
  const { search } = useLocation();
  const query = new URLSearchParams(search).get('beta');

  return query === 'true';
}
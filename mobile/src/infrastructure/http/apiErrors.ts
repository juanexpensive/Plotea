import { BACKEND_URL } from './backendUrl';

export function isUnauthorizedError(error: unknown): boolean {
  return getStatusCode(error) === 401;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const status = getStatusCode(error);

  if (status === 502 || status === 503) {
    return 'El backend responde, pero TMDB no está disponible ahora mismo.';
  }

  return `${fallback} Backend actual: ${BACKEND_URL}`;
}

function getStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) {
    return undefined;
  }

  const response = (error as { response?: { status?: number } }).response;
  return response?.status;
}

import { BACKEND_URL } from './backendUrl';

export function isUnauthorizedError(error: unknown): boolean {
  return getStatusCode(error) === 401;
}

export function getErrorStatusCode(error: unknown): number | undefined {
  return getStatusCode(error);
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const status = getStatusCode(error);
  const detail = getDetailMessage(error);

  if (detail) {
    return detail;
  }

  if (status === 502 || status === 503) {
    return 'El backend responde, pero TMDB no esta disponible ahora mismo.';
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

function getDetailMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) {
    return undefined;
  }

  const response = (
    error as {
      response?: { data?: { detail?: string } };
    }
  ).response;
  return response?.data?.detail;
}

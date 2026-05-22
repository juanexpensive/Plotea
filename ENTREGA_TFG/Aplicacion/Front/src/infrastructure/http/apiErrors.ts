export function isUnauthorizedError(error: unknown): boolean {
  return getStatusCode(error) === 401;
}

export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const axiosLikeError = error as { code?: string; response?: unknown; request?: unknown };
  if (axiosLikeError.response) {
    return false;
  }

  return Boolean(axiosLikeError.request) || axiosLikeError.code === 'ECONNABORTED';
}

export function getErrorStatusCode(error: unknown): number | undefined {
  return getStatusCode(error);
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const status = getStatusCode(error);
  const detail = getDetailMessage(error);

  if (isTmdbUnavailable(status, detail)) {
    return 'El backend responde, pero TMDB no esta disponible ahora mismo.';
  }

  if (detail) {
    return detail;
  }

  if (isNetworkError(error)) {
    return `${fallback} Revisa tu conexion e intentalo de nuevo.`;
  }

  return `${fallback} Intentalo de nuevo en unos instantes.`;
}

function isTmdbUnavailable(status: number | undefined, detail: string | undefined): boolean {
  if (status === 502 || status === 503) {
    return true;
  }

  if (!detail) {
    return false;
  }

  const normalizedDetail = detail.toLowerCase();
  return normalizedDetail.includes('tmdb') || normalizedDetail.includes('cannot reach');
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

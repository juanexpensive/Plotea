import { router } from 'expo-router';
import { isUnauthorizedError } from '../http/apiErrors';

export function redirectToLogin() {
  router.replace('/login');
}

export function redirectToLoginIfUnauthorized(error: unknown): boolean {
  if (!isUnauthorizedError(error)) {
    return false;
  }

  redirectToLogin();
  return true;
}

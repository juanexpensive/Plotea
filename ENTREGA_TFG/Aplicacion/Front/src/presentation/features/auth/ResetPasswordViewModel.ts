import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { resetPassword } from '../../../data/repositories/AuthRepository';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';

export function useResetPasswordViewModel(initialToken?: string | string[]) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof initialToken === 'string') {
      setToken(initialToken);
      return;
    }

    if (Array.isArray(initialToken) && initialToken.length > 0) {
      setToken(initialToken[0]);
    }
  }, [initialToken]);

  async function handleSubmit() {
    if (!token || !password) {
      setError('Necesitas un token valido y una nueva contrasena.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const responseMessage = await resetPassword(token, password);
      setMessage(responseMessage);
    } catch (error) {
      setError(getApiErrorMessage(error, 'No se pudo restablecer la contrasena.'));
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    router.replace('/login');
  }

  return {
    token,
    setToken,
    password,
    setPassword,
    loading,
    error,
    message,
    handleSubmit,
    goToLogin,
  };
}

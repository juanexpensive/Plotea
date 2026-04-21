import { router } from 'expo-router';
import { useState } from 'react';
import { forgotPassword } from '../../../data/repositories/AuthRepository';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';

export function useForgotPasswordViewModel() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email) {
      setError('Introduce tu email');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const responseMessage = await forgotPassword(email);
      setMessage(responseMessage);
    } catch (error) {
      setError(getApiErrorMessage(error, 'No se pudo enviar el correo de recuperacion.'));
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    router.replace('/login');
  }

  return {
    email,
    setEmail,
    loading,
    error,
    message,
    handleSubmit,
    goToLogin,
  };
}

import { router } from 'expo-router';
import { useState } from 'react';
import { login } from '../../../data/repositories/AuthRepository';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';
import { tokenStorage } from '../../../infrastructure/storage/tokenStorage';

export function useLoginViewModel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email || !password) {
      setError('Rellena todos los campos');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tokens = await login(email, password);
      await tokenStorage.save(tokens.access_token);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('Credenciales incorrectas');
      } else if (status === 422) {
        setError('Datos inválidos. Revisa el email.');
      } else {
        setError(getApiErrorMessage(err, 'Error de conexión al iniciar sesión.'));
      }
    } finally {
      setLoading(false);
    }
  }

  function goToRegister() {
    router.replace('/register');
  }

  return { email, setEmail, password, setPassword, loading, error, handleLogin, goToRegister };
}

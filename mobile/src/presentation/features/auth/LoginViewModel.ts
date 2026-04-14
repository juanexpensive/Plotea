import { router } from 'expo-router';
import { useState } from 'react';
import { login } from '../../../data/repositories/AuthRepository';

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
      await login(email, password);
      router.replace('/home');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('Credenciales incorrectas');
      } else if (status === 422) {
        setError('Datos inválidos. Revisa el email.');
      } else {
        setError('Error de conexión. ¿Está el backend corriendo?');
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
